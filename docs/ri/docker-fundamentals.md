# Docker Fundamentals - Reference Information

**Source**: Context7 - /websites/docker
**Date**: 2026-01-09
**Purpose**: Quick reference for Docker containerization

---

## Core Concepts

### What is a Container?

A container is a runnable instance of an image. Containers are isolated from each other and the host system, but they share the kernel. They are lightweight because they don't need a full OS.

### What is an Image?

An image is a read-only template with instructions for creating a Docker container. Images are composed of multiple layers, each representing instructions in the Dockerfile.

### What is a Registry?

A registry is a storage and content delivery system for named Docker images. Docker Hub is the default public registry.

### What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. A Compose file allows you to configure your application's services, networks, and volumes in a single file.

---

## Dockerfile Instructions Reference

| Instruction | Description | Syntax |
|-------------|-------------|--------|
| **FROM** | Sets the base image | `FROM <image> [AS <name>]` |
| **RUN** | Executes commands in a new layer | `RUN <command>` |
| **COPY** | Copies files from context to container | `COPY [--chown=<user>:<group>] <src>... <dest>` |
| **ADD** | Copies files, handles URLs and tar extraction | `ADD [--chown=<user>:<group>] <src>... <dest>` |
| **EXPOSE** | Informs Docker of listening ports | `EXPOSE [<port>[/<protocol>]...]` |
| **ENV** | Sets environment variables | `ENV <key>=<value>` |
| **CMD** | Default command for container | `CMD ["executable", "param1"]` |
| **ENTRYPOINT** | Configures container as executable | `ENTRYPOINT ["executable", "param1"]` |
| **VOLUME** | Creates mount point | `VOLUME ["/data"]` |
| **USER** | Sets user for subsequent instructions | `USER <user>[:<group>]` |
| **WORKDIR** | Sets working directory | `WORKDIR /path/to/workdir` |
| **ARG** | Build-time variables | `ARG <name>[=<default>]` |
| **ONBUILD** | Trigger for downstream builds | `ONBUILD <INSTRUCTION>` |
| **STOPSIGNAL** | Signal to exit container | `STOPSIGNAL signal` |

---

## Common Docker CLI Commands

### Container Management

```bash
# Run a container
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
docker run -p 8080:8080 my-app
docker run -d --name my-container -p 80:80 nginx

# List containers
docker ps              # Running containers
docker ps -a           # All containers

# Execute command in running container
docker exec [OPTIONS] CONTAINER COMMAND [ARG...]
docker exec -it my-container /bin/bash

# View logs
docker logs [OPTIONS] CONTAINER
docker logs -f my-container

# Stop/Remove containers
docker stop CONTAINER
docker rm CONTAINER
```

### Image Management

```bash
# Build image
docker build [OPTIONS] PATH | URL
docker build -t my-app:latest .

# Pull/Push images
docker pull IMAGE
docker push IMAGE

# List images
docker images
```

### Docker Compose Commands

```bash
# Start services
docker compose up
docker compose up -d      # Detached mode

# Stop services
docker compose down

# View logs
docker compose logs -f app

# Build and run
docker compose up --build
```

---

## Volumes and Networks

### Volume Types

| Type | Description | Example |
|------|-------------|---------|
| **Named Volume** | Docker-managed storage | `--mount type=volume,src=my-vol,target=/data` |
| **Bind Mount** | Host filesystem mapping | `--mount type=bind,src=/host/path,target=/container/path` |

### Volume Commands

```bash
# Create volume
docker volume create my_volume

# List volumes
docker volume ls

# Inspect volume
docker volume inspect my_volume

# Remove volume
docker volume rm my_volume
```

### Network Drivers

| Driver | Description | Use Case |
|--------|-------------|----------|
| **bridge** | Private network on same host (default) | Container isolation |
| **host** | Share host network namespace | Max performance |
| **overlay** | Distributed network across hosts | Docker Swarm |
| **ipvlan** | Direct physical network attachment | Advanced networking |
| **macvlan** | Assign MAC address to container | Legacy app requirements |
| **none** | No networking | Complete isolation |

### Network Commands

```bash
# Create network
docker network create -d bridge my-bridge-network
docker network create --scope=swarm --attachable -d overlay my-multihost-network

# List networks
docker network ls

# Connect container to network
docker network connect my-network my-container
```

---

## Multi-Stage Builds

Multi-stage builds allow you to use multiple FROM statements in a single Dockerfile, reducing final image size by excluding build dependencies.

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
CMD ["node", "server.js"]
```

---

## Best Practices

1. **Use Multi-Stage Builds** - Reduce final image size
2. **Leverage Build Cache** - Order instructions from least to most frequently changing
3. **Use .dockerignore** - Exclude unnecessary files from build context
4. **Minimize Layers** - Combine RUN commands using &&
5. **Use Specific Tags** - Avoid `latest`, use versioned tags
6. **Run as Non-Root** - Use USER instruction for security
7. **Scan Images** - Use `docker scan` for vulnerabilities
8. **Use Compose for Development** - Simplify local development workflow

---

## .dockerignore Patterns

```
node_modules/
npm-debug.log
.git/
.env.local
.env.*.local
*.md
!README.md
dist/
build/
*.log
.DS_Store
Thumbs.db
```
