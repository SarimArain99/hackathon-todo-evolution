# Tasks: Local Kubernetes Deployment

**Input**: Design documents from `/specs/003-local-kubernetes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/phase4-helm.md

**Tests**: Tests are OPTIONAL for this infrastructure-focused feature. Validation is done via:

- `helm template --dry-run` for template validation
- Manual Minikube deployment for functional testing
- Health check verification for running pods

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `backend/` at repository root
- Frontend: `frontend/` at repository root
- Helm Chart: `helm/todo-app/` at repository root
- Scripts: `scripts/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and configure build tools

- [x] T001 Create helm/todo-app directory structure with templates/ subdirectory in helm/todo-app/
- [x] T002 Create scripts directory at repository root if not exists
- [x] T003 [P] Create backend/.dockerignore in backend/.dockerignore
- [x] T004 [P] Create frontend/.dockerignore in frontend/.dockerignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Docker infrastructure that MUST be complete before Kubernetes deployment

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Update backend/Dockerfile to use port 8000 (change from 7860) and fix DATABASE_URL path for Kubernetes in backend/Dockerfile
- [x] T006 Add `output: "standalone"` to frontend/next.config.ts for Docker optimization in frontend/next.config.ts
- [x] T007 Create frontend/Dockerfile with multi-stage build using node:20-alpine in frontend/Dockerfile

**Checkpoint**: Docker images can be built and are ready for Kubernetes deployment

---

## Phase 3: User Story 1 - Deploy Application to Local Kubernetes (Priority: P1) 🎯 MVP

**Goal**: Developer can deploy the complete Todo application to Minikube with a single Helm command

**Independent Test**: Run `helm install todo ./helm/todo-app`, verify pods are ready within 3 minutes, access http://todo.local in browser, and confirm signup/login/create tasks work

### Helm Chart Structure

- [x] T008 [P] [US1] Create helm/todo-app/Chart.yaml with chart metadata (name: todo-app, version: 0.1.0) in helm/todo-app/Chart.yaml
- [x] T009 [P] [US1] Create helm/todo-app/values.yaml with default configuration for local deployment in helm/todo-app/values.yaml

### Helm Template Helpers

- [x] T010 [US1] Create helm/todo-app/templates/\_helpers.tpl with reusable label and name helpers in helm/todo-app/templates/\_helpers.tpl

### Backend Resources (US1)

- [x] T011 [P] [US1] Create helm/todo-app/templates/backend-deployment.yaml with backend pod specification, resource limits, and health probes in helm/todo-app/templates/backend-deployment.yaml
- [x] T012 [P] [US1] Create helm/todo-app/templates/backend-service.yaml with ClusterIP service on port 8000 in helm/todo-app/templates/backend-service.yaml

### Frontend Resources (US1)

- [x] T013 [P] [US1] Create helm/todo-app/templates/frontend-deployment.yaml with frontend pod specification and resource limits in helm/todo-app/templates/frontend-deployment.yaml
- [x] T014 [P] [US1] Create helm/todo-app/templates/frontend-service.yaml with ClusterIP service on port 3000 in helm/todo-app/templates/frontend-service.yaml

### Configuration Resources (US1)

- [x] T015 [P] [US1] Create helm/todo-app/templates/configmap.yaml with non-sensitive environment variables (NEXT_PUBLIC_API_URL) in helm/todo-app/templates/configmap.yaml
- [x] T016 [P] [US1] Create helm/todo-app/templates/secret.yaml with sensitive values (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY) in helm/todo-app/templates/secret.yaml

### Ingress (US1)

- [x] T017 [US1] Create helm/todo-app/templates/ingress.yaml with nginx ingress routing /api to backend and / to frontend in helm/todo-app/templates/ingress.yaml

### Deployment Automation (US1)

- [x] T018 [US1] Create scripts/deploy-minikube.sh with automated Minikube setup, ingress enablement, image build/load, and Helm install in scripts/deploy-minikube.sh
- [x] T019 [US1] Make scripts/deploy-minikube.sh executable with chmod +x scripts/deploy-minikube.sh
- [x] T020 [US1] Validate Helm chart with `helm template todo ./helm/todo-app --debug` to verify templates render correctly

**Checkpoint**: At this point, User Story 1 should be fully functional - developer can deploy to Minikube with single command and access the application

---

## Phase 4: User Story 2 - Verify Health Checks and Self-Healing (Priority: P2)

**Goal**: Kubernetes health checks properly detect application health and automatically restart unhealthy containers

**Independent Test**: Deploy application, manually delete a backend pod, observe Kubernetes creates replacement within 30 seconds, and confirm application remains available

- [x] T021 [US2] Verify backend health endpoint exists and returns 200 with proper JSON structure in backend/app/main.py
- [x] T022 [US2] Verify readinessProbe and livenessProbe are configured in helm/todo-app/templates/backend-deployment.yaml
- [ ] T023 [US2] Test self-healing by deleting backend pod and observing automatic restart via `kubectl delete pod <backend-pod>`
- [x] T024 [US2] Document health check behavior in quickstart.md troubleshooting section

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - pods heal automatically when unhealthy

---

## Phase 5: User Story 3 - Scale Application Horizontally (Priority: P3)

**Goal**: Developer can scale the application by adjusting replica counts through Helm values

**Independent Test**: Deploy with 1 replica, run `helm upgrade todo ./helm/todo-app --set backend.replicas=3`, verify 3 pods become ready and handle traffic

- [x] T025 [US3] Verify backend.replicas and frontend.replicas are configurable in helm/todo-app/values.yaml
- [ ] T026 [US3] Test horizontal scaling with `helm upgrade todo ./helm/todo-app --set backend.replicas=3` and verify pod creation
- [ ] T027 [US3] Verify load distribution by checking logs across multiple backend pods
- [x] T028 [US3] Document scaling commands in quickstart.md Common Operations section

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - Update Application via Helm Upgrade (Priority: P4)

**Goal**: Developer can make code changes, rebuild images, and update deployment via Helm upgrade with zero downtime

**Independent Test**: Make trivial change (update app title), rebuild images, run `helm upgrade todo ./helm/todo-app`, observe new version rolls out without service interruption

- [x] T029 [US4] Document update workflow in quickstart.md (rebuild images, load into Minikube, helm upgrade)
- [ ] T030 [US4] Test rolling update with image tag change and verify zero downtime during upgrade
- [ ] T031 [US4] Test rollback capability with `helm rollback todo` and verify previous version is restored
- [x] T032 [US4] Document rollback procedure in quickstart.md Common Operations section

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Add comprehensive inline comments to helm/todo-app/values.yaml documenting each configuration option
- [x] T034 [P] Create helm/todo-app/values-cloud.yaml as placeholder for Phase V cloud deployment in helm/todo-app/values-cloud.yaml
- [x] T035 Verify all pods run as non-root user (security requirement NFR-004) by checking Dockerfiles and deployment templates
- [x] T036 Verify secrets are never logged by checking that sensitive values use secretKeyRef not configMapRef in all templates
- [ ] T037 Run complete quickstart.md validation from clean Minikube cluster to verify documentation accuracy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (US1 → US2 → US3 → US4)
  - US2, US3, US4 are validation tasks that don't require new code, just testing
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates all Helm templates and deployment script
- **User Story 2 (P2)**: Depends on US1 completion - Uses deployed resources to verify health checks work
- **User Story 3 (P3)**: Depends on US1 completion - Uses deployed resources to test scaling
- **User Story 4 (P4)**: Depends on US1 completion - Uses deployed resources to test upgrades

### Within Each User Story

- US1: All [P] marked template tasks (T008-T016) can run in parallel after \_helpers.tpl exists
- US1: T017 (ingress) depends on services being defined
- US1: T020 (validation) depends on all templates being complete
- US2-US4: These are testing/documentation tasks that proceed sequentially

### Parallel Opportunities

**Phase 1 (Setup):** All tasks marked [P] can run in parallel

- T003: backend/.dockerignore
- T004: frontend/.dockerignore

**Phase 2 (Foundational):** No parallel tasks (Dockerfiles have ordering dependencies)

**Phase 3 (US1) - Maximum Parallelism:**

- Group 1 (can run together after T007):
  - T008: Chart.yaml
  - T009: values.yaml
- Group 2 (can run together after Group 1, or in parallel with T010):
  - T011: backend-deployment.yaml
  - T012: backend-service.yaml
  - T013: frontend-deployment.yaml
  - T014: frontend-service.yaml
  - T015: configmap.yaml
  - T016: secret.yaml
- Group 3 (depends on T010):
  - T017: ingress.yaml
- Group 4 (after all templates):
  - T018: deploy-minikube.sh

**Phase 7 (Polish):** All tasks marked [P] can run in parallel

- T033: values.yaml comments
- T034: values-cloud.yaml placeholder

### Parallel Example: User Story 1

```bash
# Launch all Deployment/Service/Config templates together:
Task T011: "backend-deployment.yaml"
Task T012: "backend-service.yaml"
Task T013: "frontend-deployment.yaml"
Task T014: "frontend-service.yaml"
Task T015: "configmap.yaml"
Task T016: "secret.yaml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T007)
3. Complete Phase 3: User Story 1 (T008-T020)
4. **STOP and VALIDATE**: Test deployment to Minikube, verify application works
5. Demo if ready - local Kubernetes deployment is complete!

### Incremental Delivery

1. Complete Setup + Foundational → Docker images build successfully
2. Add User Story 1 → Deploy to Minikube, verify application accessible → MVP!
3. Add User Story 2 → Verify health checks and self-healing work
4. Add User Story 3 → Verify scaling works
5. Add User Story 4 → Verify upgrades/rollbacks work
6. Add Polish → Documentation complete, security validated

### Full Implementation

1. Execute all phases sequentially for complete feature
2. Each phase adds validation without breaking previous functionality
3. Final result is production-ready local Kubernetes deployment

---

## Task Summary

| Phase                  | Tasks        | Description                                |
| ---------------------- | ------------ | ------------------------------------------ |
| Phase 1: Setup         | T001-T004    | Directory structure and dockerignore files |
| Phase 2: Foundational  | T005-T007    | Dockerfile configuration for both services |
| Phase 3: US1 - Deploy  | T008-T020    | Helm chart creation and deployment script  |
| Phase 4: US2 - Health  | T021-T024    | Health check verification                  |
| Phase 5: US3 - Scale   | T025-T028    | Scaling verification                       |
| Phase 6: US4 - Upgrade | T029-T032    | Upgrade/rollback verification              |
| Phase 7: Polish        | T033-T037    | Documentation and security validation      |
| **Total**              | **37 tasks** | **Complete Kubernetes deployment**         |

### Parallel Execution Opportunities

- **9 tasks** marked [P] can be parallelized within their phases
- **Maximum concurrency**: Phase 3 (US1) allows 6 parallel template creations
- **Critical path**: T005 → T007 → T010 → T017 → T018 → T020 (core deployment flow)

---

## Notes

- [P] tasks = different files, no dependencies within same group
- [Story] label maps task to specific user story for traceability
- Each user story (US2-US4) is validation-only and can be tested independently
- US1 creates all infrastructure; subsequent stories verify it works correctly
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, template conflicts, missing required fields
