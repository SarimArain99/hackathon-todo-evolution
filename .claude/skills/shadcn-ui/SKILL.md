# shadcn/ui Skill

**Source**: Context7 MCP - `/websites/ui_shadcn`
**Benchmark Score**: 73.1 | **Code Snippets**: 1056 | **Reputation**: High

## Overview

shadcn/ui is NOT a component library - it's a collection of re-usable components copied into your project. Components are built with Radix UI primitives, Tailwind CSS, and TypeScript. You own the code and can customize freely.

## Key Concepts

### 1. Not a Package, But Code You Own

```bash
# Unlike traditional libraries:
# npm install shadcn-ui  # ❌ This doesn't exist

# Instead, you copy components:
npx shadcn@latest add button  # ✅ Copies button.tsx to your project
```

**Benefits**:
- Full control over component code
- No dependency updates to break things
- Customize directly in your codebase
- No additional bundle size for unused components

### 2. Initial Setup

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Prompts you for:
# - TypeScript: Yes
# - Style: Default (CSS variables + Tailwind)
# - Base color: Slate (or other)
# - CSS variables: Yes
# - Import alias: @/components (or your preference)
```

**Creates**:
- `components.json` - Configuration file
- `lib/utils.ts` - Utility functions (cn helper)
- Updates `tailwind.config.js` - Adds CSS variable paths

### 3. Adding Components

```bash
# Add single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button input card dialog

# Add with specific options
npx shadcn@latest add button --yes --overwrite
```

**Component is copied to**: `components/ui/button.tsx`

### 4. Component Structure

```tsx
// components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 5. Using Components

```tsx
import { Button } from '@/components/ui/button'

export default function Page() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline" size="sm">Small</Button>
      <Button variant="ghost" size="icon">🔍</Button>
    </div>
  )
}
```

### 6. Class Variance Authority (CVA)

shadcn/ui uses CVA for variant management:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const variants = cva(
  'base-classes',  // Applied to all variants
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-500 text-white',
      },
      size: {
        small: 'px-2 py-1 text-sm',
        large: 'px-4 py-2 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'small',
    },
  }
)

type Props = VariantProps<typeof variants>
```

### 7. The `cn()` Utility

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage**:
```tsx
cn('px-2 py-1', 'bg-blue-500')  // Merges classes intelligently
cn('px-2 py-1', 'px-4')         // Resolves to 'py-1 px-4' (no duplicates)
```

### 8. CSS Variables Integration

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
  }
}
```

**Usage in components**:
```tsx
<div className="bg-background text-foreground">
  Content styled with CSS variables
</div>
```

### 9. Radix UI Primitives

shadcn/ui is built on Radix UI - headless, accessible components:

| shadcn Component | Radix Primitive |
|-----------------|-----------------|
| Accordion | @radix-ui/react-accordion |
| Alert Dialog | @radix-ui/react-alert-dialog |
| Dialog | @radix-ui/react-dialog |
| Dropdown Menu | @radix-ui/react-dropdown-menu |
| Popover | @radix-ui/react-popover |
| Select | @radix-ui/react-select |
| Tabs | @radix-ui/react-tabs |
| Toast (Sonner) | sonner (custom) |

## Available Components

Common components:
- `accordion`, `alert`, `alert-dialog`, `aspect-ratio`
- `avatar`, `badge`, `button`, `calendar`
- `card`, `carousel`, `checkbox`, `collapsible`
- `command`, `context-menu`, `dialog`, `drawer`
- `dropdown-menu`, `form`, `hover-card`, `input`
- `label`, `menubar`, `navigation-menu`, `popover`
- `progress`, `radio-group`, `resizable`, `scroll-area`
- `select`, `separator`, `sheet`, `skeleton`
- `slider`, `sonner` (toast), `switch`, `table`
- `tabs`, `textarea`, `toast`, `toggle`, `tooltip`

## Configuration (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## Installation Steps

```bash
# 1. Install dependencies
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# 2. Initialize shadcn/ui
npx shadcn@latest init

# 3. Add components as needed
npx shadcn@latest add button input card dialog sonner
```

## Best Practices

1. **Customize freely**: Since you own the code, edit components directly
2. **Use `cn()` utility**: Merges Tailwind classes without conflicts
3. **Follow CSS variables**: Use defined semantic tokens for consistency
4. **TypeScript first**: All components have full type definitions
5. **Accessible by default**: Radix UI primitives handle ARIA

## Updating Components

```bash
# Update a component (overwrites local changes)
npx shadcn@latest add button --overwrite

# Check for updates
npx shadcn@latest check
```

## Browser Support

Supports all modern browsers that Radix UI supports:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

All components are built on Radix UI which:
- Follows WAI-ARIA patterns
- Supports keyboard navigation
- Manages focus for screen readers
- Includes proper ARIA attributes

## References

- [Official Documentation](https://ui.shadcn.com/)
- [GitHub Repository](https://github.com/shadcn-ui/ui)
- [Radix UI Documentation](https://www.radix-ui.com/)
