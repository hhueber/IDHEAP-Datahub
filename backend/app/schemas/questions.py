from typing import List, Optional


from pydantic import BaseModel


# Modèles Pydantic (schémas de données) utilisés par l'API FastAPI.
# Ils décrivent la forme des objets échangés entre backend et frontend.


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
    """Payload initial renvoyé par l'API pour la page d'accueil."""

    message: str
    surveys: List[SurveyBrief]
    globals: QuestionList
