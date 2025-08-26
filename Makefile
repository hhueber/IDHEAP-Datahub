COMPOSE = docker compose
DB_SERVICE = db
INIT_SERVICE = initdb
PYTHON = python
VENV = .venv

.PHONY: docker local local_fclean docker_clean docker_fclean help

local: $(VENV)/bin/activate ## Create the venv, install the deps, and initialise the DB locally.
	$(VENV)/bin/pip install -r requirements.txt
	$(VENV)/bin/$(PYTHON) -m backend.app.script.init_db_async

$(VENV)/bin/activate: ## Creates the virtual environment .venv (if it doesn't exist)
	python3 -m venv $(VENV)
	@echo "Virtual environment created in $(VENV). Activate it with: source $(VENV)/bin/activate"

local_fclean: ## Deletes the venv (.venv) and cleans up the local environment.
	rm -rf $(VENV)
	@echo "Virtual environment deleted and local environment cleaned up."


docker: ## Run DB (db) + initdb, then display the Postgres logs.
	$(COMPOSE) up -d --build $(DB_SERVICE) $(INIT_SERVICE)
	@echo "✅ Services started."
	$(COMPOSE) logs -f $(DB_SERVICE)


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