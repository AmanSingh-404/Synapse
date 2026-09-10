from app.agent.router import classify_intent
from app.agent.reasoning import run_reasoning
from app.agent.synthesis import synthesize_answer, collect_touched_node_ids


def run_agent(question: str, repo_id: str) -> dict:
    intent = classify_intent(question)
    reasoning_result = run_reasoning(question, repo_id, intent)

    answer = synthesize_answer(question, reasoning_result["context"])
    touched_node_ids = collect_touched_node_ids(
        reasoning_result["graph_results"],
        reasoning_result["vector_results"],
    )

    return {
        "answer": answer,
        "intent": intent,
        "touched_node_ids": touched_node_ids,
        "confidence": reasoning_result["confidence"],
    }