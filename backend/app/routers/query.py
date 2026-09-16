from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models import Repo
from app.tokens import verify_access_token
# from app.agent.pipeline import run_agent

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    repo_id: str
    question: str


class QueryResponse(BaseModel):
    answer: str
    intent: str
    touched_node_ids: list[str]
    confidence: dict


@router.post("", response_model=QueryResponse)
def query(
    payload: QueryRequest,
    user_id: str = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    from app.agent.pipeline import run_agent
    repo = db.query(Repo).filter(Repo.id == payload.repo_id, Repo.user_id == user_id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repo not found")

    if repo.status != "indexed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Repo is not indexed yet (status: {repo.status})")

    result = run_agent(payload.question, payload.repo_id)

    return QueryResponse(
        answer=result["answer"],
        intent=result["intent"],
        touched_node_ids=result["touched_node_ids"],
        confidence=result["confidence"],
    )