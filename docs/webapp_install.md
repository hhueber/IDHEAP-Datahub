# Webapp Install

## Setup app

```bash
git clone git@github.com:hhueber/IDHEAP-Datahub.git
cd IDHEAP-Datahub/
python -m venv ./venv
source ./venv/bin/activate
pip install -r requirements.txt
cp .env.dist .env
```

Then, edit `.env`, with the following information:

- DB_HOST: database's IP, or localhost if local; default `localhost`.
- DB_PORT: database's port; default `5432`.
- DB_NAME: database name; default `datahub`.
- DB_USER: database user; default `postgres`.
- DB_PASSWORD: PostgreSQL database user's password, NO DEFAULT CHANGE THE PASSWORD.
- BACKEND_HOST: backend's IP, or localhost if local; default `localhost`.
- BACKEND_PORT: backend's port; default `8765`.
- FRONTEND_HOST: frontend's IP, or localhost if local; default `localhost`.
- FRONTEND_PORT: frontend's port; default `3210`.
- API_SECRET: key used for CORS access; NO DEFAULT CHANGE THE KEY.
- CORS_ORIGINS: [Cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) link; default `http://localhost:3210`.
    - Should be `http(s)://FRONTEND_HOST:FRONTEND_PORT`!
- SECRET_KEY: key used to generate the cookies; NO DEFAULT CHANGE THE KEY.
- ALGORITHM: algorithm used for JWS verification, see https://datatracker.ietf.org/doc/html/rfc7518#section-3; default `HS256`.
- ACCESS_TOKEN_EXPIRE_MINUTES: ; default `60`.
- ROOT_EMAIL: Instance super admin account login; default `admin@example.com`.
- ROOT_PASSWORD: Instance super admin account password; NO DEFAULT CHANGE THE KEY.
- ROOT_NAME: Instance super admin account name; default `Admin Root`.
- COOKIE_SECURE: Boolean, enforce HTTPS; default `False`.
    - Should be `True` in prod!
- COOKIE_SAMESITE: Forbid sending cookies via cross-origin requests, can be `lax`, `strict`, `none`; default `lax`.
    - Should be `strict` in prod!

## Use

You need two separate terminal, one for the backend, the other for the frontend.

First, make sure the .venv is activated: `source ./venv/bin/activate`. Then, in the root folder:
- Backend: `PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8642 --reload --env-file .env`.
- Frontend: `npm --prefix frontend run dev -- --host 0.0.0.0 --port 3210`.

Use Ctrl+C to kill if needed.
