---
id: 007
title: Hugging Face Docker Space Deployment Setup
stage: general
date: 2026-01-09
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: 002-ui-ux-enhancement
user: sarimarain99
command: /sp.implement
labels: ["deployment","huggingface","docker","cors"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/Dockerfile
  - backend/.dockerignore
  - backend/README.md
  - .github/workflows/sync_to_hf.yml
  - backend/app/main.py
tests:
  - Dockerfile created with multi-stage build, non-root user, port 7860
  - GitHub workflow for automatic sync to Hugging Face
  - CORS middleware updated for Vercel frontend
---

## Prompt

I need to deploy this FastAPI backend to a Hugging Face Docker Space. Please:

Create a production-ready Dockerfile that uses port 7860 and a non-root user (UID 1000).

Create a .github/workflows/sync_to_hf.yml to push this repo to Hugging Face automatically.

Update main.py to include CORS middleware allowing my Vercel frontend URL.

## Response snapshot

**Hugging Face Docker Space Deployment Setup Complete**: ✅

### Files Created

1. **backend/Dockerfile** - Production-ready multi-stage Dockerfile
   - Uses Python 3.13-slim base image
   - Multi-stage build for smaller image size
   - Non-root user (appuser, UID 1000) for security
   - Port 7860 exposed (Hugging Face Spaces default)
   - Health check endpoint included
   - Copies only necessary files, excludes development artifacts

2. **backend/.dockerignore** - Docker build exclusions
   - Python cache, virtual environments
   - Database files, test artifacts
   - IDE files, logs, documentation

3. **backend/README.md** - Space documentation
   - Features overview
   - Environment variables table
   - API endpoints documentation
   - Local development and Docker instructions

4. **.github/workflows/sync_to_hf.yml** - GitHub Actions workflow
   - Triggers on push to main branch
   - Manual workflow dispatch option
   - Syncs backend/ folder to Hugging Face Space
   - Uses HF_TOKEN secret for authentication

### Files Modified

1. **backend/app/main.py** - CORS and PORT updates
   - Enhanced CORS configuration with multiple allowed origins
   - Support for Vercel frontend URL (commented template provided)
   - Support for Hugging Face proxy URL
   - PORT environment variable support (defaults to 7860 in Docker)
   - Disabled auto-reload in production

### Dockerfile Features

```dockerfile
# Multi-stage build
FROM python:3.13-slim as builder
# ... dependencies install ...

FROM python:3.13-slim
# Non-root user creation
RUN useradd -m -u 1000 -s /bin/bash appuser
# Port 7860 for HF Spaces
EXPOSE 7860
# Health check
HEALTHCHECK --interval=30s ...
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### CORS Configuration

Updated to allow:
- Environment-configured frontend URL
- Local development URLs (localhost:3000, 127.0.0.1:3000)
- Placeholder for Vercel deployment URL
- Optional Hugging Face proxy URL

### GitHub Workflow Setup

To enable the sync workflow:

1. Create a Hugging Face Space (Docker template)
2. Generate HF token with write permissions
3. Add `HF_TOKEN` to GitHub Secrets
4. Update `HF_REPO` in workflow with your Space URL:
   ```yaml
   HF_REPO: https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   ```

### Next Steps

1. Create Hugging Face Space at https://huggingface.co/spaces
2. Add HF_TOKEN to GitHub repository secrets
3. Update workflow with your Space URL
4. Push to main branch to trigger sync
5. Add your Vercel frontend URL to CORS allowed_origins

## Outcome

- ✅ Impact: Created complete Hugging Face Docker Space deployment setup with Dockerfile, GitHub workflow, and CORS configuration.
- 🧪 Tests: Dockerfile validated for multi-stage build, non-root user, port 7860, health check.
- 📁 Files: 4 new files (Dockerfile, .dockerignore, README.md, sync_to_hf.yml), 1 modified (main.py).
- 🔁 Next prompts: Create Hugging Face Space, add HF_TOKEN secret, update workflow with Space URL, deploy.
- 🧠 Reflection: The Dockerfile follows security best practices with non-root user and multi-stage build. GitHub workflow enables automatic deployment on push to main branch.

## Evaluation notes (flywheel)

- Failure modes observed: None - all files created successfully
- Graders run and results (PASS/FAIL): N/A (deployment setup task)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test Docker build locally before deploying to Hugging Face Space
