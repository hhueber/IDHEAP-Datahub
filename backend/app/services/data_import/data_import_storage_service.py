# Sert a stocker les données importées temporairement sur le backend.
from pathlib import Path
from typing import Any, List
import json
import shutil


from app.services.data_import.data_import_reader_service import read_import_file
import pandas as pd


UPLOAD_DIR = Path("tmp/data_imports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_import_dir(import_id: str) -> Path:
    import_dir = UPLOAD_DIR / import_id

    if not import_dir.exists():
        raise ValueError("Import not found")

    return import_dir


def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def extract_sheet_convert_to_csv(path: Path) -> List[Path]:
    filename_list: List[Path] = []
    all_sheet = pd.read_excel(str(path), sheet_name=None)
    parent_dir = path.parent
    for sheetname, df in all_sheet.items():
        csv_filename = f"raw_{sheetname}.csv"
        file_path = parent_dir / Path(csv_filename)
        df.to_csv(file_path, index=False, encoding="utf-8")

        filename_list.append(file_path)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_metadata(import_dir: Path) -> dict[str, Any]:
    return read_json(import_dir / "metadata.json")


def write_metadata(import_dir: Path, metadata: dict[str, Any]) -> None:
    write_json(import_dir / "metadata.json", metadata)


def get_workspace_dir(import_dir: Path) -> Path:
    workspace_dir = import_dir / "workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)

    return workspace_dir


def delete_import_dir(import_id: str) -> None:
    import_dir = get_import_dir(import_id)
    shutil.rmtree(import_dir)


def get_sources_dir(import_dir: Path) -> Path:
    path = import_dir / "sources"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_resources_dir(import_dir: Path) -> Path:
    path = import_dir / "resources"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_source_dir(import_dir: Path, source_id: str) -> Path:
    source_dir = get_sources_dir(import_dir) / source_id

    if not source_dir.exists() or not source_dir.is_dir():
        raise ValueError("Import source not found")

    return source_dir


def get_resource_dir(import_dir: Path, resource_id: str) -> Path:
    resource_dir = get_resources_dir(import_dir) / resource_id

    if not resource_dir.exists() or not resource_dir.is_dir():
        raise ValueError("Import resource not found")

    return resource_dir


def create_source_dir(import_dir: Path, source_id: str) -> Path:
    source_dir = get_sources_dir(import_dir) / source_id
    source_dir.mkdir(parents=True, exist_ok=False)
    return source_dir


def create_resource_dir(import_dir: Path, resource_id: str) -> Path:
    resource_dir = get_resources_dir(import_dir) / resource_id
    resource_dir.mkdir(parents=True, exist_ok=False)
    return resource_dir


def read_analysis(import_dir: Path) -> dict[str, Any]:
    path = get_workspace_dir(import_dir) / "analysis.json"

    if not path.exists():
        raise ValueError("Import has not been analyzed yet")

    return read_json(path)


def write_analysis(
    import_dir: Path,
    analysis: dict[str, Any],
) -> None:
    write_json(get_workspace_dir(import_dir) / "analysis.json", analysis)


def read_issues(
    import_dir: Path,
) -> dict[str, list[dict[str, Any]]]:
    path = get_workspace_dir(import_dir) / "issues.json"

    if not path.exists():
        raise ValueError("Import issues have not been generated yet")

    return read_json(path)


def write_issues(
    import_dir: Path,
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> None:
    write_json(
        get_workspace_dir(import_dir) / "issues.json",
        issues_by_column,
    )


def read_frame(import_dir: Path) -> pd.DataFrame:
    frame_path = get_workspace_dir(import_dir) / "frame.pkl"

    if not frame_path.exists():
        raise ValueError("Import workspace has not been built yet")

    return pd.read_pickle(frame_path)


def write_frame(
    import_dir: Path,
    df: pd.DataFrame,
) -> None:
    df.to_pickle(get_workspace_dir(import_dir) / "frame.pkl")


def resource_has_analysis(
    import_dir: Path,
    resource_id: str,
) -> bool:
    resource_dir = get_resource_dir(import_dir, resource_id)

    return (
        (resource_dir / "analysis.json").exists()
        and (resource_dir / "issues.json").exists()
        and (resource_dir / "frame.pkl").exists()
    )


def invalidate_import_workspace(
    import_dir: Path,
) -> None:
    workspace_dir = import_dir / "workspace"

    if workspace_dir.exists():
        shutil.rmtree(workspace_dir)

    metadata = read_metadata(import_dir)
    metadata["analyzed"] = False
    write_metadata(import_dir, metadata)
