from typing import Literal


from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.commune_map_repo import get_commune_point
from app.repositories.commune_repo import suggest_communes_prefix
from app.repositories.geo_search_repo import get_geo_point, suggest_geo_locations
from app.schemas.placeOfInterest import PlaceOfInterestSuggestOut, PlaceOfInterestSuggestResponse
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/suggest/geo")
async def suggest_geo(
    q: str = Query(..., min_length=3, max_length=100),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Recherche des suggestions géographiques parmi les communes, districts et cantons.

    La recherche est déclenchée à partir de 3 caractères et retourne une liste
    unifiée de résultats contenant leur type (`commune`, `district` ou `canton`).

    Les résultats sont triés par pertinence :
    - correspondance exacte ;
    - nom qui commence par la recherche ;
    - nom qui contient la recherche ;
    - priorité par type : commune, district, canton.

    Args:
        q: Texte saisi par l'utilisateur.
        limit: Nombre maximum de résultats à retourner.
        db: Session de base de données asynchrone.
        _user: Utilisateur courant authentifié.

    Returns:
        dict: Réponse JSON contenant la liste des suggestions géographiques.
    """
    data = await suggest_geo_locations(db, q=q, limit=limit)
    return {"success": True, "detail": "OK", "data": data}


@router.get("/{geo_type}/{uid}/point")
async def geo_point(
    geo_type: Literal["commune", "district", "canton"],
    uid: int,
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Récupère un point géographique représentatif pour une commune, un district ou un canton.

    Pour une commune, le point correspond directement à sa géométrie enregistrée.
    Pour un district ou un canton, le point est calculé à partir des communes liées,
    afin d'obtenir une position centrale approximative utilisable dans l'interface.

    Args:
        geo_type: Type d'entité géographique (`commune`, `district` ou `canton`).
        uid: Identifiant unique de l'entité géographique.
        db: Session de base de données asynchrone.
        _user: Utilisateur courant authentifié.

    Returns:
        dict: Réponse JSON contenant la latitude et la longitude si disponibles.
    """
    pos = await get_geo_point(db, geo_type, uid)
    if not pos:
        return {
            "success": False,
            "detail": f"No geometry for this {geo_type}",
        }
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
