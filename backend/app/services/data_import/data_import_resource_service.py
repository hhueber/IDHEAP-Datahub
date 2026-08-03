from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import shutil
import uuid


from app.services.data_import.data_import_storage_service import (
    create_resource_dir,
    create_source_dir,
    extract_sheet_convert_to_csv,
)
from fastapi import UploadFile


SUPPORTED_SUFFIXES = {".csv", ".xlsx", ".xls"}


async def add_upload_to_import(
    *,
    import_dir: Path,
    file: UploadFile,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    filename = file.filename or "import"
    suffix = Path(filename).suffix.lower()

    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError("Unsupported file format")

    source_id = str(uuid.uuid4())
    source_dir = create_source_dir(import_dir, source_id)

    original_path = source_dir / f"original{suffix}"

    content = await file.read()
    original_path.write_bytes(content)

    if not content:
        raise ValueError(f"File is empty: {filename}")

    resources = create_resources_from_source(
        import_dir=import_dir,
        source_id=source_id,
        filename=filename,
        suffix=suffix,
        original_path=original_path,
    )

    now = datetime.now(timezone.utc).isoformat()

    source = {
        "source_id": source_id,
        "filename": filename,
        "size": len(content),
        "suffix": suffix,
        "original_path": str(original_path.relative_to(import_dir)),
        "resource_ids": [resource["resource_id"] for resource in resources],
        "created_at": now,
    }

    return source, resources


def create_resources_from_source(
    *,
    import_dir: Path,
    source_id: str,
    filename: str,
    suffix: str,
    original_path: Path,
) -> list[dict[str, Any]]:
    if suffix == ".csv":
        return [
            create_csv_resource(
                import_dir=import_dir,
                source_id=source_id,
                filename=filename,
                source_path=original_path,
                sheet_name=None,
            )
        ]

    return create_excel_resources(
        import_dir=import_dir,
        source_id=source_id,
        filename=filename,
        original_path=original_path,
    )


def create_csv_resource(
    *,
    import_dir: Path,
    source_id: str,
    filename: str,
    source_path: Path,
    sheet_name: str | None,
) -> dict[str, Any]:
    resource_id = str(uuid.uuid4())
    resource_dir = create_resource_dir(import_dir, resource_id)
    raw_path = resource_dir / "raw.csv"

    shutil.copy2(source_path, raw_path)

    display_name = f"{filename} — {sheet_name}" if sheet_name else filename

    return {
        "resource_id": resource_id,
        "source_id": source_id,
        "filename": filename,
        "sheet_name": sheet_name,
        "display_name": display_name,
        "raw_path": str(raw_path.relative_to(import_dir)),
        "analyzed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def create_excel_resources(
    *,
    import_dir: Path,
    source_id: str,
    filename: str,
    original_path: Path,
) -> list[dict[str, Any]]:
    source_dir = original_path.parent

    files_before = {path.resolve() for path in source_dir.glob("raw_*.csv")}

    # Fonction existante conservée sans modification.
    extract_sheet_convert_to_csv(original_path)

    generated_paths = sorted(path for path in source_dir.glob("raw_*.csv") if path.resolve() not in files_before)

    if not generated_paths:
        raise ValueError(f"No readable sheet found in {filename}")

    resources: list[dict[str, Any]] = []

    for generated_path in generated_paths:
        sheet_name = extract_sheet_name(generated_path)

        resources.append(
            create_csv_resource(
                import_dir=import_dir,
                source_id=source_id,
                filename=filename,
                source_path=generated_path,
                sheet_name=sheet_name,
            )
        )

        generated_path.unlink(missing_ok=True)

    return resources


def extract_sheet_name(path: Path) -> str:
    stem = path.stem

    if stem.startswith("raw_"):
        return stem[len("raw_") :]

    return stem
