from app.api.dependencies import get_current_user
from app.db import get_db
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.repositories.pageShow_repo import get_canton_by_ofs, get_commune_by_ofs, get_district_by_ofs
from app.schemas.pageShow import CantonResponse, CommuneResponse, DistrictResponse
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/commune/{id}", response_model=CommuneResponse)
async def get_commune(id: str, db: AsyncSession = Depends(get_db)):
    commune: Commune = await get_commune_by_ofs(db, id)

    if commune is None:
        return {"success": True, "detail": "None", "data": None}

    return {
        "success": True,
        "detail": "Ok",
        "data": {
            "uid": commune.uid,
            "code": commune.code,
            "name": commune.name,
            "name_de": commune.name_de,
            "name_fr": commune.name_fr,
            "name_en": commune.name_en,
            "name_ro": commune.name_ro,
            "name_it": commune.name_it,
        },
    }


@router.get("/district/{id}", response_model=DistrictResponse)
async def get_district(id: str, db: AsyncSession = Depends(get_db)):
    district: District = await get_district_by_ofs(db, id)

    if district is None:
        return {"success": True, "detail": "None", "data": None}

    return {
        "success": True,
        "detail": "Ok",
        "data": {
            "uid": district.uid,
            "code": district.code,
            "name": district.name,
            "name_de": district.name_de,
            "name_fr": district.name_fr,
            "name_en": district.name_en,
            "name_ro": district.name_ro,
            "name_it": district.name_it,
        },
    }


@router.get("/canton/{id}", response_model=CantonResponse)
async def get_canton(id: str, db: AsyncSession = Depends(get_db)):
    canton: Canton = await get_canton_by_ofs(db, id)

    if canton is None:
        return {"success": True, "detail": "None", "data": None}

    return {
        "success": True,
        "detail": "Ok",
        "data": {
            "uid": canton.uid,
            "code": canton.code,
            "name": canton.name,
            "ofs_id": canton.ofs_id,
            "name_de": canton.name_de,
            "name_fr": canton.name_fr,
            "name_en": canton.name_en,
            "name_ro": canton.name_ro,
            "name_it": canton.name_it,
        },
    }
