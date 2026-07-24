from pathlib import Path
from typing import Any


from app.services.data_import.data_import_normalizer_service import normalize_dataframe_values
from app.services.data_import.data_import_reader_service import read_import_file
from app.services.data_import.data_import_storage_service import read_metadata, write_json
import pandas as pd


def get_workspace_dir(import_dir: Path) -> Path:
    workspace_dir = import_dir / "workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)

    return workspace_dir


def build_import_workspace(
    import_dir: Path,
) -> tuple[pd.DataFrame, dict[str, dict[str, Any]]]:
    metadata = read_metadata(import_dir)
    resources = metadata.get("resources") or []

    if not resources:
        raise ValueError("Import does not contain any resource")

    frames: list[pd.DataFrame] = []
    row_origins: dict[str, dict[str, Any]] = {}

    global_row_index = 0

    for resource in resources:
        raw_path = import_dir / str(resource["raw_path"])

        if not raw_path.exists():
            raise ValueError(f"Resource file not found: {resource.get('display_name')}")

        resource_frame = read_import_file(raw_path)
        resource_frame = normalize_dataframe_values(resource_frame)
        resource_frame = make_columns_unique(resource_frame)

        for source_row_index in range(len(resource_frame)):
            row_origins[str(global_row_index)] = {
                "resource_id": str(resource["resource_id"]),
                "source_id": str(resource["source_id"]),
                "filename": resource.get("filename"),
                "sheet_name": resource.get("sheet_name"),
                "display_name": resource.get("display_name"),
                "source_row_index": source_row_index,
            }

            global_row_index += 1

        frames.append(resource_frame)

    if not frames:
        raise ValueError("Import does not contain readable data")

    combined_frame = pd.concat(
        frames,
        axis=0,
        ignore_index=True,
        sort=False,
    )

    combined_frame = combined_frame.fillna("")

    workspace_dir = get_workspace_dir(import_dir)

    combined_frame.to_pickle(workspace_dir / "frame.pkl")

    write_json(
        workspace_dir / "row_origins.json",
        row_origins,
    )

    return combined_frame, row_origins


def make_columns_unique(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()

    seen: dict[str, int] = {}
    columns: list[str] = []

    for raw_column in result.columns:
        base_name = str(raw_column).strip() or "unnamed"
        occurrence = seen.get(base_name, 0)

        if occurrence == 0:
            unique_name = base_name
        else:
            unique_name = f"{base_name}_{occurrence + 1}"

        seen[base_name] = occurrence + 1
        columns.append(unique_name)

    result.columns = columns

    return result
