import json
from neo4j import GraphDatabase
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.config import settings
from app.agent.tools import graph_query, vector_search


from app.db_clients import get_neo4j_driver


EXTRACT_TARGET_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Given a question about a codebase, extract the single most likely
function, class, or file name being asked about — even if the question uses a
general concept rather than the exact identifier. Map common nouns to their
likely code identifier: code tends to use CamelCase for classes and
snake_case for functions. Prefer guessing a specific, plausible identifier
over giving up.

Examples:
Q: "How does the agent handle sessions?"
A: Session

Q: "What breaks if I change the chat function's signature?"
A: chat

Q: "Who calls forge_tool?"
A: forge_tool

Q: "What does the codebase do overall?"
A: NONE

Respond with ONLY the name, no explanation. Only respond "NONE" if the
question is genuinely too broad or general for any single identifier to apply."""),
    ("user", "{question}"),
])

CONFIDENCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are assessing whether the retrieved context below is enough
to answer the question. Respond with ONLY valid JSON in this exact format:
{{"confident": true or false, "reason": "brief reason"}}"""),
    ("user", "Question: {question}\n\nRetrieved context:\n{context}"),
])


def get_llm():
    return ChatGroq(api_key=settings.groq_api_key, model="openai/gpt-oss-120b", temperature=0)


def extract_target_name(question: str) -> str:
    chain = EXTRACT_TARGET_PROMPT | get_llm() | StrOutputParser()
    result = chain.invoke({"question": question}).strip()
    return result if result != "NONE" else None


def find_closest_node_name(repo_id: str, guessed_name: str) -> str | None:
    """
    Verify the LLM's guessed name actually exists in the graph.
    If not, try a case-insensitive substring match as a fallback.
    """
    driver = get_neo4j_driver()
    with driver.session() as session:
        # Exact match first
        result = session.run(
            "MATCH (n {name: $name, repo_id: $repo_id}) RETURN n.name AS name LIMIT 1",
            name=guessed_name, repo_id=repo_id,
        )
        record = result.single()
        if record:
            driver.close()
            return record["name"]

        # Fuzzy fallback: substring match either direction
        result = session.run(
            """
            MATCH (n {repo_id: $repo_id})
            WHERE toLower(n.name) CONTAINS toLower($partial)
               OR toLower($partial) CONTAINS toLower(n.name)
            RETURN n.name AS name LIMIT 1
            """,
            partial=guessed_name, repo_id=repo_id,
        )
        record = result.single()
        driver.close()
        return record["name"] if record else None


def assess_confidence(question: str, context: str) -> dict:
    chain = CONFIDENCE_PROMPT | get_llm() | StrOutputParser()
    raw = chain.invoke({"question": question, "context": context}).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"confident": True, "reason": "could not parse confidence check, proceeding"}


def format_context(graph_results, vector_results) -> str:
    parts = []
    if graph_results:
        parts.append("Graph traversal results:")
        for r in graph_results:
            parts.append(f"  - {r['type']} '{r['name']}' in {r['file_path']}")
    if vector_results:
        parts.append("\nSemantic search results:")
        for r in vector_results:
            parts.append(f"  - {r['text']}")
    return "\n".join(parts) if parts else "No context retrieved."


def run_reasoning(question: str, repo_id: str, intent: str) -> dict:
    """
    Multi-hop reasoning: retrieve based on intent, assess confidence,
    re-plan with a follow-up retrieval if confidence is low.
    """
    raw_target_name = extract_target_name(question)
    target_name = find_closest_node_name(repo_id, raw_target_name) if raw_target_name else None

    graph_results = []
    vector_results = []

    if intent in ("structural", "hybrid") and target_name:
        graph_results = graph_query(repo_id, target_name, direction="callers")
        if not graph_results:
            graph_results = graph_query(repo_id, target_name, direction="callees")

    if intent in ("semantic", "hybrid"):
        vector_results = vector_search(repo_id, question, limit=5)

    context = format_context(graph_results, vector_results)
    confidence = assess_confidence(question, context)

    # Re-plan loop: if not confident and we haven't tried the other retrieval path yet, try it
    if not confidence.get("confident", True):
        if not vector_results:
            vector_results = vector_search(repo_id, question, limit=5)
        elif not graph_results and target_name:
            graph_results = graph_query(repo_id, target_name, direction="callees")

        context = format_context(graph_results, vector_results)
        confidence = assess_confidence(question, context)

    return {
        "context": context,
        "graph_results": graph_results,
        "vector_results": vector_results,
        "confidence": confidence,
        "target_name": target_name,
        "raw_target_guess": raw_target_name,
    }