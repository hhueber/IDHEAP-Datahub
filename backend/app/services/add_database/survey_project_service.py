from app.models.project import Project
from app.models.project_author import ProjectAuthor
from app.models.project_metadata import ProjectMetadata
from app.models.user import User
from app.schemas.data_import import DataImportNewProject
from sqlalchemy.ext.asyncio import AsyncSession


async def create_project(db: AsyncSession, owner: User, payload: DataImportNewProject) -> Project:
    authors = []
    links = [{"name": link.name, "url": link.url} for link in payload.links]
    for author in payload.authors:
        db_project_author = ProjectAuthor(first_name=author.first_name, last_name=author.last_name, email=author.email)
        db.add(db_project_author)
        authors.append(db_project_author)

    await db.commit()

    db_project_metadata = ProjectMetadata()
    db_project = Project()
