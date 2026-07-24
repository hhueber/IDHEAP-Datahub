from app.api.permissions import require_permission
from app.config.roles import PermissionLevel, PermissionScope
from app.db import get_db
from app.schemas.data_import import (
    DataImportAnalyzeResponse,
    DataImportCellPatch,
    DataImportColumnPatch,
    DataImportColumnsConfirmPatch,
    DataImportColumnTransformPatch,
    DataImportDeleteResponse,
    DataImportIssuesResponse,
    DataImportListResponse,
    DataImportNamePatch,
    DataImportNameResponse,
    DataImportPatchResponse,
    DataImportPatchWithAnalysisResponse,
    DataImportPreviewResponse,
    DataImportResourcesResponse,
    DataImportUploadResponse,
    DataImportWorkspaceUploadResponse,
    DataImportYearsPatch,
    DataImportYearsResponse,
    ImportSectionEnum,
)
from app.services.data_import.data_import_patch_service import (
    confirm_import_columns,
    patch_import_cell,
    patch_import_column,
    patch_import_column_transform,
)
from app.services.data_import.data_import_service import (
    add_files_to_import_workspace,
    analyze_import_file,
    create_import_workspace,
    delete_import_job,
    get_import_issue_groups,
    get_import_summary,
    list_import_jobs,
    list_import_resources,
    preview_import_section,
    save_import_upload,
    update_import_display_name,
    update_import_years,
)
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.post("/upload", response_model=DataImportUploadResponse)
async def upload_data_file(
    file: UploadFile = File(...),
    years: list[int] = Form(...),
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await save_import_upload(file=file, years=years)

    return {
        "success": True,
        "detail": "File uploaded",
        "data": data,
    }


@router.patch("/{import_id}/name", response_model=DataImportNameResponse)
async def update_data_import_name(
    import_id: str,
    payload: DataImportNamePatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await update_import_display_name(
        import_id=import_id,
        display_name=payload.display_name,
    )

    return {
        "success": True,
        "detail": "Import name updated",
        "data": data,
    }


@router.post("/{import_id}/analyze", response_model=DataImportAnalyzeResponse)
async def analyze_data_file(
    import_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await analyze_import_file(db, import_id=import_id)

    return {
        "success": True,
        "detail": "File analyzed",
        "data": data,
    }


@router.get("/{import_id}/preview", response_model=DataImportPreviewResponse)
async def preview_data_file(
    import_id: str,
    section: ImportSectionEnum = Query(ImportSectionEnum.responses),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=10, le=200),
    issues_only: bool = Query(False),
    search: str | None = Query(None, max_length=120),
    detected_type: str | None = Query(None),
    column_index: int | None = Query(None, ge=0),
    sort_column_index: int | None = Query(None, ge=0),
    sort_direction: str = Query("asc", pattern="^(asc|desc)$"),
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await preview_import_section(
        import_id=import_id,
        section=section,
        page=page,
        per_page=per_page,
        issues_only=issues_only,
        search=search,
        detected_type=detected_type,
        column_index=column_index,
        sort_column_index=sort_column_index,
        sort_direction=sort_direction,
    )

    return {
        "success": True,
        "detail": "Preview loaded",
        "data": data,
    }


@router.patch("/{import_id}/cell", response_model=DataImportPatchWithAnalysisResponse)
async def update_import_cell(
    import_id: str,
    payload: DataImportCellPatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    analysis = await patch_import_cell(import_id=import_id, payload=payload)

    return {
        "success": True,
        "detail": "Cell updated",
        "data": analysis,
    }


@router.patch("/{import_id}/column", response_model=DataImportPatchWithAnalysisResponse)
async def update_import_column(
    import_id: str,
    payload: DataImportColumnPatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    analysis = await patch_import_column(import_id=import_id, payload=payload)

    return {
        "success": True,
        "detail": "Column updated",
        "data": analysis,
    }


@router.patch("/{import_id}/column-transform", response_model=DataImportPatchWithAnalysisResponse)
async def update_import_column_transform(
    import_id: str,
    payload: DataImportColumnTransformPatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    analysis = await patch_import_column_transform(import_id=import_id, payload=payload)

    return {
        "success": True,
        "detail": "Column transformed",
        "data": analysis,
    }


@router.get("", response_model=DataImportListResponse)
async def list_data_imports(
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await list_import_jobs()

    return {
        "success": True,
        "detail": "Imports loaded",
        "data": data,
    }


@router.get("/{import_id}/issues", response_model=DataImportIssuesResponse)
async def get_data_import_issues(
    import_id: str,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await get_import_issue_groups(import_id)

    return {
        "success": True,
        "detail": "Import issues loaded",
        "data": data,
    }


@router.get("/{import_id}/summary", response_model=DataImportAnalyzeResponse)
async def get_data_import_summary(
    import_id: str,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await get_import_summary(import_id)

    return {
        "success": True,
        "detail": "Import summary loaded",
        "data": data,
    }


@router.patch("/{import_id}/years", response_model=DataImportYearsResponse)
async def update_data_import_years(
    import_id: str,
    payload: DataImportYearsPatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    data = await update_import_years(
        import_id=import_id,
        years=payload.years,
    )

    return {
        "success": True,
        "detail": "Import years updated",
        "data": data,
    }


@router.delete("/{import_id}", response_model=DataImportDeleteResponse)
async def delete_data_import(
    import_id: str,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    await delete_import_job(import_id)

    return {
        "success": True,
        "detail": "Import deleted",
    }


@router.patch("/{import_id}/columns/confirm", response_model=DataImportPatchWithAnalysisResponse)
async def confirm_data_import_columns(
    import_id: str,
    payload: DataImportColumnsConfirmPatch,
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.MANAGE)),
):
    analysis = await confirm_import_columns(
        import_id=import_id,
        column_indexes=payload.column_indexes,
    )

    return {
        "success": True,
        "detail": "Columns confirmed",
        "data": analysis,
    }


@router.post("/upload/batch", response_model=DataImportWorkspaceUploadResponse)
async def upload_data_files(
    files: list[UploadFile] = File(...),
    display_name: str | None = Form(None),
    years: list[int] = Form(...),
    _current_user=Depends(
        require_permission(
            PermissionScope.DATASET,
            PermissionLevel.MANAGE,
        )
    ),
):
    data = await create_import_workspace(
        files=files,
        display_name=display_name,
        years=years,
    )

    return {
        "success": True,
        "detail": "Files uploaded",
        "data": data,
    }


@router.post("/{import_id}/files", response_model=DataImportWorkspaceUploadResponse)
async def get_data_import_files(
    import_id: str,
    files: list[UploadFile] = File(...),
    _current_user=Depends(
        require_permission(
            PermissionScope.DATASET,
            PermissionLevel.MANAGE,
        )
    ),
):
    data = await list_import_resources(import_id=import_id, files=files)

    return {
        "success": True,
        "detail": "Import resources loaded",
        "data": data,
    }


@router.get("/{import_id}/files", response_model=DataImportResourcesResponse)
async def get_data_import_files(
    import_id: str,
    _current_user=Depends(
        require_permission(
            PermissionScope.DATASET,
            PermissionLevel.MANAGE,
        )
    ),
):
    data = await list_import_resources(import_id)

    return {
        "success": True,
        "detail": "Import resources loaded",
        "data": data,
    }
