# Framer Motion Skill

**Source**: Context7 MCP - `/grx7/framer-motion`
**Benchmark Score**: 52.1 | **Code Snippets**: 327 | **Reputation**: Medium

## Overview

Framer Motion is a production-ready animation library for React (~38KB gzipped) providing declarative animations, gesture support, exit animations via AnimatePresence, and automatic accessibility with reduced motion support.

## Key Concepts

### 1. Basic Motion Component

```tsx
import { motion } from 'framer-motion'

export function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      I animate!
    </motion.div>
  )
}
```

### 2. AnimatePresence (Exit Animations)

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export function List({ items }) {
  return (
    <AnimatePresence initial={false}>
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.2 }}
        >
          {item.text}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

**Important**: Elements must have unique `key` prop for exit animations to work.

### 3. Animation Props

| Prop | Type | Description |
|------|------|-------------|
| `initial` | `object` | Starting state before mount |
| `animate` | `object` | Target state to animate to |
| `exit` | `object` | State when unmounting (requires AnimatePresence) |
| `transition` | `object` | Timing/easing configuration |
| `whileHover` | `object` | State when hovering |
| `whileTap` | `object` | State when tapping/clicking |
| `whileDrag` | `object` | State when dragging |

### 4. Transition Configuration

```tsx
// Duration only
<motion.div transition={{ duration: 0.5 }} />

// Duration with easing
<motion.div transition={{ duration: 0.3, ease: 'easeInOut' }} />

// Custom easing array
<motion.div transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} />

// Spring animation (default for motion components)
<motion.div transition={{ type: 'spring', stiffness: 300, damping: 20 }} />

// Different durations for initial/animate/exit
<motion.div
  transition={{
    initial: { duration: 0.2 },
    animate: { duration: 0.5 },
    exit: { duration: 0.3 }
  }}
/>
```

### 5. Variants (Reusable Animations)

```tsx
const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // Delay between children
      delayChildren: 0.2,     // Delay before starting
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function AnimatedList({ items }) {
  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.text}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 6. Layout Animations

```tsx
// Automatically animates layout changes
<motion.div layout>
  {children}
</motion.div>

// With more control
<motion.div
  layout
  layoutId="card"
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

**Benefits**: Animates position, size when children change - no manual measurements needed.

### 7. Gesture Support

```tsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onDragEnd={(info) => console.log('Dragged', info)}
>
  Drag me!
</motion.div>
```

### 8. Reduced Motion Support

```tsx
const shouldReduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const getTransition = () =>
  shouldReduceMotion()
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeInOut' }

<motion.div transition={getTransition()} />
```

Framer Motion respects `prefers-reduced-motion` automatically for spring animations.

## Performance Best Practices

### GPU-Accelerated Properties Only

**Good** (GPU-accelerated):
- `opacity`
- `transform` (translate, scale, rotate)

**Avoid** (triggers layout):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

**Solution**: Use `layout` prop for size/position changes:
```tsx
<motion.div layout>{content}</motion.div>
```

### Animation Best Practices

1. **Keep duration under 200ms** for list items (WCAG recommendation)
2. **Use transform/opacity** for 60fps performance
3. **Use `layout` prop** instead of animating dimensions directly
4. **Set `key` prop** on list items for AnimatePresence tracking

## Common Patterns

### Staggered List Entrance

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

### Modal/Dialog Animation

```tsx
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

<AnimatePresence>
  {isOpen && (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### Page Transitions (Next.js)

```tsx
// Create a template for route transitions
export default function Template({ children }: { children: React.ReactNode }) {
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

// In app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </body>
    </html>
  )
}
```

## Installation

```bash
npm install framer-motion
# or
yarn add framer-motion
# or
pnpm add framer-motion
```

## TypeScript Support

Full TypeScript support included:

```tsx
import { MotionProps, Variants } from 'framer-motion'

interface MyComponentProps extends MotionProps<'div'> {
  customProp: string
}
```

## Accessibility

- **Reduced Motion**: Automatically respects `prefers-reduced-motion`
- **Focus Management**: Animations don't trap focus
- **Screen Readers**: Motion updates don't interrupt announcements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Best Practices

1. Use `AnimatePresence` for exit animations
2. Set unique `key` props on animated items
3. Keep animations under 200ms for better UX
4. Use `layout` prop for size/position changes
5. Test with `prefers-reduced-motion` enabled
6. Use GPU-accelerated properties (opacity, transform)

## References

- [Official Documentation](https://www.framer.com/motion/)
- [GitHub Repository](https://github.com/framer/motion)
