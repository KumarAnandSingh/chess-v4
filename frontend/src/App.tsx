import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

// Pages
import LandingPage from '@/pages/LandingPage'
import LobbyPage from '@/pages/LobbyPage'
import RoomPage from '@/pages/RoomPage'
import GamePage from '@/pages/GamePage'
import PracticePage from '@/pages/PracticePage'

// Layout
import Layout from '@/components/layout/Layout'

// Services
import { socketService } from '@/services/socketService'
import { audioService } from '@/services/audioService'

// Stores
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

// Utils
import { cn } from '@/utils/cn'

function App() {
  const location = useLocation()
  const { initializeUser } = useAuthStore()
  const { theme, initializeUI } = useUIStore()

  useEffect(() => {
    // Initialize services and stores
    initializeUser()
    initializeUI()
    audioService.initialize()

    // Connect socket when app starts
    socketService.connect()

    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, [initializeUser, initializeUI])

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      theme === 'dark' ? 'dark' : ''
    )}>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LandingPage />
                </motion.div>
              }
            />
            <Route
              path="/lobby"
              element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LobbyPage />
                </motion.div>
              }
            />
            <Route
              path="/room/:code"
              element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <RoomPage />
                </motion.div>
              }
            />
            <Route
              path="/game/:gameId"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GamePage />
                </motion.div>
              }
            />
            <Route
              path="/practice"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PracticePage />
                </motion.div>
              }
            />
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </div>
  )
}

export default App