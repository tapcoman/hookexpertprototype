import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition-all duration-300 transform-gpu will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-teal-bright text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0",
        primary: "bg-gradient-to-r from-primary to-electric-blue text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-0.5",
        secondary: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:scale-[1.01] hover:-translate-y-0.5",
        destructive: "bg-gradient-to-r from-coral-red to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 backdrop-blur-sm",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 backdrop-blur-sm hover:scale-[1.01]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover transition-colors",
        glass: "bg-white/10 backdrop-blur-glass border border-white/20 text-white shadow-glass hover:bg-white/20 hover:shadow-glass-lg hover:scale-[1.02] hover:-translate-y-0.5",
        gradient: "bg-gradient-to-r from-primary via-teal-bright to-electric-blue bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-0.5 animate-gradient-flow",
        premium: "bg-gradient-to-r from-primary to-teal-bright text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-0.5 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        flow: "bg-gradient-to-r from-primary to-electric-blue text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-0.5 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-white/20 before:to-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-xl",
        default: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base rounded-2xl",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-2xl",
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
  ripple?: boolean
  flowing?: boolean
  shimmer?: boolean
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ripple = true, flowing = false, children, ...props }, ref) => {
    const [rippleCoords, setRippleCoords] = React.useState<{ x: number; y: number } | null>(null)
    const [isRippling, setIsRippling] = React.useState(false)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !props.disabled) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setRippleCoords({ x, y })
        setIsRippling(true)
        setTimeout(() => setIsRippling(false), 600)
      }
      props.onClick?.(e)
    }

    const MotionButton = flowing ? motion.button : 'button' as any
    const motionProps = flowing ? {
      whileHover: { 
        scale: 1.02, 
        y: -2,
        boxShadow: "0 20px 64px rgba(59, 130, 246, 0.25), 0 8px 32px rgba(31, 38, 135, 0.15)"
      },
      whileTap: { scale: 0.98, y: 0 },
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        duration: 0.15
      }
    } : {}

    return (
      <MotionButton
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...motionProps}
        {...props}
      >
        <span className="relative z-10 font-semibold">{children}</span>
        
        {/* Premium shimmer effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
        
        {/* Flowing background gradient animation */}
        {flowing && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/30 to-white/10 rounded-2xl"
            initial={{ x: "-100%", opacity: 0 }}
            whileHover={{ 
              x: "100%", 
              opacity: [0, 0.8, 0],
              transition: { duration: 1, ease: "easeInOut" }
            }}
          />
        )}

        {/* Enhanced ripple effect */}
        {ripple && isRippling && rippleCoords && (
          <motion.span
            className="absolute bg-white/40 rounded-full pointer-events-none"
            style={{
              left: rippleCoords.x - 15,
              top: rippleCoords.y - 15,
              width: 30,
              height: 30,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}

        {/* Premium glow effect */}
        {(variant === 'default' || variant === 'primary' || variant === 'premium' || variant === 'gradient' || variant === 'flow') && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/30 to-teal-bright/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        )}
        
        {/* Glass effect background */}
        {variant === 'glass' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </MotionButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }