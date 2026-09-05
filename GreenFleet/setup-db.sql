-- Run this as a PostgreSQL superuser to create the GreenFleet database and user
-- psql -U postgres -f setup-db.sql

CREATE USER greenfleet WITH PASSWORD 'greenfleet';
CREATE DATABASE greenfleet OWNER greenfleet;
GRANT ALL PRIVILEGES ON DATABASE greenfleet TO greenfleet;

-- Tables are created automatically by SQLAlchemy on first backend startup
