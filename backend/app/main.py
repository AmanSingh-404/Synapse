from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, repos, query

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Synapse")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(repos.router)
app.include_router(query.router)


@app.get("/health")
def health():
    return {"status": "ok"}