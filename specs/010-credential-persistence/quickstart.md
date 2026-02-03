# Quickstart: Credential Persistence & Account Recovery

**Feature**: 010-credential-persistence
**Date**: 2026-01-29
**Status**: Complete

## Overview

This guide provides step-by-step instructions for setting up credential persistence and account recovery using Better Auth with PostgreSQL and Resend email service.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Resend account for email delivery
- Better Auth configured in the project

## Step 1: Install Dependencies

### Backend (Python/FastAPI)

The backend already has the required dependencies. No changes needed.

### Frontend (Next.js)

```bash
# Install PostgreSQL client for Better Auth
npm install pg @types/pg

# Install Resend for email sending
npm install resend

# Install Better Auth CLI for migrations
npm install -D @better-auth/cli
```

## Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Database (PostgreSQL - Neon)
DATABASE_URL=postgresql://user:password@host/database

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-32-chars-min
BETTER_AUTH_URL=http://localhost:3000
REQUIRE_EMAIL_VERIFICATION=true

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Trusted Origins (for CSRF)
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Step 3: Run Database Migrations

Better Auth CLI will generate and apply the database schema:

```bash
# Generate migration files
npx @better-auth/cli generate

# Apply migrations to database
npx @better-auth/cli migrate
```

This creates the following tables:
- `user` - User accounts
- `session` - Active sessions
- `verification` - Email verification tokens
- `account` - OAuth account linking

## Step 4: Update Better Auth Configuration

### Replace Stateless Configuration with Database

**Before** (stateless, current):
```typescript
// frontend/lib/auth.ts
export const auth = betterAuth({
  session: {
    cookieCache: { enabled: true }, // Stateless cookies only
  },
  account: {
    storeStateStrategy: "cookie",
  },
});
```

**After** (with database):
```typescript
// frontend/lib/auth.ts
import { Pool } from "pg";
import { resend } from "./lib/email";

export const auth = betterAuth({
  // Add database adapter
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  }),

  // Remove stateless session config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },

  // Remove account.cookie config (now in database)
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  // Email & password with reset
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "noreply@yourdomain.com",
        to: user.email,
        subject: "Reset Your Password",
        html: `
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${url}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
      });
    },
  },

  // Email verification
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "noreply@yourdomain.com",
        to: user.email,
        subject: "Verify Your Email",
        html: `
          <h1>Welcome!</h1>
          <p>Click the link below to verify your email:</p>
          <a href="${url}">Verify Email</a>
        `,
      });
    },
  },

  // Keep JWT plugin for backend authentication
  plugins: [
    jwt({
      jwks: { jwksPath: "/api/auth/jwks" },
      expiresIn: 60 * 60 * 24 * 7,
    }),
    nextCookies(),
  ],
});
```

## Step 5: Create Email Service

Create `frontend/lib/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Rate limiting wrapper (in-memory for simplicity)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

## Step 6: Create Reset Password Page

Create `frontend/app/(auth)/reset-password/[token]/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password/" + params.token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      router.push("/sign-in?reset=success");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1>Reset Password</h1>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </main>
  );
}
```

## Step 7: Update Sign-In Page

Enable the "Forgot Password" button in `frontend/app/(auth)/sign-in/page.tsx`:

```typescript
// Replace the placeholder button with:
<button
  type="button"
  onClick={() => router.push("/forgot-password")}
  className="text-[10px] text-primary font-bold uppercase"
>
  Forgot?
</button>
```

## Step 8: Create Forgot Password Page

Create `frontend/app/(auth)/forgot-password/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/auth/send-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setMessage("If an account exists with this email, a reset link has been sent.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1>Forgot Password</h1>
        {message ? (
          <p>{message}</p>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}
        <button type="button" onClick={() => router.push("/sign-in")}>
          Back to Sign In
        </button>
      </form>
    </main>
  );
}
```

## Testing

### 1. Test Persistent Sign-In

```bash
# 1. Sign up with test credentials
# 2. Close browser
# 3. Reopen and sign in with same credentials
# Expected: Should successfully sign in and see your data
```

### 2. Test Password Reset

```bash
# 1. Go to /sign-in
# 2. Click "Forgot Password"
# 3. Enter your email
# 4. Check email for reset link
# 5. Click link, enter new password
# 6. Sign in with new password
# Expected: Should successfully sign in with new password
```

### 3. Test Email Verification

```bash
# 1. Sign up with new email
# 2. Check email for verification link
# 3. Click verification link
# Expected: Should redirect to dashboard and show verified status
```

## Troubleshooting

### Migration Fails

```bash
# Check database connection
echo $DATABASE_URL

# Regenerate migrations
npx @better-auth/cli generate

# Check generated SQL
cat better-auth/migrations/*.sql
```

### Emails Not Sending

```bash
# Check Resend API key
echo $RESEND_API_KEY

# Check Resend dashboard for email logs
# https://resend.com/dashboard
```

### Rate Limiting Issues

```bash
# Check rate limit in code
# Default: 3 requests per hour per email
# To reset: wait 1 hour or change email
```

## Next Steps

1. Configure Resend domain and verify sender email
2. Test email delivery in development
3. Set up production environment variables
4. Run `/sp.tasks` to generate implementation tasks
