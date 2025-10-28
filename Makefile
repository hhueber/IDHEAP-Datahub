.PHONY:	setup init_database run_backend run_frontend run run_background clean

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
