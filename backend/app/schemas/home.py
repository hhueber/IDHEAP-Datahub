from typing import Dict, List, Optional


from pydantic import BaseModel


class SurveyLite(BaseModel):
    uid: int
    year: int


class HomeInfo(BaseModel):
    message: str
    surveys: List[SurveyLite]
    stats: Optional[Dict[str, int]] = None
