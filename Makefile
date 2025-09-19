COMPOSE = docker compose
DB_SERVICE = db
FRONT_SERVICE = frontend
INIT_SERVICE = schema_db_init
API_SERVICE = api
PYTHON = python3
VENV = .venv
PYBIN   := $(VENV)/bin/python
PIP     := $(VENV)/bin/pip

.PHONY: docker local local_fclean docker_clean docker_fclean local_api local_front help

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


help: ## summary of orders available
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'