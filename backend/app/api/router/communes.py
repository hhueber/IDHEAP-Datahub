from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.commune_map_repo import get_commune_point
from app.repositories.commune_repo import suggest_communes_prefix
from app.schemas.placeOfInterest import PlaceOfInterestSuggestOut, PlaceOfInterestSuggestResponse
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/suggest")
async def suggest(
    q: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    data = await suggest_communes_prefix(db, q=q, limit=limit)
    return {"success": True, "detail": "OK", "data": data}


@router.get("/{uid}/point")
async def commune_point(uid: int, db: AsyncSession = Depends(get_db), _user: UserPublic = Depends(get_current_user)):
    pos = await get_commune_point(db, uid)
    if not pos:
        return {"success": False, "detail": "No geometry for this commune"}
    lat, lon = pos
    return {"success": True, "detail": "OK", "data": {"lat": lat, "lon": lon}}


@router.get("/suggest/public", response_model=PlaceOfInterestSuggestResponse)
async def suggest_communes_public(
    q: str = Query(..., min_length=3, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Route publique (pas besoin d'utilisateur connecté).
    - Utilise suggest_communes_prefix pour la recherche texte.
    - Utilise get_commune_point pour récupérer [lat, lon].
    - Ne renvoie que default_name + pos.
    - Lecture seule (SELECT uniquement).
    """

    rows = await suggest_communes_prefix(db, q=q, limit=limit)

    placeOfInterest: list[PlaceOfInterestSuggestOut] = []

    for row in rows:
        pos = await get_commune_point(db, row["uid"])
        if not pos:
            continue

        # On choisit le name "par défaut" à exposer au public
        default_name = row.get("name") or row.get("code")  # fallback ultime
        if not default_name:
            continue

        placeOfInterest.append(
            PlaceOfInterestSuggestOut(
                default_name=default_name,
                pos=(float(pos[0]), float(pos[1])),
            )
        )

    return PlaceOfInterestSuggestResponse(
        success=True,
        detail="OK",
        data=placeOfInterest,
    )
