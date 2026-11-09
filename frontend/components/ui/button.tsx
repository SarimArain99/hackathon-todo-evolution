"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Dayline button — one system, design-craft.
 * Variants: primary, secondary, ghost, destructive, outline, link.
 * Sizes: sm 40px, default 48px, lg 56px; icon buttons are 44px minimum.
 * Press feedback is CSS (scale 0.97, see .btn-press); focus is the
 * global 2px accent ring from globals.css.
 */
const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-busy:opacity-70",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive: "bg-danger text-white hover:opacity-90",
        outline: "border border-border bg-surface text-foreground hover:bg-hover-bg",
        secondary: "bg-surface-sunken text-foreground border border-border hover:bg-hover-bg",
        ghost: "text-foreground hover:bg-hover-bg",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-11 w-11",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }
    return (
      <button
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
