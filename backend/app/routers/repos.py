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