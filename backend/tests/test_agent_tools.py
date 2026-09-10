from app.agent.tools import graph_query, vector_search

REPO_ID = "f9db6f53-a15a-4fa2-ac60-80fc95df0510"  # ANVIL


def test_graph_query_callees():
    results = graph_query(REPO_ID, "chat", direction="callees")
    assert isinstance(results, list)


def test_vector_search_returns_relevant_results():
    results = vector_search(REPO_ID, "how does the agent manage sessions", limit=3)
    assert len(results) > 0
    assert any("session" in r["text"].lower() for r in results)