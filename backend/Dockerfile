# --- Stage 1: Build ---
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and use virtualenv
RUN python -m venv /opt/venv

# Install UV for faster dependency resolution
RUN . /opt/venv/bin/activate && pip install uv

# Copy dependency files
COPY pyproject.toml ./

# Activate venv and install dependencies using UV
# Using /opt/venv/bin/pip directly ensures packages install to venv
RUN /opt/venv/bin/pip install uv && \
    /opt/venv/bin/uv pip install -e .

# --- Stage 2: Runtime ---
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (UID 1000) for security (NFR-004)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Copy the virtualenv from the builder
COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]