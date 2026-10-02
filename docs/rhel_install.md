# RedHat installation

## Setup RHEL

### Install database

#### Setup PostgreSQL

```bash
sudo dnf install postgresql-server postgresql-contrib pgrouting

sudo systemctl enable postgresq
sudo postgresql-setup --initdb --unit postgresql
sudo systemctl start postgresql
```

#### Changing ident to scram-sha-256

```bash
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

Replace `ident` per `scram-sha-256` in line host 127.0.0.1/32 and ::1/128

```bash
sudo systemctl restart postgresql
```

#### Building osm2pgrouting dependency

```bash
sudo dnf install git cmake gcc-c++ boost-devel expat-devel libpqxx-devel libpq-devel

# Build osm2pgrouting
git clone https://github.com/pgRouting/osm2pgrouting.git
cd osm2pgrouting
cmake -H. -Bbuild
cd build
make
sudo make install
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
