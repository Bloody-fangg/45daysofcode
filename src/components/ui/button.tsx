import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elegant",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom 45 Days of Code variants
        hero: "bg-gradient-primary text-white shadow-xl hover:scale-105 hover:-translate-y-1 font-heading font-semibold",
        accent: "bg-gradient-accent text-accent-foreground shadow-lg hover:scale-105 font-medium",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-lg",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg",
        glass: "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
        purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg",
        violet: "bg-violet-600 text-white hover:bg-violet-700 shadow-lg",
        gold: "bg-amber-400 text-black hover:bg-amber-500 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
