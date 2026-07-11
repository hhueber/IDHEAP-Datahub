from app.api.permissions import require_permission
from app.config.roles import PermissionLevel, PermissionScope
from app.db import get_db
from app.repositories.config_repo import get_theme_config, upsert_theme_config
from app.repositories.placeOfInterest_repo import (
    delete_placeOfInterest,
    get_placeOfInterest,
    list_placeOfInterest,
    upsert_placeOfInterest,
)
from app.schemas.geo import GeoBundle
from app.schemas.placeOfInterest import PlaceOfInterestIn
from app.schemas.theme_config import LogoUploadPayload, ThemeConfig
from app.services.config_service import handle_logo_data_url
from app.services.geo_service import ALL_LAYERS, get_geo_by_year_selective
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/placeOfInterest")
async def placeOfInterest_list(
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.READ)),
):
    data = await list_placeOfInterest(db)
    return {"success": True, "detail": "OK", "data": data}


@router.get("/placeOfInterest/{code}")
async def placeOfInterest_get(
    code: str,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    c = await get_placeOfInterest(db, code)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PlaceOfInterest not found")
    return {
        "success": True,
        "detail": "OK",
        "data": {
            "code": c.code,
            "default_name": c.default_name,
            "name_fr": c.name_fr,
            "name_de": c.name_de,
            "name_it": c.name_it,
            "name_ro": c.name_ro,
            "name_en": c.name_en,
            "pos": list(c.pos),
        },
    }


@router.post("/placeOfInterest")
async def placeOfInterest_upsert(
    payload: PlaceOfInterestIn,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    await upsert_placeOfInterest(db, payload.model_dump())
    await db.commit()
    return {"success": True, "detail": "Saved"}


@router.delete("/placeOfInterest/{code}")
async def placeOfInterest_delete(
    code: str,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.MANAGE)),
):
    ok = await delete_placeOfInterest(db, code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PlaceOfInterest not found")
    await db.commit()
    return {"success": True, "detail": "Deleted"}


@router.get("/theme")
async def theme_config_get(
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.READ)),
):
    """
    Récupère toute la config de thème / instance.
    """
    cfg = await get_theme_config(db)
    return {"success": True, "detail": "OK", "data": cfg.model_dump()}


@router.put("/theme")
async def theme_config_update(
    payload: ThemeConfig,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    """
    Met à jour la config de thème.
    - Ne modifie que les champs envoyés
    - payload[key] = null  => supprime la clé dans la table config
    - payload[key] = "..." => upsert
    """
    await upsert_theme_config(db, payload)
    await db.commit()
    cfg = await get_theme_config(db)
    return {"success": True, "detail": "Saved", "data": cfg.model_dump()}


@router.post("/theme/logo")
async def theme_logo_upload_base64(
    payload: LogoUploadPayload,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    """
    Upload du logo de l'instance via JSON (data URL base64).
    Toute la logique est dans handle_logo_data_url.
    """
    public_url = await handle_logo_data_url(db, payload.image_data)
    await db.commit()

    return {
        "success": True,
        "detail": "Logo updated",
        "data": {"url": public_url},
    }


@router.get("/theme/map-preview")
async def theme_map_preview(
    db: AsyncSession = Depends(get_db),
    current=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.READ)),
):
    """
    Retourne les données GeoJSON nécessaires à la preview de la carte
    dans la page de configuration du thème.

    On prend la dernière année disponible côté géo.
    """
    latest_year = None

    bundle = await get_geo_by_year_selective(
        db,
        latest_year,
        layers=set(ALL_LAYERS),
        clear_others=True,
    )
    data = bundle.model_dump()

    return {
        "success": True,
        "detail": "OK",
        "data": {
            "year": data.get("year"),
            "country": data.get("country"),
            "lakes": data.get("lakes"),
            "cantons": data.get("cantons"),
            "districts": data.get("districts"),
            "communes": data.get("communes"),
        },
    }
