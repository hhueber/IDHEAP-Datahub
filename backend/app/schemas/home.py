"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from pydantic import BaseModel


class SurveyLite(BaseModel):
    uid: int
    year: int


class HomeInfo(BaseModel):
    """Host payload."""

    message: str
    surveys: list[SurveyLite]
    stats: dict[str, int] | None = None
