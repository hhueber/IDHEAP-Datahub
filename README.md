# IDHEAP Datahub

Projet de visualisation de données géographiques longitudinales.

## Setup

1. Clone the repo, go into it.
   - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Create a [virtual environment](https://docs.python.org/3/library/venv.html), and activate it.
   - `python -m venv ./venv; source ./venv/bin/activate`
3. Install requirements.
   - `pip install -r requirements.txt`
4. Activate [`pre-commit`](https://pre-commit.com/).
   - `pre-commit install`
5. _Tada_

## Populate database manually

### Prerequisites

1. Having a database running locally or online with [PostgreSQL](https://www.postgresql.org/) and the [PostGIS](https://postgis.net/) extension enabled.
2. Copy the `.env.dist` file and rename it in `.env`.

### Populate

1. Modify the `.env` file with the credential for connecting the database.
2. Be sure you have the requirements installed.
   - `pip install -Ur requirements.txt`
3. Make sure you have all the data file into the data folder in `backend/app/data`.
  - _TODO How to find the data_
4. Execute the script.
   - `python -m backend.app.script.init_db_async`

---

## Run with Docker (one command)

> Prerequisites: [Docker](https://www.docker.com/) installed.

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
