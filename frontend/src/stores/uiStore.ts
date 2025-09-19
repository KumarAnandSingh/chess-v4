import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  timestamp: number
}

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  chatOpen: boolean
  settingsOpen: boolean
  boardOrientation: 'white' | 'black'
  showMoveList: boolean
  showCapturedPieces: boolean
  boardSize: 'small' | 'medium' | 'large'
  animations: {
    enabled: boolean
    speed: 'slow' | 'normal' | 'fast'
  }
  notifications: Notification[]
  isFullscreen: boolean
  isMobile: boolean
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  toggleChat: () => void
  toggleSettings: () => void
  setBoardOrientation: (orientation: 'white' | 'black') => void
  toggleMoveList: () => void
  toggleCapturedPieces: () => void
  setBoardSize: (size: 'small' | 'medium' | 'large') => void
  setAnimations: (animations: Partial<UIState['animations']>) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setFullscreen: (isFullscreen: boolean) => void
  setIsMobile: (isMobile: boolean) => void
  initializeUI: () => void
}

const defaultState: UIState = {
  theme: 'system',
  sidebarOpen: false,
  chatOpen: false,
  settingsOpen: false,
  boardOrientation: 'white',
  showMoveList: true,
  showCapturedPieces: true,
  boardSize: 'medium',
  animations: {
    enabled: true,
    speed: 'normal',
  },
  notifications: [],
  isFullscreen: false,
  isMobile: false,
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setTheme: (theme) => {
        set({ theme })

        // Apply theme to document
        const root = document.documentElement
        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      toggleChat: () => {
        set((state) => ({ chatOpen: !state.chatOpen }))
      },

      toggleSettings: () => {
        set((state) => ({ settingsOpen: !state.settingsOpen }))
      },

      setBoardOrientation: (orientation) => {
        set({ boardOrientation: orientation })
      },

      toggleMoveList: () => {
        set((state) => ({ showMoveList: !state.showMoveList }))
      },

      toggleCapturedPieces: () => {
        set((state) => ({ showCapturedPieces: !state.showCapturedPieces }))
      },

      setBoardSize: (size) => {
        set({ boardSize: size })
      },

      setAnimations: (animations) => {
        set((state) => ({
          animations: { ...state.animations, ...animations },
        }))
      },

      addNotification: (notification) => {
        const id = crypto.randomUUID()
        const timestamp = Date.now()

        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id, timestamp },
          ],
        }))

        // Auto-remove notification after duration
        const duration = notification.duration || 5000
        setTimeout(() => {
          get().removeNotification(id)
        }, duration)
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      setFullscreen: (isFullscreen) => {
        set({ isFullscreen })
      },

      setIsMobile: (isMobile) => {
        set({ isMobile })
      },

      initializeUI: () => {
        const { theme } = get()

        // Initialize theme
        get().setTheme(theme)

        // Detect mobile
        const checkMobile = () => {
          const isMobile = window.innerWidth < 768
          get().setIsMobile(isMobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleThemeChange = () => {
          if (get().theme === 'system') {
            get().setTheme('system') // Re-apply system theme
          }
        }

        mediaQuery.addEventListener('change', handleThemeChange)

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
          const isFullscreen = !!document.fullscreenElement
          get().setFullscreen(isFullscreen)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)

        // Cleanup function (would be called on unmount in a real app)
        return () => {
          window.removeEventListener('resize', checkMobile)
          mediaQuery.removeEventListener('change', handleThemeChange)
          document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
      },
    }),
    {
      name: 'chess-v4-ui',
      partialize: (state) => ({
        theme: state.theme,
        boardOrientation: state.boardOrientation,
        showMoveList: state.showMoveList,
        showCapturedPieces: state.showCapturedPieces,
        boardSize: state.boardSize,
        animations: state.animations,
      }),
    }
  )
)