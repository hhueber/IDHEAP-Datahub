from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.author_metadata_association import AuthorMetadataAssociation
from app.models.metadata import Metadata
from app.schemas.data_import import DataImportProjectMetadataData
from app.services.data_import.data_import_storage_service import (
    get_import_dir,
    read_dataset_metadata,
    read_metadata,
    write_dataset_metadata,
)


async def get_dataset_metadata(import_id: str) -> DataImportProjectMetadataData:
    import_dir = get_import_dir(import_id)
    dataset_metadata = read_dataset_metadata(import_dir)
    return dataset_metadata


async def update_dataset_metadata(
    import_id: str, data: DataImportProjectMetadataData
) -> None:
    import_dir = get_import_dir(import_id)
    write_dataset_metadata(import_dir, data.model_dump(mode="json"))


async def get_project_metadata(
    db: AsyncSession, import_id: str
) -> DataImportProjectMetadataData:
    import_dir = get_import_dir(import_id)
    import_metadata = read_metadata(import_dir)
    project_uid = import_metadata["project_id"]

    stmt = (
        select(Metadata)
        .where(Metadata.project_uid == project_uid)
        .options(
            selectinload(Metadata.author_association).selectinload(
                AuthorMetadataAssociation.author
            )
        )
    )

    result = await db.execute(stmt)
    metadata = result.scalar_one_or_none()
    if not metadata:
        return None

    return DataImportProjectMetadataData(
        name=metadata.name,
        description=metadata.description,
        licence=metadata.licence,
        links=metadata.links,
        authors=[
            {
                "first_name": association.author.first_name,
                "last_name": association.author.last_name,
                "email": association.author.email,
            }
            for association in metadata.author_association
        ],
    )
