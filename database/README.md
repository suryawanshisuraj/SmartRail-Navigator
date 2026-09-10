# Database Setup & Migrations - SmartRail-Navigator

This directory contains the relational database definition, table DDL, and sample seeds for SmartRail-Navigator.

---

## 1. Quick Setup with PostgreSQL

### Using Local PostgreSQL CLI (`psql`)
```bash
# 1. Create the database
createdb -U postgres smartrail_db

# 2. Run schema migration
psql -U postgres -d smartrail_db -f schema.sql

# 3. Insert seed datasets
psql -U postgres -d smartrail_db -f seeds.sql
```

### Using Docker
```bash
docker run --name smartrail-postgres \
  -e POSTGRES_USER=smartrail_user \
  -e POSTGRES_PASSWORD=smartrail_password \
  -e POSTGRES_DB=smartrail_db \
  -p 5432:5432 \
  -v $(pwd)/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql \
  -v $(pwd)/seeds.sql:/docker-entrypoint-initdb.d/02-seeds.sql \
  -d postgres:15-alpine
```

---

## 2. In-Memory & SQLite Fallback
For local development and automated testing where a live PostgreSQL instance is not available, the backend includes an embedded JSON topology fallback (`data/stations.json` and `data/trains.json`) which mimics the exact relational graph structure in-memory.
