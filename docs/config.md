# Config

The `.env` file contains the following variables:

- Database:
    - DB_HOST: database's IP, or localhost if local; default `localhost`.
    - DB_PORT: database's port; default `5432`.
    - DB_NAME: database name; default `datahub`.
    - DB_USER: database user; default `postgres`.
    - DB_PASSWORD: PostgreSQL database user's password, default `postgres`.
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
