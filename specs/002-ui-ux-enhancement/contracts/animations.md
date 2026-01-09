# Contract: Animations

**Library**: framer-motion
**Priority**: P2

## Purpose

Defines animation specifications for list items, page transitions, and micro-interactions using Framer Motion.

## Animation Primitives

### Motion Component

```typescript
// Wrap any HTML element to animate it
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}    // Starting state
  animate={{ opacity: 1 }}    // Target state
  exit={{ opacity: 0 }}       // Exit state (requires AnimatePresence)
  transition={{ duration: 0.2 }} // Timing config
/>
```

### AnimatePresence

```typescript
// Required for exit animations
import { AnimatePresence } from 'framer-motion'

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

## Specifications

### List Item Animations

**Purpose**: Animate tasks being added/removed from task list
**Target Duration**: <200ms (SC-004)

```typescript
const listItemAnimation = {
  initial: {
    opacity: 0,
    y: -10,
    height: 0,
    marginBottom: 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    marginBottom: '0.5rem',
  },
  exit: {
    opacity: 0,
    x: -100,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    }
  },
  transition: {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1],
  }
}
```

### Page Transitions

**Purpose**: Smooth fade between routes
**Target Duration**: <300ms (SC-003)

```typescript
const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: {
    duration: 0.3,
    ease: 'easeInOut',
  }
}
```

### Hover Animations

**Purpose**: Subtle feedback on interactive elements

```typescript
const hoverAnimation = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 17,
  }
}
```

### Staggered List

**Purpose**: Sequential entrance for list items

```typescript
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,  // Delay between each child
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}
```

## Requirements Mapping

| FR | Coverage |
|----|----------|
| FR-006 | ✅ Smooth transitions for all state changes |
| FR-007 | ✅ Enter/exit animations via AnimatePresence |
| FR-008 | ✅ Reduced motion support (see below) |
| FR-009 | ✅ Loading states with skeleton/spinner |
| FR-010 | ✅ Page transitions between routes |

## Reduced Motion Support

```typescript
const shouldReduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const getAnimationConfig = () => {
  if (shouldReduceMotion()) {
    return {
      duration: 0,
      ease: 'linear',
    }
  }
  return {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1],
  }
}
```

## Usage Examples

### Animated Task List

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <AnimatePresence mode="popLayout">
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <TaskItem task={task} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

### Page Transition Wrapper

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

### Animated Button

```tsx
import { motion } from 'framer-motion'

export const AnimatedButton = motion(Button)

// Usage:
<AnimatedButton
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</AnimatedButton>
```

## Performance Considerations

### GPU Acceleration
Only animate these properties (GPU-accelerated):
- `opacity`
- `transform` (translate, scale, rotate)
- `filter`

Avoid animating:
- `width`, `height` (use layout prop instead)
- `top`, `left`, `right`, `bottom`
- `margin`, `padding` (unless in layout animation)

### Layout Animations

```typescript
// Framer Motion can animate layout changes smoothly
<motion.div layout>{children}</motion.div>
```

### Key Best Practices
1. Use `layout` prop for size/position changes
2. Keep durations under spec limits
3. Use `AnimatePresence` for exit animations
4. Set `key` prop on list items for tracking
5. Test on low-end devices

## Accessibility

- Respect `prefers-reduced-motion`
- Provide instant alternatives when reduced motion enabled
- Ensure animations don't interfere with screen readers
- Don't use animation to convey critical information only

## Testing

- Measure animation timing (should be <200ms for lists)
- Test with `prefers-reduced-motion` enabled
- Verify no layout shifts (CLS metric)
- Test on mobile devices
- Verify smooth 60fps playback
