import io


from app.db import get_db
from app.schemas.export import ExportRequest
from app.services.export_service import export_csv_service
from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.post("/csv")
async def export_csv(
    payload: ExportRequest,
    db: AsyncSession = Depends(get_db),
    accept_language: str | None = Header(None, alias="Accept-Language"),
):
    lang = (accept_language or "en")[:2]

    csv_bytes = await export_csv_service(db=db, questions=payload.questions, lang=lang)

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=data.csv"},
    )
