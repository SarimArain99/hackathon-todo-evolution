# Data Model: Credential Persistence & Account Recovery

**Feature**: 010-credential-persistence
**Date**: 2026-01-29
**Status**: Complete

## Overview

This document describes the data entities for credential persistence. The authentication data is managed by Better Auth and stored in PostgreSQL. The backend maintains reference models for foreign key relationships with application data (tasks, conversations).

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Better Auth (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐         ┌─────────────┐ │
│  │     user     │         │   session    │         │verification │ │
│  ├──────────────┤         ├──────────────┤         ├─────────────┤ │
│  │ id (PK)      │───┬────│ id (PK)      │         │ id (PK)     │ │
│  │ email        │   │    │ userId (FK)  │◄───────│ │ identifier  │ │
│  │ name         │   │    │ token        │         │ │ expiresAt   │ │
│  │ passwordHash │   │    │ expiresAt    │         │ │ userId (FK) ││
│  │ emailVerified│   │    │ ipAddress    │         │ └─────────────┘ │
│  │ createdAt    │   │    │ userAgent    │         │                 │
│  │ updatedAt    │   │    └──────────────┘         │                 │
│  └──────────────┘   │                            │                 │
│                     │                            │                 │
└─────────────────────┼────────────────────────────┴─────────────────┘
                      │
                      │ Foreign Key Reference
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application (Backend SQLModel)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐         ┌─────────────┐ │
│  │  Task        │         │ Conversation │         │  Message    │ │
│  ├──────────────┤         ├──────────────┤         ├─────────────┤ │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)     │ │
│  │ userId (FK)  │◄────────│ userId (FK)  │         │ convId (FK) ││
│  │ title        │         │ createdAt    │─────────││ role        │ │
│  │ description  │         │ updatedAt    │         │ content     │ │
│  │ completed    │         └──────────────┘         │ createdAt   │ │
│  │ priority     │                                  └─────────────┘ │
│  │ tags         │                                                       │
│  │ dueDate      │                                                       │
│  │ createdAt    │                                                       │
│  │ updatedAt    │                                                       │
│  └──────────────┘                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Better Auth Entities

### user

Managed by Better Auth. Stores user credentials and verification status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PRIMARY KEY, UUID | Unique user identifier |
| email | string | UNIQUE, NOT NULL | User's email address |
| name | string | NOT NULL | User's display name |
| emailVerified | boolean | DEFAULT false | Whether email has been verified |
| passwordHash | string | NOT NULL | Bcrypt hashed password |
| createdAt | timestamp | DEFAULT NOW() | Account creation timestamp |
| updatedAt | timestamp | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_user_email` on `email` (unique)
- `idx_user_emailVerified` on `emailVerified`

### session

Stores active user sessions. JWT cookies reference these records for validation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PRIMARY KEY, UUID | Session identifier |
| userId | string | FOREIGN KEY → user.id, NOT NULL | Associated user |
| token | string | UNIQUE, NOT NULL | Session token hash |
| expiresAt | timestamp | NOT NULL, INDEX | Session expiration |
| ipAddress | string | | Client IP address |
| userAgent | string | | Client browser/app identifier |
| createdAt | timestamp | DEFAULT NOW() | Session creation |

**Indexes**:
- `idx_session_userId` on `userId`
- `idx_session_expiresAt` on `expiresAt`
- `idx_session_token` on `token` (unique)

### verification

Stores email verification and password reset tokens.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PRIMARY KEY, UUID | Token identifier |
| identifier | string | NOT NULL, INDEX | Email address being verified |
| token | string | UNIQUE, NOT NULL | Verification token hash |
| expiresAt | timestamp | NOT NULL, INDEX | Token expiration |
| createdAt | timestamp | DEFAULT NOW() | Token creation |

**Indexes**:
- `idx_verification_identifier` on `identifier`
- `idx_verification_expiresAt` on `expiresAt`
- `idx_verification_token` on `token` (unique)

## Application Entities (Reference Only)

### User (Reference Model)

**File**: `backend/app/models.py`

This is a SQLModel reference for foreign key relationships. The actual authentication data is stored in Better Auth's `user` table. The `id` must match for foreign keys to work.

```python
class User(SQLModel, table=True):
    """Reference model for Better Auth user."""
    __tablename__ = "user"

    id: str = Field(default=None, primary_key=True)  # Matches Better Auth user.id
    email: EmailStr = Field(unique=True, index=True)
    name: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Task

**File**: `backend/app/models.py`

User tasks with foreign key to Better Auth user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | int | PRIMARY KEY, AUTO INCREMENT | Task identifier |
| user_id | str | FOREIGN KEY → user.id, INDEX | Owner user (Better Auth) |
| title | string | NOT NULL, max 200 | Task title |
| description | string | OPTIONAL, max 1000 | Task description |
| completed | boolean | DEFAULT false, INDEX | Completion status |
| priority | string | DEFAULT 'medium' | Priority level |
| tags | string | OPTIONAL | JSON array of tags |
| due_date | timestamp | OPTIONAL | Task due date |
| recurrence_rule | string | OPTIONAL | iCal RRULE format |
| created_at | timestamp | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamp | DEFAULT NOW() | Update timestamp |

### Conversation & Message

**File**: `backend/app/models.py`

AI chatbot conversations linked to users.

| Entity | Foreign Key | Description |
|--------|-------------|-------------|
| Conversation | user_id → user.id | Chat sessions per user |
| Message | conversation_id → conversation.id | Messages within conversation |

## State Transitions

### User Verification State

```
┌─────────────┐
│  Sign Up    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  emailVerified=false│  ← Can sign in, limited features
└──────┬──────────────┘
       │
       │ [Click verification link]
       ▼
┌─────────────────────┐
│  emailVerified=true │  ← Full access, password reset enabled
└─────────────────────┘
```

### Password Reset Flow

```
┌──────────────┐
│Forgot Password│
└──────┬───────┘
       │
       ▼
┌─────────────────┐     1 hour expiry     ┌──────────────┐
│ Token Created   │ ─────────────────────▶│ Token Expired │
└──────┬──────────┘                       └──────────────┘
       │
       │ [User clicks link]
       ▼
┌─────────────────┐
│ Reset Password   │
│   Form           │
└──────┬──────────┘
       │
       │ [Submit new password]
       ▼
┌─────────────────┐
│ Password Updated│
└─────────────────┘
```

## Migration Notes

### Existing Data

The existing `user` table in the database will be extended by Better Auth's migration. Better Auth adds:
- `emailVerified` column
- `passwordHash` column (if not exists)
- Proper indexes

### Foreign Key Compatibility

The backend `User` reference model uses the same table name (`user`) and primary key type (string UUID). This ensures foreign key relationships continue to work after Better Auth migration.

## Validation Rules

| Entity | Field | Rule | Purpose |
|--------|-------|------|---------|
| user | email | RFC 5322 email format | Valid email addresses |
| user | password | Min 8 characters, not matching email | Password strength (FR-011) |
| verification | token | Cryptographically random, one-time use | Secure token generation |
| session | expiresAt | createdAt + 7 days | Session duration |

## Data Retention

| Data Type | Retention Period | Rationale |
|-----------|------------------|------------|
| Sessions | 7 days | Matches JWT cookie expiration |
| Verification tokens | 1 hour | Security - short-lived tokens |
| Expired sessions | Cleaned on session creation | Prevents table bloat |
| User accounts | Indefinite | User data persistence requirement |
