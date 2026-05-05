#!/bin/bash
# Creates one PostgreSQL database per microservice.
set -e

create_db() {
    local db=$1
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $db;
        GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
}

for db in auth_db gallery_db ai_db historique_db; do
    create_db "$db"
done

echo "All WAMS databases created."
