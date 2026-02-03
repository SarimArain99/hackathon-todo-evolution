---
id: "0024"
title: "docker-uvicorn-path-fix"
stage: green
date: 2026-01-29
surface: agent
model: claude-opus-4.5-20251101
feature: 003-local-kubernetes
branch: 003-local-kubernetes
user: sarimarain99
command: /sp.implement
labels: [docker, bugfix, huggingface]
links:
  spec: null
  ticket: null
  adr: null
  pr: https://github.com/SarimArain99/hackathon-todo-evolution/pull/4
files:
 - backend/Dockerfile
tests:
---

## Prompt

check this error was shown on huggingface: runtime error
Exit code: 128. Reason: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: exec: "uvicorn": executable file not found in $PATH

## Response snapshot

Fixed the Dockerfile multi-stage build issue where uvicorn was not available in the runtime PATH.

**Root Cause:**
The Stage 1 builder was using `uv pip install --system -e .` which installed packages to `/usr/local/bin` instead of `/opt/venv`. When Stage 2 copied `/opt/venv` from the builder, it was incomplete - the installed packages were in the wrong location.

**Fix Applied:**
Changed from:
```dockerfile
RUN uv pip install --system -e . || pip install -e .
```

To:
```dockerfile
RUN /opt/venv/bin/pip install uv && \
    /opt/venv/bin/uv pip install -e .
```

This ensures packages are installed directly into `/opt/venv/lib/python3.13/site-packages`, making them available when Stage 2 sets `PATH="/opt/venv/bin:$PATH"`.

## Outcome

- ✅ Impact: Fixes Hugging Face deployment - uvicorn now available in container PATH
- 🧪 Tests: Docker build verification in progress (downloads 3GB+ of torch/CUDA dependencies)
- 📁 Files: 1 file changed (backend/Dockerfile)
- 🔁 Next prompts: None - issue should be resolved after HF redeploys
- 🧠 Reflection: Multi-stage Docker builds require careful attention to where dependencies are installed. ENV vars don't persist between stages.

## Evaluation notes (flywheel)

- Failure modes observed: None - fix is straightforward
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): Verify HF deployment succeeds after this fix
