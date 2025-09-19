import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    clickable = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = cn(
      'rounded-xl transition-all duration-200',
      {
        'cursor-pointer': clickable,
      }
    )

    const variantClasses = {
      default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm',
      elevated: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg',
      outlined: 'bg-transparent border-2 border-slate-200 dark:border-slate-700',
      glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20',
    }

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverClasses = hover ? 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1' : ''

    const CardComponent = clickable ? motion.div : 'div'

    return (
      <CardComponent
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          className
        )}
        whileHover={clickable ? { scale: 1.02, y: -2 } : undefined}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </CardComponent>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}) => (
  <div
    className={cn('flex items-start justify-between mb-4', className)}
    {...props}
  >
    <div className="flex-1">
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      )}
      {children}
    </div>
    {action && (
      <div className="ml-4 flex-shrink-0">
        {action}
      </div>
    )}
  </div>
)

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700', className)}
    {...props}
  >
    {children}
  </div>
)

export default Card