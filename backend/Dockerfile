# --- Stage 1: Build ---
FROM python:3.13-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Use a virtualenv for cleaner path copying
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml requirements.txt* ./
# Install dependencies into the virtualenv
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir .

# --- Stage 2: Runtime ---
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    # IMPORTANT: Move DB to /data if you upgrade to persistent storage later
    DATABASE_URL=sqlite:///./todo.db \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create HF-compatible user (UID 1000)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
    
# Copy the virtualenv from the builder
COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/health').read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]