# Contract: Toast System

**Component**: Sonner Toaster
**Location**: `frontend/components/ui/sonner.tsx` (shadcn component)
**Priority**: P3

## Purpose

Provides non-intrusive notification system for success, error, and info events with stacking, auto-dismiss, and action button support.

## Interface

### Toaster Component

```typescript
interface ToasterProps {
  // Props passed to Toaster component (optional)
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  expand?: boolean;          // Expand on hover
  richColors?: boolean;      // Enable rich colors
  closeButton?: boolean;     // Show close button
}
```

### Toast Function

```typescript
interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;         // Auto-dismiss duration in ms
  icon?: React.ReactNode;
}

interface ToastFunction {
  (message: string, options?: ToastOptions): void;
}

interface ToastAPI {
  success: ToastFunction;
  error: ToastFunction;
  info: ToastFunction;
  warning: ToastFunction;
  promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<T>;
}
```

## Behavior Specification

### Display Behavior
1. Triggered by calling `toast.success/error/info/warning()`
2. Toast appears in bottom-right (default)
3. Animates in from bottom
4. Stacks upward if multiple toasts active

### Auto-Dismiss Behavior
1. Default duration: 4000ms
2. Timer counts down on render
3. Hovering pauses the timer (FR-015)
4. After duration, toast animates out and removes from DOM

### Queue Management
1. Maximum 3 visible simultaneously (FR-012)
2. When 4th triggered, oldest auto-dismisses immediately
3. New toast appears after oldest removed
4. No hard limit on queued notifications

### Dismissal Methods
1. **Click close button**: Immediate dismissal
2. **Click toast**: Optional (can be configured)
3. **Auto-dismiss**: After duration expires
4. **Manual**: `toast.dismiss(id)` API

### Action Buttons
1. Rendered below toast message
2. Clicking executes callback
3. Toast dismisses after action executes
4. Styling: outlined button, matches variant

## Requirements Mapping

| FR | Coverage |
|----|----------|
| FR-011 | ✅ Success, error, info variants |
| FR-012 | ✅ Max 3 visible, oldest dismissed |
| FR-013 | ✅ Click, timeout, close button |
| FR-014 | ✅ Action button support |
| FR-015 | ✅ Hover pauses auto-dismiss |

## Usage Examples

### Basic Toast

```tsx
import { toast } from 'sonner'

toast.success('Task created successfully')
```

### With Description

```tsx
toast.success('Task created', {
  description: 'Your task has been added to the list.'
})
```

### With Action Button

```tsx
toast.success('Task deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreTask(taskId)
  }
})
```

### Error Handling

```tsx
try {
  await createTask(data)
  toast.success('Task created')
} catch (error) {
  toast.error('Failed to create task', {
    description: error.message
  })
}
```

### Promise Toast

```tsx
toast.promise(
  createTask(data),
  {
    loading: 'Creating task...',
    success: 'Task created successfully',
    error: 'Failed to create task'
  }
)
```

## Toaster Placement

Add to `app/layout.tsx`:

```tsx
import { Toaster } from '@/components/ui/sonner'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
```

## Animation Specifications

```typescript
const toastAnimations = {
  enter: {
    y: 100,
    opacity: 0,
    scale: 0.9,
  },
  enterActive: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 200,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    y: 20,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 150,
    },
  },
}
```

## Accessibility

- **Role**: `status` or `alert` for errors
- **Live Region**: `aria-live="polite"`
- **Announcements**: Screen reader announces toast on appear
- **Focus**: Not focusable (non-modal feedback)
- **Dismissal**: Close button is focusable and labeled

## Testing

- Trigger toast, verify appears in <50ms
- Verify auto-dismiss after duration
- Verify hover pauses timer
- Click close button, verify immediate dismissal
- Trigger 4+ toasts, verify max 3 visible
- Verify action button executes callback
- Verify keyboard accessibility
