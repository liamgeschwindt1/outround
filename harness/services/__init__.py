import instructor
from anthropic import Anthropic

from app.config import settings

_client: instructor.client.Instructor | None = None


def get_client() -> instructor.client.Instructor:
    """Return a singleton Instructor-wrapped Anthropic client."""
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        anthropic = Anthropic(api_key=settings.anthropic_api_key)
        _client = instructor.from_anthropic(
            anthropic,
            mode=instructor.Mode.ANTHROPIC_TOOLS,
        )
    return _client
