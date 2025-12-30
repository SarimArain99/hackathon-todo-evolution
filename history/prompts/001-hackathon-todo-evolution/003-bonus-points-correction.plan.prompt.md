---
id: 003
title: Bonus Points Correction
stage: plan
date: 2025-12-29
surface: agent
model: claude-opus-4-5
feature: 001-hackathon-todo-evolution
branch: 001-hackathon-todo-evolution
user: sarimarain99
command: /sp.plan
labels: ["correction", "bonus-points", "plan", "spec", "hackathon"]
links:
  spec: specs/001-hackathon-todo-evolution/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-hackathon-todo-evolution/spec.md
  - specs/001-hackathon-todo-evolution/plan.md
tests:
  - null
---

## Prompt

/sp.plan review the files in hackathon_docs and check do you calculated and wrote all the point correctly with thair tasks? (I think you made mistake correct it)

## Response snapshot

Reviewed hackathon documentation and identified bonus points calculation error:

**Original (Incorrect)**:
- spec.md: `| **Total Bonus** | **+600** |`
- plan.md: `**Target**: 1400 potential points` with `+400 bonus`

**Corrected Values** (from hackathon_docs/hackathon-II.md lines 81-87):
- Reusable Intelligence (Subagents & Skills): +200 pts
- Cloud-Native Blueprints via Agent Skills: +200 pts
- Multi-language Support (Urdu in chatbot): +100 pts
- Voice Commands for todo operations: +200 pts
- **Total Bonus: +700 pts**

**Files Updated**:
1. `spec.md` - Fixed bonus total from +600 to +700
2. `plan.md` - Fixed target from 1400 to 1700 pts, updated bonus breakdown

## Outcome

- Impact: Minor - Corrected calculation error in planning documents
- Tests: N/A - Documentation only
- Files: 2 files corrected (spec.md, plan.md)
- Next prompts: /sp.tasks to generate task breakdown, then /sp.implement
- Reflection: User correctly identified arithmetic error; always double-check numerical calculations against source documents

## Evaluation notes (flywheel)

- Failure modes observed: Arithmetic error in bonus points summation (200+200+100+200=700, not 600)
- Graders run and results (PASS/FAIL): PASS - Values now match hackathon documentation
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Implement checklist for numeric calculations during planning phase
