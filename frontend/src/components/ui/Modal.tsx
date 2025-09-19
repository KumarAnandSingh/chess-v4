import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl',
              'border border-slate-200 dark:border-slate-700',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 pb-4">
                {title && (
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn('px-6', { 'pt-6': !title && !showCloseButton, 'pb-6': true })}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Modal sub-components
interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className,
}) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
)

interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
}) => (
  <div className={cn('', className)}>
    {children}
  </div>
)

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
}) => (
  <div className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700', className)}>
    {children}
  </div>
)

export default Modal