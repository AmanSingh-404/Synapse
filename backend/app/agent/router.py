from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.config import settings

ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You classify questions about a codebase into one of three categories:

- "structural" — questions about relationships in the code: what calls what, what imports what, what breaks if something changes, dependency chains. Answerable only by traversing a call/import graph.
- "semantic" — questions about what code does, its purpose, documentation, or lookup-style questions ("what does X do", "show me the function that handles Y"). Answerable by searching docstrings/comments.
- "hybrid" — questions that need both: understanding what something does AND tracing its relationships (e.g. "explain how the login flow works end to end").

Respond with ONLY one word: structural, semantic, or hybrid. No explanation."""),
    ("user", "{question}"),
])


def get_router_chain():
    llm = ChatGroq(api_key=settings.groq_api_key, model="openai/gpt-oss-120b", temperature=0)
    return ROUTER_PROMPT | llm | StrOutputParser()


def classify_intent(question: str) -> str:
    chain = get_router_chain()
    result = chain.invoke({"question": question}).strip().lower()

    if result not in ("structural", "semantic", "hybrid"):
        return "hybrid"  # safe fallback if the LLM returns something unexpected

    return result