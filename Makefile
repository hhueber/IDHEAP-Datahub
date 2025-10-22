OS := $(shell uname -s)
BREW_PG ?= postgresql@16
ENV_FILE := .env
COMPOSE = docker compose
DB_SERVICE = db
FRONT_SERVICE = frontend
INIT_SERVICE = schema_db_init
API_SERVICE = api
PYTHON = python3
VENV = .venv
PYBIN   := $(VENV)/bin/python
PIP     := $(VENV)/bin/pip

REQUIRED_ENV_VARS := DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD

.PHONY: docker local local_fclean docker_clean docker_fclean local_api local_front help db_native_up db_native_down db_env_bootstrap _check_env _require_env_vars

$(PYBIN): ## Creates the virtual environment .venv (if it doesn't exist)
	@echo "Using interpreter: $(PYTHON)"
	@$(PYTHON) -m venv $(VENV)
	@echo "Virtual environment created in $(VENV)."

local_db: $(PYBIN) ## Create the venv, install the deps, and initialise the DB locally.
	@$(PIP) install -r requirements.txt
	@PYTHONPATH=backend $(VENV)/bin/$(PYTHON) -m app.script.init_db_async

local_front:  ## Local startup only of the front end on port 3000
	@npm --prefix frontend run dev -- --host 0.0.0.0 --port 3000

local_api:  $(PYBIN) ## Start the FastAPI API locally on port 8000
	@$(PIP) install -r requirements.txt
	@PYTHONPATH=backend $(VENV)/bin/$(PYTHON) -m uvicorn app.main:app \
		--host 0.0.0.0 --port 8000 --reload --env-file .env

local_fclean: ## Deletes the venv (.venv) and cleans up the local environment.
	rm -rf $(VENV)
	@echo "Virtual environment deleted and local environment cleaned up."


docker: ## build service DB (db) and api and front + initdb, then display the Postgres logs.
	$(COMPOSE) up -d --build $(DB_SERVICE) $(API_SERVICE)
	$(COMPOSE) up -d --build $(INIT_SERVICE) $(FRONT_SERVICE)
	@echo "✅ Services started."
	$(COMPOSE) logs -f $(INIT_SERVICE) $(API_SERVICE) $(FRONT_SERVICE)


docker_clean: ## Stop the project's Docker services and delete the containers + volumes
	$(COMPOSE) down -v --remove-orphans
	@echo "All Docker services have been stopped and cleaned up."

docker_fclean: ## Complete Docker cleanup (services, networks, volumes, images, and caches)
	$(COMPOSE) down --rmi all --volumes --remove-orphans
	docker system prune -f
	@echo "Cleaned all containers, volumes, and images."


_check_env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "❌ Fichier $(ENV_FILE) manquant. Abandon."; \
		exit 1; \
	fi

# Charge .env une fois qu'on a vérifié sa présence
ifneq ("$(wildcard $(ENV_FILE))","")
include $(ENV_FILE)
export
endif

_require_env_vars:
	@missing=""; \
	for v in $(REQUIRED_ENV_VARS); do \
		if [ -z "$${!v}" ]; then missing="$$missing $$v"; fi; \
	done; \
	if [ -n "$$missing" ]; then \
		echo "❌ Variables manquantes dans $(ENV_FILE):$$missing"; \
		exit 1; \
	fi

db_native_up: ## Installe (si besoin) et démarre PostgreSQL + PostGIS
ifeq ($(OS),Darwin)
	@which brew >/dev/null || (echo "❌ Homebrew manquant: https://brew.sh" && exit 1)
	@echo "🍎 macOS: vérif/installation via Homebrew…"
	@brew list $(BREW_PG) >/dev/null 2>&1 || brew install $(BREW_PG)
	@brew list postgis >/dev/null 2>&1 || brew install postgis
	@echo "▶️  Démarrage du service PostgreSQL…"
	@brew services start $(BREW_PG)
	@brew services list | grep $(BREW_PG) || true
else ifeq ($(OS),Linux)
	@echo "🐧 Linux: vérif/installation via apt…"
	@sudo apt-get update -y
	@sudo apt-get install -y postgresql postgresql-contrib postgis
	@echo "▶️  Démarrage du service PostgreSQL…"
	@sudo systemctl start postgresql
	@sudo systemctl is-active --quiet postgresql && echo "✅ postgresql: actif" || (echo "❌ échec de démarrage" && exit 1)
else
	@echo "❌ OS non supporté automatiquement: $(OS)"; exit 1
endif
	@echo "✅ Postgres + PostGIS prêt."

db_native_down: ## Arrête le service PostgreSQL
ifeq ($(OS),Darwin)
	@which brew >/dev/null || (echo "❌ Homebrew manquant" && exit 1)
	@brew services stop $(BREW_PG)
else ifeq ($(OS),Linux)
	@sudo systemctl stop postgresql
else
	@echo "❌ OS non supporté automatiquement: $(OS)"; exit 1
endif
	@echo "🛑 PostgreSQL arrêté."

db_env_bootstrap: _check_env _require_env_vars ## Crée rôle/DB + active PostGIS selon .env
ifeq ($(OS),Linux)
	@echo "👤 Création/MAJ rôle $(DB_USER)…"
	@sudo -u postgres psql -p "$(DB_PORT)" -d postgres -v ON_ERROR_STOP=1 -c \
	"DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='$(DB_USER)') THEN CREATE ROLE \"$(DB_USER)\" LOGIN PASSWORD '$(DB_PASSWORD)'; ELSE ALTER ROLE \"$(DB_USER)\" WITH LOGIN PASSWORD '$(DB_PASSWORD)'; END IF; END $$;"
	@echo "🗄️  Création DB $(DB_NAME)…"
	@sudo -u postgres psql -p "$(DB_PORT)" -d postgres -v ON_ERROR_STOP=1 -tc \
	"SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)';" | grep -q 1 || \
	sudo -u postgres createdb -p "$(DB_PORT)" -O "$(DB_USER)" "$(DB_NAME)"
	@sudo -u postgres psql -p "$(DB_PORT)" -d postgres -v ON_ERROR_STOP=1 -c \
	"ALTER DATABASE \"$(DB_NAME)\" OWNER TO \"$(DB_USER)\";"
else ifeq ($(OS),Darwin)
	@echo "👤 Création/MAJ rôle $(DB_USER) (tentative via socket local)…"
	@( psql -d postgres -v ON_ERROR_STOP=1 -c \
	"DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='$(DB_USER)') THEN CREATE ROLE \"$(DB_USER)\" LOGIN PASSWORD '$(DB_PASSWORD)'; ELSE ALTER ROLE \"$(DB_USER)\" WITH LOGIN PASSWORD '$(DB_PASSWORD)'; END IF; END $$;" \
	|| ( echo "   ⚠️  tentative socket locale échouée, essai via superuser PGUSER/PGPASSWORD…"; \
	     if [ -z "$$PGUSER" ] || [ -z "$$PGPASSWORD" ]; then \
	       echo "❌ Fournis PGUSER et PGPASSWORD (superuser) pour macOS. Exemple:"; \
	       echo "   PGUSER=postgres PGPASSWORD=*** make db_env_bootstrap"; \
	       exit 1; \
	     fi; \
	     PGUSER="$$PGUSER" PGPASSWORD="$$PGPASSWORD" psql -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c \
	     "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='$(DB_USER)') THEN CREATE ROLE \"$(DB_USER)\" LOGIN PASSWORD '$(DB_PASSWORD)'; ELSE ALTER ROLE \"$(DB_USER)\" WITH LOGIN PASSWORD '$(DB_PASSWORD)'; END IF; END $$;" ) )
	@echo "🗄️  Création DB $(DB_NAME)…"
	@( psql -d postgres -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)';" | grep -q 1 \
	   || createdb -O "$(DB_USER)" "$(DB_NAME)" ) \
	|| ( if [ -z "$$PGUSER" ] || [ -z "$$PGPASSWORD" ]; then exit 1; fi; \
	     PGUSER="$$PGUSER" PGPASSWORD="$$PGPASSWORD" psql -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$$PGUSER" -d postgres -v ON_ERROR_STOP=1 -tc \
	     "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)';" | grep -q 1 || \
	     PGUSER="$$PGUSER" PGPASSWORD="$$PGPASSWORD" createdb -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$$PGUSER" -O "$(DB_USER)" "$(DB_NAME)"; \
	     PGUSER="$$PGUSER" PGPASSWORD="$$PGPASSWORD" psql -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c \
	     "ALTER DATABASE \"$(DB_NAME)\" OWNER TO \"$(DB_USER)\";" )
else
	@echo "❌ OS non supporté automatiquement: $(OS)"; exit 1
endif
	@echo "📡 Activation PostGIS sur $(DB_NAME)…"
	@PGPASSWORD="$(DB_PASSWORD)" psql -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS postgis;"
	@echo "✅ Bootstrap terminé (rôle, DB, PostGIS)."


help: ## summary of orders available
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'


#  dans l'idee commencer par make db_native_up
# make db_env_bootstrap
# make local_db
# make local_api
# sur un autre terminale car api restera
# local_front