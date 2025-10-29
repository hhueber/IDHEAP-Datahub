# Debian installation

## Setup Debian WSL

### Create a passwordless user for that project

```bash
sudo useradd -m datahub
sudo passwd -d datahub
```

### Configure SSH for specific user

```bash
sudo su datahub
ssh-keygen -t ed25519 -C "noreply@unil.ch"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
exit
```

### Install database

#### Setup PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y

sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
# [...] online
```

#### Create user

```bash
sudo -u postgres psql
```

Then, in psql (replace `postgres` with a password for your user if needed):

```bash
# Set postgres password
ALTER USER postgres PASSWORD 'postgres';

# Exit
\q
```

#### Install PostGIS and pgRouting

cf. https://trac.osgeo.org/postgis/wiki/UsersWikiPostGIS3UbuntuPGSQLApt

First, check which version of PostgreSQL you are using, and replace `<VERSION>` with it-. For instance, for version 13.22, replace `<VERSION>` with `13`.

```bash
sudo apt install postgresql-<VERSION>-postgis-3 postgis postgresql-<VERSION>-pgrouting osm2pgrouting -y
```

#### Create and configure database

```bash
sudo -u postgres psql
```

Then, in psql:

```bash
CREATE DATABASE datahub;
ALTER DATABASE datahub SET search_path=public,postgis,contrib;
\connect datahub;

CREATE SCHEMA postgis;
CREATE EXTENSION postgis SCHEMA postgis;
SELECT postgis_full_version();
# > [...] postgis_full_version [...]
# Then press `q` to exit

CREATE EXTENSION pgrouting SCHEMA postgis;
SELECT * FROM pgr_version();
# > [...] 3.1.3 [...]

# Exit
\q
```
