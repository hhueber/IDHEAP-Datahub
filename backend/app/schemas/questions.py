from typing import List, Optional


from pydantic import BaseModel


# TODO: modifier quand data obtenue QuestionMeta enlever code et label -> question dans la langue demandée
class QuestionMeta(BaseModel):
    uid: int
    code: str
    label: str
    group: Optional[str] = None


class QuestionList(BaseModel):
    items: List[QuestionMeta]


class SurveyBrief(BaseModel):
    uid: int
    year: int


class HomeBootstrap(BaseModel):
    message: str
    surveys: List[SurveyBrief]
    globals: QuestionList
