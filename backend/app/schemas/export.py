from typing import List, Literal, Optional


from pydantic import BaseModel


class ExportQuestion(BaseModel):
    uid: int
    scope: Literal["global", "per_survey"]
    survey_uid: Optional[int]


class ExportRequest(BaseModel):
    questions: List[ExportQuestion]
