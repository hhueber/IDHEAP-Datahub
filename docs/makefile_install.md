# Makefile installation

## Setup

1. Clone the repo, go into it.
     - `git clone git@github.com:hhueber/IDHEAP-Datahub.git; cd IDHEAP-Datahub`
2. Launch the installation script.
     - `make`
3. Follow the instructions.

## Config

Edit the `.env` with your configuration. Please change at least:
- `API_SECRET`
- `SECRET_KEY`
- `ROOT_EMAIL`
- `ROOT_PASSWORD`

More information in [Config](./config.md).

## Initial database creation

**⚠️ Warning**: If you already have a database, this step might result in loss of data.

- `make init_database`

## Quick start

You need two separate terminal, one for the backend, the other for the frontend.

- Backend: `make run_backend`
- Frontend: `make run_frontend`

Use Ctrl+C to kill if needed.
