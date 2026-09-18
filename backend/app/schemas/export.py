from typing import Literal


from pydantic import BaseModel


class ExportQuestion(BaseModel):
    uid: int
    scope: Literal["global", "per_survey"]
    survey_uid: int | None


class ExportRequest(BaseModel):
    questions: list[ExportQuestion]
