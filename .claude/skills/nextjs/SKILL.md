# Next.js Skill

**Source**: Context7 MCP - `/websites/nextjs_app`
**Benchmark Score**: 92.5 | **Code Snippets**: 2664 | **Reputation**: High

## Overview

Next.js App Router provides React Server Components, client components, layouts, and improved data fetching for building full-stack web applications.

## Key Concepts

### 1. Server Components (Default)

```typescript
// app/posts/page.tsx - Server Component by default
export default async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

**Characteristics:**
- Execute on server only
- Direct database access
- Secure API keys and secrets
- Reduce JavaScript bundle size

### 2. Client Components

```typescript
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Characteristics:**
- Render in browser
- Access browser APIs
- Use React hooks
- Event listeners and interactivity

### 3. Data Fetching Pattern

```typescript
// app/page.tsx
import HomePage from './home-page';

async function getPosts() {
  const res = await fetch('https://...');
  return res.json();
}

export default async function Page() {
  const recentPosts = await getPosts();
  return <HomePage recentPosts={recentPosts} />;
}
```

### 4. Server Actions

```typescript
// app/actions.ts
'use server';

export async function submitForm(formData: FormData) {
  const email = formData.get('email');
  await db.users.create({ email });
  return { success: true };
}
```

```typescript
// app/form.tsx
'use client';

import { submitForm } from '@/app/actions';

export default function Form() {
  return (
    <form action={submitForm}>
      <input name="email" type="email" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 5. Composition Pattern

```typescript
// app/posts/[id]/page.tsx - Server Component
import InteractiveComponent from './interactive';

export default async function PostPage({ params }) {
  const post = await fetchPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <InteractiveComponent postId={params.id} />
    </article>
  );
}
```

```typescript
// app/posts/[id]/interactive.tsx - Client Component
'use client';
import { useState } from 'react';

export default function InteractiveComponent({ postId }) {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'} Like
    </button>
  );
}
```

## Best Practices

1. Keep Server Components at top of component tree
2. Pass data from Server to Client via props
3. Use Client Components for interactivity only
4. Use Server Actions for data mutations

## Running

```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Production server
```
