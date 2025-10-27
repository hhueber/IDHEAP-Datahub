<p align="center">
   <img src="frontend/src/img/idheap-dh.png" alt="idheap-dh.png" />
</p>

# IDHEAP DataHub

Longitudinal geographic data visualisation project.

## Setup and use

This project requires:
- [Python](https://www.python.org/) 3.12+ (EOL 2029-10).
- [Node.js](https://nodejs.org/) v.24.4+ (EOL 2028-04).
- A working [PostgreSQL](https://www.postgresql.org/)+[PostGIS](https://postgis.net/) database.

Selected guides are available here:
- [Debian install](./docs/debian_install.md).
- [RHEL install](./docs/rhel_install.md).

Then, you can install and run the actual webapp:
- Manual: [Webapp install](./docs/webapp_install.md).
- Automatic: [Makefile install](./docs/makefile_install.md).
- Docker: [Docker install](./docs/docker_install.md).

If you are a dev, please refer to our [CONTRIBUTING](CONTRIBUTING.md) file, and don't forger to activate [`pre-commit`](https://pre-commit.com/).
- `pre-commit install`
