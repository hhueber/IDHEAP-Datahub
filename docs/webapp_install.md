# Webapp installation

## Setup

1. Clone the repo, go into it.
     - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Create a [virtual environment](https://docs.python.org/3/library/venv.html).
     - `python -m venv ./venv`
3. Activate it.
    - `source ./venv/bin/activate`
4. Install requirements.
     - `pip install -r requirements.txt`
5. Create a local `.env` file.
     - `cp .env.dist .env`

## Config

Edit `.env`, with the following information:

- Database:
    - DB_HOST: database's IP, or localhost if local; default `localhost`.
    - DB_PORT: database's port; default `5432`.
    - DB_NAME: database name; default `datahub`.
    - DB_USER: database user; default `postgres`.
    - DB_PASSWORD: PostgreSQL database user's password, NO DEFAULT CHANGE THE PASSWORD.
- Backend:
    - BACKEND_HOST: backend's IP, or localhost if local; default `localhost`.
    - BACKEND_PORT: backend's port; default `8765`.
- Frontend:
    - FRONTEND_HOST: frontend's IP, or localhost if local; default `localhost`.
    - FRONTEND_PORT: frontend's port; default `3210`.
- Secrets:
    - API_SECRET: key used for CORS access; NO DEFAULT CHANGE THE KEY.
    - SECRET_KEY: key used to generate the cookies; NO DEFAULT CHANGE THE KEY.
- Security / API:
    - ALGORITHM: algorithm used for JWS verification, see https://datatracker.ietf.org/doc/html/rfc7518#section-3; default `HS256`.
    - ACCESS_TOKEN_EXPIRE_MINUTES: ; default `60`.
- Cookie auth:
    - COOKIE_SECURE: Boolean, enforce HTTPS; default `False`.
        - Should be `True` in prod!
    - COOKIE_SAMESITE: Forbid sending cookies via cross-origin requests, can be `lax`, `strict`, `none`; default `lax`.
        - Should be `strict` in prod!
- CORS:
    - CORS_ORIGINS: [Cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) link; default `http://$FRONTEND_HOST:$FRONTEND_PORT`.
- Super admin instance account
    - ROOT_EMAIL: Instance super admin account login; default `admin@example.com`.
    - ROOT_PASSWORD: Instance super admin account password; NO DEFAULT CHANGE THE KEY.
    - ROOT_NAME: Instance super admin account name; default `Admin Root`.

## Initial database creation

**_TODO: "Naked" app with no data, cf. [#124](https://github.com/hhueber/IDHEAP-Datahub/issues/124)._**

**⚠️ Warning**: If you already have a database, this step might result in loss of data.

In the root folder:
1. Make sure the `.venv/` is activated.
    - `source ./venv/bin/activate`
2. Export the `.env`.
    - `source .env`
3. Put your data files in the `./backend/app/data/` folder. **As of 2025-10-27**:
    - `CodeBook_Cleaned.xlsx`
    - `EtatCommunes.xlsx`
    - `GSB 2023_V1.csv`
    - `mon_fichier_indexed.csv`
    - `QuestionsGlobales.csv`
4. Execute database script.
    - `PYTHONPATH=backend .venv/bin/python -m app.script.init_db_async`

## Quick start

You need two separate terminal, one for the backend, the other for the frontend.

For each terminal, in the root folder:
1. Make sure the `.venv/` is activated.
    - `source ./venv/bin/activate`
2. Export the `.env`.
    - `source .env`

Then, separately, still in the root folder:
- Backend: `PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload --env-file .env`
- Frontend: `npm --prefix frontend run dev -- --host $FRONTEND_HOST --port $FRONTEND_PORT`

Use Ctrl+C to kill if needed.
