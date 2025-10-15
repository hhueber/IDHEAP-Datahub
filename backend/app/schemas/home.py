from typing import Dict, List, Optional


from pydantic import BaseModel


# Modèles Pydantic (schémas de données) utilisés par l'API FastAPI.
# Ils décrivent la forme des objets échangés entre backend et frontend.


class SurveyLite(BaseModel):
    uid: int
    year: int


class HomeInfo(BaseModel):
    message: str
    surveys: List[SurveyLite]
    stats: Optional[Dict[str, int]] = None
