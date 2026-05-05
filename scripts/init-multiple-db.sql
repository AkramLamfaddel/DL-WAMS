-- WAMS PostgreSQL initialization
-- auth_db is already created by the POSTGRES_DB environment variable.
-- This script creates the remaining 3 microservice databases.

CREATE DATABASE gallery_db;
CREATE DATABASE ai_db;
CREATE DATABASE historique_db;

GRANT ALL PRIVILEGES ON DATABASE auth_db       TO wams_user;
GRANT ALL PRIVILEGES ON DATABASE gallery_db    TO wams_user;
GRANT ALL PRIVILEGES ON DATABASE ai_db         TO wams_user;
GRANT ALL PRIVILEGES ON DATABASE historique_db TO wams_user;
