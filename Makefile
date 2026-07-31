.PHONY:	setup init_database run_backend run_frontend run run_background clean docker docker_clean docker_fclean

## Standard

VENV_FOLDER		:= .venv
PYTHON			:= $(VENV_FOLDER)/bin/python
ENV_FILE		:= .env

# Setup
setup: $(VENV_FOLDER) $(ENV_FILE)

$(VENV_FOLDER):
	@case "$(shell python --version)" in \
		*"3.12"*) \
			echo "🔜 Creating $(VENV_FOLDER) folder"; \
			python -m venv $(VENV_FOLDER); \
			echo "🔜 Installing dependencies"; \
			$(VENV_FOLDER)/bin/pip install -r requirements.txt; \
			echo "✅  Virtual venv $(VENV_FOLDER) created"; \
			;; \
		*) \
			echo "❌  Wrong Python version"; \
			;; \
	esac

$(ENV_FILE):
	@echo "🔜 Creating .env file"
	@cp .env.dist .env
	@echo "✅  .env file created"
	@echo "⚠️ Please change default settings before doing anything else!"
	@echo "⚠️ At least 'API_SECRET', 'SECRET_KEY', 'ROOT_EMAIL', 'ROOT_PASSWORD'."

# Initial database creation
init_database:
	@echo "🔜 Initialisation of database - this might take a while"
	@PYTHONPATH=backend $(PYTHON) -m app.script.init_db_async
	@echo "✅  Database ready"

init_demo_database:
	@echo "🔜 Initialisation of database with demo data- this might take a while"
	@PYTHONPATH=backend $(PYTHON) -m app.script.init_db_async -d
	@echo "✅ Demo Database ready"

# Quick start
run_backend:
	@PYTHONPATH=backend $(PYTHON) -m uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload --env-file .env

run_frontend:
	@npm --prefix frontend run dev -- --host $FRONTEND_HOST --port $FRONTEND_PORT

run run_background:
	@PYTHONPATH=backend $(PYTHON) -m uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload --env-file .env & \
	echo "PID Backend: $$!"
	@npm --prefix frontend run dev -- --host $FRONTEND_HOST --port $FRONTEND_PORT & \
	echo "PID Frontend: $$!"

clean:
	rm -rf $(VENV_FOLDER)
	rm -rf $(ENV_FILE)

## Docker

COMPOSE = docker compose
DB_SERVICE = db
FRONT_SERVICE = frontend
INIT_SERVICE = schema_db_init
INIT_DEMO_SERVICE = schema_db_init_demo
INIT_EMPTY_SERVICE = schema_db_init_empty
API_SERVICE = api

# build service DB (db) and api and front + initdb, then display the Postgres logs.
docker:
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	$(COMPOSE) up -d --build $(INIT_SERVICE) $(FRONT_SERVICE)
	@echo "✅  Services started"
	$(COMPOSE) logs -f $(INIT_SERVICE) $(API_SERVICE) $(FRONT_SERVICE)

docker_demo:
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	$(COMPOSE) up -d --build $(INIT_DEMO_SERVICE) $(FRONT_SERVICE)
	@echo "✅  Services started"
	$(COMPOSE) logs -f $(INIT_DEMO_SERVICE) $(API_SERVICE) $(FRONT_SERVICE)

docker_empty:
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	$(COMPOSE) up -d --build $(INIT_EMPTY_SERVICE) $(FRONT_SERVICE)
	@echo "✅  Services started"
	$(COMPOSE) logs -f $(INIT_EMPTY_SERVICE) $(API_SERVICE) $(FRONT_SERVICE)


# Stop the project's Docker services and delete the containers + volumes
docker_clean:
	$(COMPOSE) down -v --remove-orphans
	@echo "✅  All Docker services have been stopped and cleaned up"

# Complete Docker cleanup (services, networks, volumes, images, and caches)
docker_fclean:
	$(COMPOSE) down --rmi all --volumes --remove-orphans
	docker system prune -f
	@echo "✅  Cleaned all containers, volumes, and images"
