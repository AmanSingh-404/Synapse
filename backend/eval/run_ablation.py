import json
import csv
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agent.tools import vector_search
from app.agent.synthesis import synthesize_answer
from app.agent.pipeline import run_agent

REPO_ID = "f9db6f53-a15a-4fa2-ac60-80fc95df0510"  # ANVIL
QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "questions.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "results.csv")


def vector_only_answer(question: str, repo_id: str) -> str:
    """
    The 'vector-only RAG' baseline: semantic search over docstring chunks,
    no graph traversal at all — this is what a plain embeddings-wrapper
    chatbot would do.
    """
    results = vector_search(repo_id, question, limit=5)
    if not results:
        context = "No context retrieved."
    else:
        context = "Semantic search results:\n" + "\n".join(
            f"  - {r['text']}" for r in results
        )
    return synthesize_answer(question, context)


def main():
    with open(QUESTIONS_PATH, "r") as f:
        questions = json.load(f)

    rows = []
    for i, q in enumerate(questions, 1):
        print(f"[{i}/{len(questions)}] ({q['bucket']}) {q['question']}")

        vector_answer = vector_only_answer(q["question"], REPO_ID)
        full_result = run_agent(q["question"], REPO_ID)

        rows.append({
            "id": q["id"],
            "bucket": q["bucket"],
            "question": q["question"],
            "vector_only_answer": vector_answer,
            "full_pipeline_answer": full_result["answer"],
            "full_pipeline_intent": full_result["intent"],
            "vector_only_correct": "",   # fill in manually: 1 or 0
            "full_pipeline_correct": "",  # fill in manually: 1 or 0
        })

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. Results written to {OUTPUT_PATH}")
    print("Now: open the CSV, read each answer pair, and fill in the two 'correct' columns with 1 or 0.")


if __name__ == "__main__":
    main()