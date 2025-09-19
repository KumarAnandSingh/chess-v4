import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    leftIcon,
    rightIcon,
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className={cn('flex flex-col', { 'w-full': fullWidth })}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 dark:text-slate-500">
                {leftIcon}
              </span>
            </div>
          )}

          <motion.input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200',
              'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
              'border-slate-300 dark:border-slate-600',
              'placeholder-slate-400 dark:placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon,
                'border-red-300 focus:ring-red-500': error,
              },
              className
            )}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-400 dark:text-slate-500">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input