from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.grading import router as grading_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Future: start apscheduler here once Phase 3 is implemented
    yield
    # Future: shutdown scheduler


app = FastAPI(title="Outround AI Harness", version="0.1.0", lifespan=lifespan)

app.include_router(health_router)
app.include_router(grading_router)
