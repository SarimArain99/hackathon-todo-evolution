# Research: Credential Persistence & Account Recovery

**Feature**: 010-credential-persistence
**Date**: 2026-01-29
**Status**: Complete

## Overview

This document captures research findings for implementing persistent credential storage and account recovery using Better Auth with PostgreSQL database.

## Key Decisions

### 1. Database Adapter for Better Auth

**Decision**: Use Better Auth's built-in PostgreSQL adapter with Kysely

**Rationale**:
- Better Auth natively supports PostgreSQL through the Kysely database adapter
- The project already uses Neon PostgreSQL (constitution mandate)
- Better Auth provides CLI tools for schema generation and migration
- No additional ORM complexity - Better Auth manages its own tables

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Prisma adapter | Additional dependency; Better Auth's native adapter is simpler |
| Custom SQL integration | Loses Better Auth's migration and type safety benefits |
| Continue stateless | Does not solve credential persistence requirement |

**Implementation**:
```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  // ... rest of config
});
```

**Schema Migration**:
```bash
npx @better-auth/cli generate  # Generate migration files
npx @better-auth/cli migrate   # Apply migrations to database
```

### 2. Email Service for Verification & Password Reset

**Decision**: Use Resend for email delivery

**Rationale**:
- Resend provides a simple API for transactional emails
- Good TypeScript SDK support
- Generous free tier (3000 emails/day)
- Simple templates for verification and reset emails

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Nodemailer directly | Requires SMTP server configuration; not serverless-friendly |
| SendGrid | More complex API; lower free tier |
| AWS SES | Higher complexity; requires AWS setup |

**Implementation**:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "noreply@example.com",
        to: user.email,
        subject: "Reset your password",
        html: `<a href="${url}">Reset Password</a>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "noreply@example.com",
        to: user.email,
        subject: "Verify your email",
        html: `<a href="${url}">Verify Email</a>`,
      });
    },
  },
});
```

### 3. Token Expiration Strategy

**Decision**: 1-hour expiration for both verification and reset tokens

**Rationale**:
- Industry standard for security-sensitive tokens
- Balances user experience with security
- Matches Better Auth's default `resetPasswordTokenExpiresIn: 3600`

**Configuration**:
- Password reset tokens: 1 hour (configurable via `resetPasswordTokenExpiresIn`)
- Email verification tokens: 1 hour (Better Auth default)
- Session JWT: 7 days (existing configuration maintained)

### 4. Rate Limiting Strategy

**Decision**: Implement rate limiting using Better Auth's built-in hooks

**Rationale**:
- Prevents email spam abuse
- Meets spec requirement (max 3 requests per hour)
- Better Auth provides `beforeRequest` and `afterRequest` hooks

**Implementation**:
```typescript
import { rateLimit } from "./lib/rate-limit"; // Custom rate limiter

export const auth = betterAuth({
  emailAndPassword: {
    sendResetPassword: async ({ user, email }, request) => {
      // Check rate limit before sending
      const allowed = await rateLimit.check(email, "password-reset", 3, 3600);
      if (!allowed) {
        throw new Error("Too many requests. Please try again later.");
      }
      // ... send email
    },
  },
});
```

## Database Schema Changes

### Better Auth Managed Tables

Better Auth will create and manage these tables via migration:

| Table | Purpose |
|-------|---------|
| `user` | User accounts with email, password hash, verified flag |
| `session` | Active user sessions |
| `account` | OAuth account linking (for future social providers) |
| `verification` | Email verification tokens |

### Existing Backend Models

The existing `User` model in `backend/app/models.py` will remain for foreign key relationships. Better Auth's user table will be the source of truth for authentication.

## Security Considerations

1. **Email Enumeration Prevention**: Password reset always returns success regardless of whether email exists (FR-009)
2. **Token Expiration**: All tokens expire after 1 hour
3. **Rate Limiting**: 3 password reset requests per hour per email
4. **Secure Cookies**: HTTPS-only cookies in production (existing)

## Migration Strategy

### Phase 1: Add Database (P1 - Persistent Sign-In)
1. Add `pg` and `@types/pg` dependencies
2. Configure Better Auth with PostgreSQL adapter
3. Run Better Auth migrations
4. Update auth configuration to remove stateless mode

### Phase 2: Add Password Reset (P2 - Password Recovery)
1. Configure `sendResetPassword` callback
2. Create `/reset-password/[token]` route
3. Implement reset password form
4. Update "Forgot Password" button functionality

### Phase 3: Add Email Verification (P3 - Email Verification)
1. Configure `sendVerificationEmail` callback
2. Set `requireEmailVerification: true`
3. Create verification status indicator
4. Handle unverified user state

## Open Questions Resolved

| Question | Answer | Source |
|----------|--------|--------|
| Which database adapter to use? | PostgreSQL with Kysely (Better Auth native) | Better Auth docs |
| Email service provider? | Resend (simple, good free tier) | Research |
| Token expiration duration? | 1 hour (industry standard) | Better Auth defaults |
| How to handle existing users? | Migration will create Better Auth user table; existing data preserved via foreign keys | Schema analysis |

## References

- Better Auth Database Documentation: https://www.better-auth.com/docs/concepts/database
- Better Auth Email & Password: https://www.better-auth.com/docs/authentication/email-password
- Better Auth CLI Commands: https://www.better-auth.com/docs/cli/overview
- Resend Documentation: https://resend.com/docs
