from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.config import settings

SYNTHESIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a code assistant answering questions about a specific codebase.
Use ONLY the retrieved context below to answer — don't invent details not present in it.
If the context is insufficient to fully answer, say what you can and note what's missing.
Be concise and direct, like a senior engineer explaining code to a colleague."""),
    ("user", "Question: {question}\n\nRetrieved context:\n{context}"),
])


def get_llm():
    return ChatGroq(api_key=settings.groq_api_key, model="openai/gpt-oss-120b", temperature=0.2)


def synthesize_answer(question: str, context: str) -> str:
    chain = SYNTHESIS_PROMPT | get_llm() | StrOutputParser()
    return chain.invoke({"question": question, "context": context})


def collect_touched_node_ids(graph_results: list, vector_results: list) -> list[str]:
    """
    Returns the set of node identifiers (by name, since that's what we have
    from both retrieval paths) that were used to construct the answer —
    for frontend graph highlighting.
    """
    ids = set()
    for r in graph_results:
        ids.add(r.get("name"))
    for r in vector_results:
        ids.add(r.get("name"))
    return list(ids)