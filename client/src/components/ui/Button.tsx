import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden transform-gpu will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl",
        destructive:
          "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl",
        outline:
          "border-2 border-blue-500 bg-transparent text-blue-600 hover:bg-blue-500 hover:text-white shadow-sm hover:shadow-lg",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow hover:shadow-lg",
        ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
        flow: "bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-2xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
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
  ripple?: boolean
  flowing?: boolean
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
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 },
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.2
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
        <span className="relative z-10">{children}</span>
        
        {/* Flowing background gradient animation */}
        {flowing && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-xl"
            initial={{ x: "-100%", opacity: 0 }}
            whileHover={{ 
              x: "100%", 
              opacity: [0, 1, 0],
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
          />
        )}

        {/* Ripple effect */}
        {ripple && isRippling && rippleCoords && (
          <motion.span
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: rippleCoords.x - 10,
              top: rippleCoords.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Subtle glow effect for primary variants */}
        {(variant === 'default' || variant === 'flow') && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        )}
      </MotionButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }