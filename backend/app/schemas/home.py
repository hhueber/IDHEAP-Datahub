"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from typing import Dict, List, Optional


from pydantic import BaseModel


class SurveyLite(BaseModel):
    uid: int
    year: int


class HomeInfo(BaseModel):
    """Host payload."""

    message: str
    surveys: List[SurveyLite]
    stats: Optional[Dict[str, int]] = None
