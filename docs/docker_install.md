# Docker installation

## Setup

Prerequisites: [Docker](https://www.docker.com/) installed.

1. Clone the repo, go into it.
     - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Create a local `.env` file.
     - `make .env`

## Config

Edit the `.env` with your configuration. Please change at least:
- `DB_HOST` - change it for `db`
- `API_SECRET`
- `SECRET_KEY`
- `ROOT_EMAIL`
- `ROOT_PASSWORD`

More information in [Config](./config.md).

## Quick start

To start the **entire project** (DB + API + Front + DB schema init) **without any local setup** (no venv, no local Node), simply run:

```bash
make docker
```

This command will:

- build and start PostgreSQL (with volumes).
- build and start the FastAPI API.
- run the database schema initialization (schema_db_init service).
- build and start the Frontend.
- then follow the logs of the API and the Front.

### Useful commands

Stop all and remove project containers + volumes:

```bash
make docker_clean
```

Full cleanup (containers, images, volumes, cache):

```bash
make docker_fclean
```
