# Webapp installation

## Setup

1. Clone the repo, go into it.
   - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Create a [virtual environment](https://docs.python.org/3/library/venv.html).
   - `python -m venv ./venv`
3. Activate it.
   - `source ./venv/bin/activate`
4. Install backend requirements.
   - `pip install -r requirements.txt`
5. Install frontend requirements.
   - `cd frontend && npm install && cd ..`
6. Create a local `.env` file.
   - `cp .env.dist .env`

## Config

Edit the `.env` with your configuration. Please change at least:

- `API_SECRET`
- `SECRET_KEY`
- `ROOT_EMAIL`
- `ROOT_PASSWORD`

More information in [Config](./config.md).

## Initial database creation

**⚠️ Warning**: If you already have a database, this step might result in loss of data.

### Clean install

If you want a database with only user and configuration but no data in it

`PYTHONPATH=backend .venv/bin/python -m app.script.init_db_async -e -f`

### Install with initial Labner data

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
   - `PYTHONPATH=backend .venv/bin/python -m app.script.init_db_async -f`

**⚠️ Warning**: If you want to populate the demo with only data for a small demo (quicker).

`PYTHONPATH=backend .venv/bin/python -m app.script.init_db_async -f -d`

## Quick start

You need two separate terminal, one for the backend, the other for the frontend.

For each terminal, in the root folder:

1. Make sure the `.venv/` is activated.
   - `source ./venv/bin/activate`

Then, separately, still in the root folder:

### Backend

In the terminal for backend

1. Export the environnement variable to the terminal

   For fish :

   ```bash
   for line in (grep '^BACKEND_' .env)
      set -l kv (string split -m1 = $line)
      set -gx $kv[1] (string trim -c '"\'' $kv[2])
   end
   ```

   For bash :

   `export $(grep '^BACKEND_' .env | xargs -d '\n')`

2. Launch the backend :

   `PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload --env-file .env`

### Frontend

In the terminal for frontend

1. Export the environnement variable to the terminal

   For fish :

   ```bash
   for line in (grep '^FRONTEND_' .env)
    set -l kv (string split -m1 = $line)
    set -gx $kv[1] (string trim -c '"\'' $kv[2])
   end
   ```

   For bash :

   `export $(grep '^FRONTEND_' .env | xargs -d '\n')`

2. Launch the frontend :

   `npm --prefix frontend run dev -- --host $FRONTEND_HOST --port $FRONTEND_PORT`

Use Ctrl+C to kill if needed.
