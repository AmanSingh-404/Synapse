import os
import uuid
import shutil
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
from git import Repo as GitRepo, GitCommandError
from pydantic import BaseModel

from app.db import get_db
from app.models import User, Repo
from app.tokens import verify_access_token
from app.config import settings

from app.ingestion.python_parser import parse_repo
from app.ingestion.chunker import extract_chunks
from app.ingestion.neo4j_loader import Neo4jLoader
from app.ingestion.weaviate_loader import WeaviateLoader

router = APIRouter(prefix="/repos", tags=["repos"])
repo_logger = logging.getLogger("synapse.repos")

WORKSPACE_ROOT = os.path.join(os.getcwd(), "workspaces")


class ConnectRepoRequest(BaseModel):
    github_url: str


@router.post("/connect", status_code=status.HTTP_201_CREATED)
def connect_repo(
    payload: ConnectRepoRequest,
    user_id: str = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.encrypted_github_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No GitHub account connected")

    fernet = Fernet(settings.fernet_key.encode())
    github_token = fernet.decrypt(user.encrypted_github_token.encode()).decode()

    repo_name = payload.github_url.rstrip("/").split("/")[-1].replace(".git", "")
    repo_id = uuid.uuid4()
    local_path = os.path.join(WORKSPACE_ROOT, str(repo_id))

    os.makedirs(WORKSPACE_ROOT, exist_ok=True)

    # Inject the token into the clone URL for private repo access
    clone_url = payload.github_url.replace("https://", f"https://{github_token}@")

    repo_record = Repo(
        id=repo_id,
        user_id=user.id,
        github_url=payload.github_url,
        name=repo_name,
        status="pending",
    )
    db.add(repo_record)
    db.commit()

    try:
        GitRepo.clone_from(clone_url, local_path)
    except GitCommandError as e:
        repo_record.status = "failed"
        db.commit()
        repo_logger.error(f"clone failed repo={repo_name} error={e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to clone repository")

    repo_record.status = "cloned"
    repo_record.local_path = local_path
    db.commit()

    repo_logger.info(f"repo cloned repo_id={repo_id} name={repo_name}")
    return {"repo_id": str(repo_id), "name": repo_name, "status": "cloned"}



@router.post("/{repo_id}/ingest")
def ingest_repo(
    repo_id: str,
    user_id: str = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == user_id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repo not found")

    if repo.status not in ("cloned", "failed", "indexed"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Repo is currently '{repo.status}'")

    try:
        # Stage 1: parsing
        repo.status = "parsing"
        db.commit()
        nodes, edges = parse_repo(repo.local_path, repo_id)

        # Stage 2: graph build
        repo.status = "building_graph"
        db.commit()
        neo4j_loader = Neo4jLoader()
        neo4j_loader.load_repo(repo_id, nodes, edges)
        neo4j_loader.close()

        # Stage 3: embedding
        repo.status = "embedding"
        db.commit()
        chunks = extract_chunks(nodes)
        weaviate_loader = WeaviateLoader()
        weaviate_loader.load_chunks(repo_id, chunks)
        weaviate_loader.close()

        # Done
        repo.status = "indexed"
        repo.node_count = len(nodes)
        repo.edge_count = len(edges)
        db.commit()

        repo_logger.info(f"repo ingested repo_id={repo_id} nodes={len(nodes)} edges={len(edges)}")
        return {"repo_id": repo_id, "status": "indexed", "node_count": len(nodes), "edge_count": len(edges)}

    except Exception as e:
        repo.status = "failed"
        db.commit()
        repo_logger.error(f"ingestion failed repo_id={repo_id} error={e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ingestion failed")


@router.get("/{repo_id}/status")
def get_repo_status(
    repo_id: str,
    user_id: str = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == user_id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repo not found")

    return {
        "repo_id": str(repo.id),
        "name": repo.name,
        "status": repo.status,
        "node_count": repo.node_count,
        "edge_count": repo.edge_count,
    }

@router.get("/github/list")
def list_github_repos(
    user_id: str = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.encrypted_github_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No GitHub account connected")

    fernet = Fernet(settings.fernet_key.encode())
    github_token = fernet.decrypt(user.encrypted_github_token.encode()).decode()

    import httpx
    with httpx.Client() as client:
        response = client.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"},
            params={"sort": "updated", "per_page": 30},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch repos from GitHub")

    repos = response.json()
    return [
        {"name": r["full_name"], "url": r["html_url"], "private": r["private"], "updated_at": r["updated_at"]}
        for r in repos
    ]