import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gold'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  pill?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-crimson-grad text-white shadow-lg shadow-crimson-500/25 border border-crimson-400/30 hover:brightness-110',
  secondary: 'bg-ink-750 text-fog-100 border border-line-strong hover:bg-ink-700',
  ghost: 'text-fog-300 hover:text-fog-100 hover:bg-ink-750',
  outline: 'border border-line-strong text-fog-200 hover:border-ink-500 hover:text-fog-100 bg-transparent',
  danger: 'bg-crimson-700/20 text-crimson-300 border border-crimson-500/35 hover:bg-crimson-700/35',
  success: 'bg-mint-500/15 text-mint-300 border border-mint-400/35 hover:bg-mint-500/25',
  gold: 'bg-gold-grad text-ink-950 font-bold border border-gold-300/40 hover:brightness-105',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  xl: 'h-14 px-7 text-base gap-2.5 rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', pill = false, className, disabled, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.965 }}
      transition={{ type: 'spring', stiffness: 550, damping: 30 }}
      disabled={disabled}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold tracking-tight transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-400',
        VARIANTS[variant],
        SIZES[size],
        pill && 'rounded-full',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      {...rest}
    >
      {children}
    </motion.button>
  )
})
