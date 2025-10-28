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

Edit the `.env` with your configuration. More information in [Config](./config.md).

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
