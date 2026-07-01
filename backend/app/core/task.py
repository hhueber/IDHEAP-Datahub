from pathlib import Path
import os
import time


from app.services.data_import.data_import_storage_service import create_archive


def compress_work_directory():
    UPLOAD_DIR = Path("tmp/data_imports")
    threshold = time.time() - 7200
    for dir in UPLOAD_DIR.iterdir():
        if dir.is_dir():
            if dir.stat().st_mtime < threshold:
                create_archive(dir.name)
