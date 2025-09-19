import React from 'react'
import { motion } from 'framer-motion'
import Header from './Header'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useUIStore()

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br transition-colors duration-300',
      theme === 'dark'
        ? 'from-slate-900 to-slate-800 text-slate-100'
        : 'from-slate-50 to-slate-100 text-slate-900'
    )}>
      <Header />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-6"
      >
        {children}
      </motion.main>
    </div>
  )
}

export default Layout