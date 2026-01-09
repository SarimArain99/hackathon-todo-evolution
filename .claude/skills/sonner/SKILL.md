# Sonner Skill

**Source**: Context7 MCP - Part of shadcn/ui
**Bundle Size**: ~3KB gzipped | **Reputation**: High

## Overview

Sonner is a lightweight toast notification library for React with excellent developer experience. Features Promise support, auto-dismiss, action buttons, and automatic stacking.

## Key Concepts

### 1. Basic Setup with shadcn/ui

```bash
# Add Sonner component
npx shadcn@latest add sonner

# This installs sonner and adds components/ui/sonner.tsx
```

### 2. Add Toaster to Layout

```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Toaster Placement**: Add once at root level, typically as last element in `<body>`.

### 3. Basic Toast Usage

```tsx
'use client'

import { toast } from 'sonner'

export function Form() {
  return (
    <button onClick={() => toast.success('Task created!')}>
      Create Task
    </button>
  )
}
```

### 4. Toast Variants

```tsx
import { toast } from 'sonner'

// Success toast
toast.success('Task created successfully')

// Error toast
toast.error('Failed to create task')

// Info toast (default)
toast.info('Processing your request')

// Warning toast
toast.warning('Please check your inputs')

// Default toast
toast('Just a notification')
```

### 5. Toast with Description

```tsx
toast.success('Task created', {
  description: 'Your task has been added to the list.'
})
```

### 6. Toast with Action Button

```tsx
toast.success('Task deleted', {
  description: 'Your task has been permanently removed.',
  action: {
    label: 'Undo',
    onClick: () => restoreTask(),
  },
})
```

### 7. Auto-Dismiss Control

```tsx
// Custom duration (in milliseconds)
toast.success('Loading...', {
  duration: 10000,  // 10 seconds
})

// Never auto-dismiss
toast.success('Important!', {
  duration: Infinity,
})

// Default is 4000ms
```

### 8. Promise Toasts

```tsx
import { toast } from 'sonner'

async function createTask(data: FormData) {
  return toast.promise(
    fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => res.json()),
    {
      loading: 'Creating task...',
      success: 'Task created successfully',
      error: 'Failed to create task',
    }
  )
}
```

### 9. Rich Content Options

```tsx
import { toast } from 'sonner'

toast.success('Event created', {
  description: 'Sunday, December 03, 2023 at 9:00 AM',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
  icon: '🎉',
  className: 'my-toast-class',
  style: { background: 'blue' },
  position: 'top-right',
})
```

### 10. Toaster Component Props

```tsx
<Toaster
  position="bottom-right"      // Position of toasts
  expand={false}                // Expand on hover
  richColors                    // Enable rich colors for variants
  closeButton                   // Show close button on all toasts
  toastOptions={{
    className: 'custom-toast',
    duration: 5000,
  }}
/>
```

**Position Options**:
- `top-left`, `top-right`, `top-center`
- `bottom-left`, `bottom-right`, `bottom-center`

### 11. Dismissing Toasts

```tsx
// Dismiss specific toast by ID
const toastId = toast.success('Message')
toast.dismiss(toastId)

// Dismiss all toasts
toast.dismiss()

// Dismiss after action
toast.success('Done', {
  action: {
    label: 'Close',
    onClick: (e) => {
      e.preventDefault()
      toast.dismiss()
    }
  }
})
```

### 12. Stacking Behavior

Sonner automatically stacks toasts:
- Maximum visible toasts: **3** (default behavior)
- When 4th toast triggered, oldest auto-dismisses
- Newest toast appears at bottom
- Hovering any toast pauses all auto-dismiss timers

### 13. Custom Icons

```tsx
import { CheckCircle2, XCircle } from 'lucide-react'

toast.success('Success', {
  icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
})

toast.error('Error', {
  icon: <XCircle className="h-5 w-5 text-red-500" />,
})
```

### 14. onDismiss Callback

```tsx
toast.success('Message', {
  description: 'This will auto-dismiss',
  onDismiss: (t) => {
    console.log('Toast dismissed:', t)
  },
  onAutoClose: (t) => {
    console.log('Toast auto-closed:', t)
  },
})
```

### 15. Multiple Actions

```tsx
toast.success('File uploaded', {
  action: {
    label: 'View',
    onClick: () => router.push('/files'),
  },
  description: 'Your file has been uploaded successfully.',
})
```

## Complete Example

```tsx
'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function TaskActions() {
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Task' }),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('Task created!', {
        description: 'Your task has been added.',
        action: {
          label: 'Undo',
          onClick: () => deleteTask(newTaskId),
        },
      })
    } catch (error) {
      toast.error('Failed to create task', {
        description: error.message,
      })
    }
  }

  return (
    <div>
      <Button onClick={handleCreate}>Create Task</Button>
    </div>
  )
}
```

## Installation

```bash
# Via shadcn/ui (recommended)
npx shadcn@latest add sonner

# Or manually
npm install sonner
```

## TypeScript Support

Full TypeScript support:

```tsx
import { toast } from 'sonner'

type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: (event: MouseEvent) => void
  }
  duration?: number
  icon?: React.ReactNode
}
```

## Accessibility

- **Role**: `status` or `alert` for errors
- **Live Region**: `aria-live="polite"`
- **Screen Reader**: Announces toast appearance
- **Focus**: Not focusable (non-modal feedback)
- **Keyboard**: Close button is keyboard accessible

## Best Practices

1. **Keep messages brief**: Toasts are for quick feedback
2. **Use appropriate variants**: success/error/info/warning
3. **Provide action buttons**: For undo actions (e.g., delete, dismiss)
4. **Set appropriate duration**: 4000ms default, adjust for content length
5. **Don't overuse**: Too many toasts = notification fatigue
6. **Test with screen reader**: Verify announcements work correctly

## Browser Support

All modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## References

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [shadcn/ui Toast Guide](https://ui.shadcn.com/docs/components/sonner)
- [GitHub Repository](https://github.com/emilkowalski/sonner)
