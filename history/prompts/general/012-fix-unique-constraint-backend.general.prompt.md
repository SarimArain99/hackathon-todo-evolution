---
id: 012
title: Fix UNIQUE Constraint Backend
stage: general
date: 2026-01-10
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: main
user: sarimarain99
command: /sp.implement
labels: ["bug-fix","backend","auth","unique-constraint"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/auth.py
tests:
  - Deployment verification in HuggingFace Spaces pending
---

## Prompt

[User provided HuggingFace Spaces error logs showing:]
sqlite3.IntegrityError: UNIQUE constraint failed: user.email
at /app/app/auth.py line 216 in get_current_user function

Multiple user IDs for same email:
- ZR8BFJUAzu8jLO0QeR65Ffd4ZTVk66HY (succeeded)
- n23PSg4QNkogIHXPd6T5KKMWddCYc0xy (failed - duplicate email)
- 6DNh9nYM4nveb10E5Jd6a8Gp4PyDMBKf (failed - duplicate email)

## Response snapshot

Fixed the UNIQUE constraint error in `backend/app/auth.py`.

**Root Cause:** Better Auth was issuing different `user_id` values (the `sub` claim in JWT) for the same user across requests, while the `email` remained consistent. The `get_current_user` function only looked up users by `user_id` (primary key). When a new ID was encountered, it attempted to INSERT a new user with an existing email, violating the UNIQUE constraint on `user.email`.

**Fix Applied:** Added email-based lookup before user creation. When `user_id` is not found:
1. Query database for existing user with same email
2. If found, update the existing user's ID to match the new JWT's `sub` claim
3. If not found, create new user as before

```python
if email:
    from sqlalchemy import select
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # User exists with same email but different ID - update the ID
        existing_user.id = user_id
        existing_user.name = name or existing_user.name
        await session.commit()
        await session.refresh(existing_user)
        user = existing_user
    else:
        # Create new user (first login)
        ...
```

**Commits:**
- 1d03b44: "fix: handle UNIQUE constraint on user email in get_current_user"
- 6b943f6: "docs: add PHRs for hydration fix and backend debugging"

## Outcome

- ✅ Impact: Fixed 500 Internal Server Error caused by UNIQUE constraint violation on user.email. Backend now handles cases where Better Auth issues different user IDs for the same user across sessions.
- 🧪 Tests: Deployment verification in HuggingFace Spaces pending (user needs to redeploy or wait for HF to pull latest changes)
- 📁 Files: Modified backend/app/auth.py (40 insertions, 11 deletions)
- 🔁 Next prompts: Monitor HuggingFace Spaces deployment; verify API endpoints return 200 instead of 500
- 🧠 Reflection: This is a common issue with federated identity systems - the relying party (backend) assumed user IDs from the identity provider (Better Auth) were stable, but they weren't. The fix makes the backend more resilient to ID changes by using email as the stable identifier.

## Evaluation notes (flywheel)

- Failure modes observed: Could not directly test in HuggingFace Spaces environment; fix relies on code review and logic correctness
- Graders run and results (PASS/FAIL): N/A (backend bug fix, no graders run)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): If errors persist after HF redeployment, add more defensive logging to track user ID/email changes across requests
