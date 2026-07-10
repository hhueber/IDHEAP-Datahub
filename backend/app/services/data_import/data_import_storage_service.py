# Sert a stocker les données importées temporairement sur le backend.
from pathlib import Path
from typing import Any, List
import json
import shutil


from app.services.data_import.data_import_reader_service import read_import_file
import pandas as pd


UPLOAD_DIR = Path("tmp/data_imports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# TODO: modifier la logique de stockage par la suite en .parquet ou autres formats
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


def read_analysis(import_dir: Path) -> dict[str, Any]:
    return read_json(import_dir / "analysis.json")


def write_analysis(import_dir: Path, analysis: dict[str, Any]) -> None:
    write_json(import_dir / "analysis.json", analysis)


def read_issues(import_dir: Path) -> dict[str, list[dict[str, Any]]]:
    return read_json(import_dir / "issues.json")


def write_issues(
    import_dir: Path,
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> None:
    write_json(import_dir / "issues.json", issues_by_column)


def read_frame(import_dir: Path) -> pd.DataFrame:
    frame_path = import_dir / "frame.pkl"

    if not frame_path.exists():
        metadata = read_metadata(import_dir)
        return read_import_file(Path(metadata["raw_path"]))

    return pd.read_pickle(frame_path)


def write_frame(import_dir: Path, df: pd.DataFrame) -> None:
    df.to_pickle(import_dir / "frame.pkl")


def delete_import_dir(import_id: str) -> None:
    import_dir = get_import_dir(import_id)
    shutil.rmtree(import_dir)
