# SecCom

Projet de visualisation de données géographiques longitudinales.

## Installation

### Dev

- Clone repo: `git clone git@github.com:Amustache/SecCom.git`.
- Go into the folder: `cd SecCom`.
- Create venv: `python -m venv env`.
- Activate venv: `source env/bin/activate`.
- Install requirements: `pip install -r requirements.txt`.
- Copy the template config: `cp webapp/config.py.dist webapp/config.py`.
- Modify the template config file, especially the `SECRET_KEY`.

## Utilisation

## Dev

- Lancer l'application : `python webapp/app.py`
- Traduire  :
  1. Générer un fichier POT global : `pybabel extract -F babel.cfg -o messages.pot .`
  2. Générer un fichier POT par langue : `pybabel update -i messages.pot -d webapp/translations -l LANG`
  3. Appliquer les traductions : `pybabel compile -d webapp/translations`

## Crédits

- Matthieu Jacques
