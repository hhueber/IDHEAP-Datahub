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
