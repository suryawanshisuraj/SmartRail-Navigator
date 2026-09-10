# Deployment & Infrastructure Guide - SmartRail-Navigator

This document outlines containerization, continuous integration/continuous deployment (CI/CD), environment management, and production operations for SmartRail-Navigator.

---

## 1. Containerization & Docker Compose

### 1.1 Multi-Service `docker-compose.yml`
```yaml
version: '3.8'

services:
  smartrail-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - DATABASE_URL=postgresql://smartrail:secret@smartrail-db:5432/smartrail
    depends_on:
      - smartrail-db
    restart: always

  smartrail-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - smartrail-backend
    restart: always

  smartrail-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: smartrail
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: smartrail
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seeds.sql:/docker-entrypoint-initdb.d/02-seeds.sql
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 1.2 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
```

### 1.3 Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. CI/CD Pipeline (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`

```yaml
name: SmartRail-Navigator CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Run Backend Tests
        run: |
          cd backend
          npm ci
          npm test

      - name: Run Frontend Build & Tests
        run: |
          cd frontend
          npm ci
          npm run build
          npm test

      - name: Accessibility Audit (axe-core)
        run: |
          npm run test:a11y

  build-and-deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloud
        run: echo "Trigger container registry push and Kubernetes rolling rollout."
```

---

## 3. Production Monitoring & Health Checks

- **Health Check Endpoint**: `GET /api/health` returns `200 OK` with uptime, active WebSocket connections count, and memory metrics.
- **Metrics Scraping**: Prometheus metrics exported on `/metrics` measuring routing latency, active train count, and WebSocket message throughput.
- **Log Aggregation**: Structured JSON logs streamed to stdout for collection via Fluentd or Datadog.
