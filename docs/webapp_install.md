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

Edit the `.env` with your configuration. Please change at least:
- `API_SECRET`
- `SECRET_KEY`
- `ROOT_EMAIL`
- `ROOT_PASSWORD`

More information in [Config](./config.md).

## Initial database creation

**_TODO: "Naked" app with no data, cf. [#124](https://github.com/hhueber/IDHEAP-Datahub/issues/124)._**

**⚠️ Warning**: If you already have a database, this step might result in loss of data.

In the root folder:
1. Make sure the `.venv/` is activated.
    - `source ./venv/bin/activate`
2. Put your data files in the `./backend/app/data/` folder. **As of 2025-10-27**:
    - `CodeBook_Cleaned.xlsx`
    - `EtatCommunes.xlsx`
    - `GSB 2023_V1.csv`
    - `mon_fichier_indexed.csv`
    - `QuestionsGlobales.csv`
3. Execute database script.
    - `PYTHONPATH=backend .venv/bin/python -m app.script.init_db_async`

## Quick start

You need two separate terminal, one for the backend, the other for the frontend.

For each terminal, in the root folder:
1. Make sure the `.venv/` is activated.
    - `source ./venv/bin/activate`
2. Export the relevant variables in `.env`.
    - `export $(grep -v 'BACKEND_' .env | xargs -d '\n')`

Then, separately, still in the root folder:
- Backend: `PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload --env-file .env`
- Frontend: `npm --prefix frontend run dev -- --host $FRONTEND_HOST --port $FRONTEND_PORT`

Use Ctrl+C to kill if needed.

## Database Dump

If you want to dump your existing database or make a fresh start for your instance with a database dump do the following

### Manual

1. Manually dump the database with the command 

```bash
PGPASSWORD='<mdp>' pg_dump --clean --if-exists --no-owner --no-privileges \
  -h <db_host> -p <db_port> -U <db_user> -d <db_name> -f dump/<whatever_you_want>.sql
```

2. Launch the transfert of the database with the following command

```bash
  PGPASSWORD='<mdp>' psql -v ON_ERROR_STOP=1 \
  -h <db_host> -p <db_port> -U <db_user> -d <db_name> -f dump/<name_of_the_dump>.sql
```

### Dockers

If you use docker you need to first get the dump of database with the command

```bash
docker exec idheap-datahub-db-1 sh -c \
  'pg_dump --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > dump/datahub.sql
```

Then you can put the `.sql` in the `dump/` folder and use the Makefile with `make docker_dump`, si le sql est situé ailleurs vous pouvez utiliser `make docker_dump DUMP=path/to/sql`
