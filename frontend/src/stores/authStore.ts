import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  rating: number
  xp: number
  level: number
  achievements: string[]
}

export interface User {
  id: string
  name: string
  avatar?: string
  stats: UserStats
  preferences: {
    theme: 'light' | 'dark' | 'system'
    soundEnabled: boolean
    animationsEnabled: boolean
    hintsEnabled: boolean
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  initializeUser: () => void
  updateUserStats: (stats: Partial<UserStats>) => void
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void
  addAchievement: (achievementId: string) => void
  addXP: (amount: number) => void
  setUser: (user: User) => void
  logout: () => void
}

const defaultUser: User = {
  id: crypto.randomUUID(),
  name: `Player${Math.floor(Math.random() * 10000)}`,
  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rating: 1200,
    xp: 0,
    level: 1,
    achievements: [],
  },
  preferences: {
    theme: 'system',
    soundEnabled: true,
    animationsEnabled: true,
    hintsEnabled: true,
  },
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      initializeUser: () => {
        const { user } = get()
        if (!user) {
          set({
            user: defaultUser,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({
            isAuthenticated: true,
            isLoading: false,
          })
        }
      },

      updateUserStats: (newStats) => {
        const { user } = get()
        if (!user) return

        const updatedStats = { ...user.stats, ...newStats }

        // Calculate level based on XP
        const newLevel = Math.floor(updatedStats.xp / 100) + 1
        updatedStats.level = newLevel

        set({
          user: {
            ...user,
            stats: updatedStats,
          },
        })
      },

      updateUserPreferences: (newPreferences) => {
        const { user } = get()
        if (!user) return

        set({
          user: {
            ...user,
            preferences: {
              ...user.preferences,
              ...newPreferences,
            },
          },
        })
      },

      addAchievement: (achievementId) => {
        const { user } = get()
        if (!user || user.stats.achievements.includes(achievementId)) return

        set({
          user: {
            ...user,
            stats: {
              ...user.stats,
              achievements: [...user.stats.achievements, achievementId],
            },
          },
        })
      },

      addXP: (amount) => {
        const { user, updateUserStats } = get()
        if (!user) return

        const newXP = user.stats.xp + amount
        updateUserStats({ xp: newXP })
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'chess-v4-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)