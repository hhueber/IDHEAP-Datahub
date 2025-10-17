"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from typing import List, Optional


from pydantic import BaseModel


class QuestionItem(BaseModel):
    uid: int
    label: str
    text: str


class QuestionList(BaseModel):
    items: List[QuestionItem]


class SurveyBrief(BaseModel):
    uid: int
    year: int


class HomeBootstrap(BaseModel):
    """Initial payload returned by the API for the home page."""

    message: str
    surveys: List[SurveyBrief]
    globals: QuestionList
