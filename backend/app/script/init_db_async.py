import asyncio


from app import models
from app.db import engine, AsyncSessionLocal
from app.models import Base
from app.script.populate_db import populate_db
from app.core.config import settings
from app.repositories.user_repo import any_admin_exists, create_user


async def create_schema() -> None:
    async with engine.begin() as conn:
        # Drop toute les tables pour repartir de 0
        await conn.run_sync(Base.metadata.drop_all)
        # Cree les tables dans la base de données
        await conn.run_sync(Base.metadata.create_all)
    print("All Database schema created.")

    # Populate la base de donnée
    await populate_db()
    print("Database Populated with sucess")

    if settings.ROOT_EMAIL and settings.ROOT_PASSWORD:
        async with AsyncSessionLocal() as db:
            admin_exists = await any_admin_exists(db)
            if not admin_exists:
                admin = await create_user(db, settings.ROOT_EMAIL, settings.ROOT_PASSWORD, settings.ROOT_NAME, role="ADMIN")
                print("Root admin created:", admin.email)
            else:
                print("Admin user(s) already exist; skipping root seed.")
    else:
        print("ROOT_EMAIL or ROOT_PASSWORD not set; no root created.")


if __name__ == "__main__":
    asyncio.run(create_schema())
