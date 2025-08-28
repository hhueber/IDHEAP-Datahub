# IDHEAP Datahub

Projet de visualisation de données géographiques longitudinales.

## Setup

1. Clone the repo, go into it.
   - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Create a [virtual environment](https://docs.python.org/3/library/venv.html), and activate it.
   - `python -m venv ./env; source ./env/bin/activate`
3. Install requirements.
   - `pip install -Ur requirements.txt`
4. Activate [`pre-commit`](https://pre-commit.com/).
   - `pre-commit install`
5. _Tada_

## Setup database manually

1. Having a PostgresSQL who is running
2. Modify the `.env` file with the credential for connecting the db
3. Be sure you have the requirements install
   - `pip install -Ur requirements.txt`
4. Make sure you have all the data file into the data folder in `backend/app/data`
5. Execute the script
```bash
cd backend
python -m app.script.init_db_async
```
