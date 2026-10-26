from app.models.author import Author
from app.models.author_metadata_association import AuthorMetadataAssociation
from app.models.granularity import GranularityEnum
from app.models.metadata import Metadata
from app.models.project import Project
from app.models.user import User
from app.schemas.data_import import DataImportNewProject
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def get_projects(db: AsyncSession, owner: User) -> list[Project]:
    result = await db.execute(select(Project).options(selectinload(Project.metadatas)))
    return list(result.scalars().all())


async def create_project(
    db: AsyncSession, owner: User, payload: DataImportNewProject
) -> Project:
    db_project = Project()
    db.add(db_project)
    await db.commit()

    authors = []
    links = [{"name": link.name, "url": link.url} for link in payload.links]
    for author in payload.authors:
        db_author = Author(
            first_name=author.first_name, last_name=author.last_name, email=author.email
        )
        db.add(db_author)
        authors.append(db_author)

    await db.commit()

    db_metadata = Metadata(
        name=payload.name,
        description=payload.description,
        licence=payload.licence,
        links=links,
        granularity=GranularityEnum.COMMUNE,
        project=db_project,
    )

    db.add(db_metadata)
    await db.commit()

    for author in authors:
        db_project_author_association = AuthorMetadataAssociation(
            author=author, metadatas=db_metadata
        )
        db.add(db_project_author_association)

    await db.commit()

    return db_project
