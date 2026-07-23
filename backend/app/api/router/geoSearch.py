from typing import Literal


from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.geo_search_repo import build_geo_names, get_geo_point, resolve_geo_name, suggest_geo_locations
from app.schemas.placeOfInterest import (
    GeoPointResponse,
    GeoSuggestionResponse,
    PlaceOfInterestSuggestOut,
    PlaceOfInterestSuggestResponse,
)
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/suggest/geo", response_model=GeoSuggestionResponse)
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


@router.get("/{geo_type}/{uid}/point", response_model=GeoPointResponse)
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
async def suggest_geo_public(
    q: str = Query(..., min_length=3, max_length=100),
    lang: str = Query("en", description="ISO code de langue, ex: fr, de, it, ro, en"),
    limit: int = Query(50, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Recherche publique des suggestions géographiques parmi les communes, districts et cantons.
    Cette route ne nécessite pas d'utilisateur connecté.
    Elle est utilisée par la carte publique pour ajouter temporairement des lieux
    d'intérêt visibles sur la carte.

    La recherche fonctionne sur :
    - les communes ;
    - les districts ;
    - les cantons.

    Chaque résultat contient :
    - le type d'entité ;
    - son uid ;
    - son code ;
    - son nom affichable ;
    - un point géographique représentatif `[lat, lon]`.

    Args:
        q: Texte saisi par l'utilisateur.
        limit: Nombre maximum de résultats à retourner.
        db: Session de base de données asynchrone.

    Returns:
        PlaceOfInterestSuggestResponse: Liste des suggestions publiques avec position.
    """
    rows = await suggest_geo_locations(db, q=q, limit=limit)

    place_of_interest: list[PlaceOfInterestSuggestOut] = []

    for row in rows:
        pos = await get_geo_point(db, row["type"], row["uid"])
        if not pos:
            continue

        # On choisit le name "par défaut" à exposer au public
        default_name = row.get("name") or row.get("code")
        if not default_name:
            continue

        localized_name = resolve_geo_name(row, lang)

        if not localized_name:
            continue

        place_of_interest.append(
            PlaceOfInterestSuggestOut(
                uid=row["uid"],
                type=row["type"],
                code=row["code"],
                name=localized_name,
                default_name=default_name,
                names=build_geo_names(row),
                pos=(float(pos[0]), float(pos[1])),
            )
        )

    return PlaceOfInterestSuggestResponse(
        success=True,
        detail="OK",
        data=place_of_interest,
    )
