# Docker Skill

**Source**: Context7 MCP - `/websites/docker`
**Benchmark Score**: 84.3 | **Code Snippets**: 131,291 | **Reputation**: High

## Overview

Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, standalone, and executable packages that include everything needed to run an application.

## Key Concepts

### 1. What is a Container?

A container is a runnable instance of an image. Containers are isolated from each other and the host system, but they share the kernel.

```bash
# Run a container
docker run -d --name my-nginx -p 80:80 nginx

# Run with volume mount
docker run -v /host/path:/container/path ubuntu
```

### 2. What is an Image?

An image is a read-only template with instructions for creating a container. Images are composed of multiple layers.

```bash
# Build an image
docker build -t myapp:latest .

# Pull an image
docker pull nginx:alpine

# List images
docker images
```

### 3. Dockerfile Instructions

| Instruction | Description | Syntax |
|-------------|-------------|--------|
| `FROM` | Base image | `FROM python:3.13` |
| `RUN` | Execute commands | `RUN pip install -r requirements.txt` |
| `COPY` | Copy files | `COPY . /app` |
| `ADD` | Copy + URLs/tar | `ADD app.tar.gz /app` |
| `WORKDIR` | Working directory | `WORKDIR /app` |
| `ENV` | Environment variables | `ENV NODE_ENV=production` |
| `EXPOSE` | Expose port | `EXPOSE 8080` |
| `CMD` | Default command | `CMD ["python", "app.py"]` |
| `ENTRYPOINT` | Executable form | `ENTRYPOINT ["python"]` |

### 4. Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/todo
    depends_on:
      - db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  postgres_data:
```

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

### 6. Volumes

```bash
# Create named volume
docker volume create my_data

# Use volume
docker run -v my_data:/data ubuntu

# Bind mount
docker run -v $(pwd)/data:/data ubuntu

# List volumes
docker volume ls
```

### 7. Networks

```bash
# Create bridge network
docker network create my-network

# Connect container to network
docker network connect my-network my-container

# Run container on network
docker run --network my-network nginx
```

## Hackathon Docker Patterns

### Backend Dockerfile (FastAPI)

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (Next.js)

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

### Multi-Container Compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/todo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

## Common Commands

```bash
# Container management
docker ps                    # List running containers
docker ps -a                # List all containers
docker exec -it <id> sh     # Execute shell in container
docker logs -f <id>         # Follow logs
docker stop <id>            # Stop container
docker rm <id>              # Remove container

# Image management
docker images               # List images
docker rmi <image>          # Remove image
docker build -t <name> .    # Build image
docker push <name>          # Push to registry

# Volume management
docker volume ls            # List volumes
docker volume rm <name>     # Remove volume

# Network management
docker network ls           # List networks
docker network create <name>
```

## .dockerignore

```
node_modules/
npm-debug.log
.git/
.env.local
*.md
dist/
build/
__pycache__/
*.pyc
.pytest_cache/
.venv/
```

## Best Practices

1. **Use multi-stage builds** to reduce final image size
2. **Leverage build cache** - order instructions from least to most frequently changing
3. **Use .dockerignore** to exclude unnecessary files
4. **Use specific version tags** instead of `latest`
5. **Run as non-root user** for security
6. **Minimize layers** - combine RUN commands
7. **Use compose for development** - simplify local workflow
