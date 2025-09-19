import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Chess,
  Home,
  Users,
  Bot,
  Settings,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Trophy,
  User,
  Menu,
  X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoomStore } from '@/stores/roomStore'
import { audioService } from '@/services/audioService'
import { cn } from '@/utils/cn'

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const {
    theme,
    setTheme,
    isMobile,
    toggleSettings,
    settingsOpen: isSettingsOpen
  } = useUIStore()

  const { user } = useAuthStore()
  const { currentRoom, leaveRoom } = useRoomStore()

  const [audioEnabled, setAudioEnabled] = React.useState(audioService.getEnabled())

  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    audioService.setEnabled(newState)
  }

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom()
      navigate('/')
    }
  }

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Lobby', href: '/lobby', icon: Users },
    { name: 'Practice', href: '/practice', icon: Bot },
  ]

  const ThemeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="p-2 bg-primary-600 rounded-lg"
              >
                <Chess className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-gradient">Chess v4</span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Room indicator */}
              {currentRoom && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Room {currentRoom.roomCode}</span>
                  <button
                    onClick={handleLeaveRoom}
                    className="ml-1 p-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick actions */}
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAudio}
                  className="p-2"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="p-2"
                >
                  <ThemeIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* User info */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Trophy className="w-3 h-3" />
                    {user.stats.rating}
                  </div>
                </div>
              )}

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Mobile user info */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Rating: {user.stats.rating}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile controls */}
              <div className="flex gap-2 px-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAudio}
                  leftIcon={audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  fullWidth
                >
                  {audioEnabled ? 'Sound On' : 'Sound Off'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  leftIcon={<ThemeIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Theme
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Settings panel overlay */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="text-sm font-medium mb-3">Appearance</h3>
                <div className="space-y-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        theme === t
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {t === 'light' && <Sun className="w-4 h-4" />}
                      {t === 'dark' && <Moon className="w-4 h-4" />}
                      {t === 'system' && <Monitor className="w-4 h-4" />}
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Settings */}
              <div>
                <h3 className="text-sm font-medium mb-3">Audio</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={toggleAudio}
                      className="rounded"
                    />
                    <span className="text-sm">Enable sound effects</span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-sm">Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={audioService.getVolume()}
                      onChange={(e) => audioService.setVolume(Number(e.target.value))}
                      className="w-full"
                      disabled={!audioEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

export default Header