from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()
_started_at = datetime.now(timezone.utc).isoformat()


@router.get("/health")
async def health():
    return {"status": "ok", "started_at": _started_at}
