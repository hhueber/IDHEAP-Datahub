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

include .env
export

COMPOSE = docker compose
DB_SERVICE = db
FRONT_SERVICE = frontend
INIT_SERVICE = schema_db_init
API_SERVICE = api

BACKUP_DIR = backups
BACKUP_FILE = $(BACKUP_DIR)/$(DB_NAME).dump

db_exec = $(COMPOSE) exec -T $(DB_SERVICE)

# Create backup folder if missing
$(BACKUP_DIR):
	@mkdir -p $(BACKUP_DIR)

# Dump DB into backups/<db>.dump
dump_db: $(BACKUP_DIR)
	@echo "Dumping database $(DB_NAME) -> $(BACKUP_FILE)"
	@$(db_exec) pg_dump -Fc -U $(DB_USER) -d $(DB_NAME) > $(BACKUP_FILE)
	@echo "✅ Dump created: $(BACKUP_FILE)"

# Restore DB from backups/<db>.dump (drops objects first)
restore_db:
	@if [ ! -f "$(BACKUP_FILE)" ]; then \
		echo "Backup file not found: $(BACKUP_FILE)"; \
		echo "Run: make dump_db  (after you populated the DB once)"; \
		exit 1; \
	fi
	@echo "♻️ Restoring database $(DB_NAME) from $(BACKUP_FILE)"
	@cat $(BACKUP_FILE) | $(COMPOSE) exec -T $(DB_SERVICE) pg_restore -U $(DB_USER) -d $(DB_NAME) --clean --if-exists
	@echo "✅ Restore done"

# Remove only DB volume (data) then restart db
reset_db:
	@echo "Removing DB volume (pgdata)..."
	$(COMPOSE) down -v --remove-orphans
	@echo "✅ DB volume removed"

# build service DB (db) and api and front + initdb, then display the Postgres logs.
docker:
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	$(COMPOSE) up -d --build $(INIT_SERVICE) $(FRONT_SERVICE)
	@echo "✅  Services started"
	$(COMPOSE) logs -f $(INIT_SERVICE) $(API_SERVICE) $(FRONT_SERVICE)

# Fast start: build db + api, restore dump, then start front (NO init service)
docker_restore:
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	@echo "Waiting for DB to be ready..."
	@$(COMPOSE) exec -T $(DB_SERVICE) sh -c 'until pg_isready -U $(DB_USER) -d $(DB_NAME); do sleep 1; done'
	$(MAKE) restore_db
	$(COMPOSE) up -d --build $(FRONT_SERVICE)
	@echo "✅  Services started with restored DB"
	$(COMPOSE) logs -f $(API_SERVICE) $(FRONT_SERVICE)

# Stop the project's Docker services and delete the containers + volumes
docker_clean:
	$(COMPOSE) down -v --remove-orphans
	@echo "✅  All Docker services have been stopped and cleaned up"

# Complete Docker cleanup (services, networks, volumes, images, and caches)
docker_fclean:
	$(COMPOSE) down --rmi all --volumes --remove-orphans
	docker system prune -f
	@echo "✅  Cleaned all containers, volumes, and images"
