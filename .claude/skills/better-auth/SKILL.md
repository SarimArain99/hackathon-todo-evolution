# Better Auth Skill

**Source**: Context7 MCP - `/better-auth/better-auth`
**Benchmark Score**: 79.4 | **Code Snippets**: 2333 | **Reputation**: High

## Overview

Better Auth is a framework-agnostic authentication and authorization library for TypeScript, offering comprehensive features and a plugin ecosystem for advanced functionalities.

## Key Concepts

### 1. JWT Plugin Configuration

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: "https://example.com",
      audience: ["https://api.example.com"],
    }),
  ],
});
```

### 2. Next.js Server Component Session Validation

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session) {
        redirect("/sign-in")
    }

    return <h1>Welcome {session.user.name}</h1>
}
```

### 3. Server-Side Session Validation

**Method**: `auth.api.getSession`

**Parameters:**
- `headers` (object) - Required - HTTP request headers containing session token

**Response:**
- `session.user.id` - User ID
- `session.user.name` - User's name
- `session.user.email` - User's email
- `session.session.id` - Session ID
- `session.session.expiresAt` - Expiration time

### 4. Next.js API Route Protection

```typescript
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await fetchUserData(session.user.id);
  return Response.json({ data });
}
```

### 5. Middleware for Route Protection

```typescript
import { auth } from "@/lib/auth";

export async function middleware(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  const isProtectedRoute = request.url.includes("/dashboard");

  if (isProtectedRoute && !session) {
    return Response.redirect(new URL("/sign-in", request.url));
  }
}
```

### 6. Protected Page Pattern

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

## Hackathon JWT Flow

1. **User logs in** → Better Auth creates session and issues JWT
2. **Frontend makes API call** → Includes JWT in `Authorization: Bearer <token>` header
3. **Backend receives request** → Extracts token, verifies signature
4. **Backend identifies user** → Decodes token to get user ID
5. **Backend filters data** → Returns only tasks for that user

## Environment Variables

```env
BETTER_AUTH_SECRET=your-shared-secret-key
```

Both frontend (Better Auth) and backend (FastAPI) must use the same secret for JWT signing/verification.

## Security Benefits

| Benefit | Description |
|---------|-------------|
| User Isolation | Each user only sees their own tasks |
| Stateless Auth | Backend doesn't need to call frontend |
| Token Expiry | JWTs expire automatically |
| Independent Verification | Frontend and backend verify auth independently |
