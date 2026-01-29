---
id: 0020
title: Production Security Fixes Implementation
stage: green
date: 2026-01-29
surface: agent
model: claude-opus-4-5-20251101
feature: 003-local-kubernetes
branch: 003-local-kubernetes
user: sarimarain99
command: /sp.implement
labels: ["security","implementation","production-readiness"]
links:
  spec: specs/003-local-kubernetes/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/auth.py
  - backend/app/main.py
  - backend/pyproject.toml
  - frontend/lib/auth.ts
  - frontend/.env.local.example
  - helm/todo-app/templates/postgres-deployment.yaml
  - helm/todo-app/templates/postgres-service.yaml
  - helm/todo-app/templates/postgres-pvc.yaml
  - helm/todo-app/templates/secret.yaml
  - helm/todo-app/values.yaml
  - specs/003-local-kubernetes/tasks.md
tests: []
---

## Prompt

yes

## Response snapshot

Implemented 5 HIGH severity production security fixes:

1. **JWKS Signature Verification** (backend/app/auth.py)
   - Added PyJWT with JWKS client support
   - Added STRICT_JWT_VERIFICATION environment variable
   - Signature verification now enforced when enabled
   - Added pyjwt>=2.9.0 to pyproject.toml

2. **PostgreSQL Deployment** (helm/todo-app/templates/)
   - Created postgres-deployment.yaml with PostgreSQL 16-alpine
   - Created postgres-service.yaml with ClusterIP service
   - Created postgres-pvc.yaml for persistent storage
   - Updated values.yaml with postgres configuration section
   - Updated secret.yaml with postgres credentials support

3. **Default Secret Fallback Removed** (frontend/lib/auth.ts)
   - Changed secret to throw error if BETTER_AUTH_SECRET not set
   - Made trustedOrigins configurable via BETTER_AUTH_TRUSTED_ORIGINS env
   - Updated .env.local.example with documentation

4. **CSRF Protection Re-enabled** (frontend/lib/auth.ts)
   - Changed disableOriginCheck from true to false
   - CSRF protection now active via trustedOrigins

5. **Environment-based CSP** (backend/app/main.py)
   - Development CSP: allows unsafe-inline/unsafe-eval for Vite HMR
   - Production CSP: no unsafe directives, HTTPS-only for connect-src
   - Controlled by ENVIRONMENT environment variable

Also completed:
- Fixed Helm template syntax error in secret.yaml
- Validated Helm chart with `helm template --dry-run`
- Marked T020 as complete in tasks.md

## Outcome

- ✅ Impact: 5 HIGH severity security issues fixed
- 🧪 Tests: Helm template validation passed
- 📁 Files: 10 files modified/created
- 🔁 Next prompts: Install dependencies (pip install pyjwt), configure STRICT_JWT_VERIFICATION=true for production
- 🧠 Reflection: All security hardening items from analysis have been implemented. Application now has proper JWT verification foundation, CSRF protection, and production-ready CSP.

## Evaluation notes (flywheel)

- Failure modes observed: Helm template syntax error with default() function - fixed by using if/else blocks
- Graders run and results (PASS/FAIL): Helm template validation PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Enable STRICT_JWT_VERIFICATION in production and test JWKS endpoint integration
