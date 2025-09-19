import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Play,
  Trophy,
  Target,
  Brain,
  Zap,
  Clock,
  Settings,
  ArrowLeft,
  Star,
  TrendingUp
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import ChessBoard from '@/components/chess/ChessBoard'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { Chess } from 'chess.js'
import { cn } from '@/utils/cn'

interface AILevel {
  id: string
  name: string
  rating: number
  description: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
}

const PracticePage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState('intermediate')
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState('standard')

  const navigate = useNavigate()
  const { initializeGame, game, makeMove } = useGameStore()
  const { user, addXP } = useAuthStore()

  const aiLevels: AILevel[] = [
    {
      id: 'beginner',
      name: 'Beginner',
      rating: 800,
      description: 'Perfect for learning the basics',
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      rating: 1200,
      description: 'Good practice for developing players',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'advanced',
      name: 'Advanced',
      rating: 1600,
      description: 'Challenging for experienced players',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'expert',
      name: 'Expert',
      rating: 2000,
      description: 'Master-level play',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ]

  const practiceModes = [
    {
      id: 'standard',
      name: 'Standard Game',
      description: 'Play a full game against AI',
      icon: Play,
    },
    {
      id: 'endgame',
      name: 'Endgame Practice',
      description: 'Practice common endgame positions',
      icon: Target,
    },
    {
      id: 'opening',
      name: 'Opening Trainer',
      description: 'Learn and practice chess openings',
      icon: Zap,
    },
    {
      id: 'tactics',
      name: 'Tactical Puzzles',
      description: 'Solve tactical combinations',
      icon: Brain,
    }
  ]

  const startPracticeGame = () => {
    const level = aiLevels.find(l => l.id === selectedLevel)!

    // Initialize a new game
    const newGame = new Chess()
    const mockGameState = {
      gameId: `practice-${Date.now()}`,
      position: newGame.fen(),
      turn: 'white' as const,
      moves: [],
      status: 'active' as const,
      players: {
        white: {
          id: user?.id || 'user',
          name: user?.name || 'You',
          rating: user?.stats.rating || 1200,
          connected: true
        },
        black: {
          id: 'ai',
          name: level.name + ' AI',
          rating: level.rating,
          connected: true
        }
      },
      timeControl: { time: 600, increment: 5 },
      clock: { white: 600, black: 600 }
    }

    initializeGame(mockGameState, 'white')
    setGameStarted(true)
  }

  const makeAIMove = () => {
    // Simple random AI move for demo
    const possibleMoves = game.moves()
    if (possibleMoves.length > 0) {
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      const move = game.move(randomMove)

      if (move) {
        // Simulate AI move with a delay
        setTimeout(() => {
          // This would normally be handled by the AI engine
        }, 1000)
      }
    }
  }

  const endPracticeGame = () => {
    setGameStarted(false)
    // Add some XP for practice
    if (user) {
      addXP(25)
    }
  }

  if (gameStarted) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={endPracticeGame}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            End Practice
          </Button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Practice vs {aiLevels.find(l => l.id === selectedLevel)?.name} AI
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rating: {aiLevels.find(l => l.id === selectedLevel)?.rating}
            </p>
          </div>

          <Button variant="secondary" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* AI Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Opponent" />
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto flex items-center justify-center">
                    <Bot className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {aiLevels.find(l => l.id === selectedLevel)?.name} AI
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Rating: {aiLevels.find(l => l.id === selectedLevel)?.rating}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Practice Stats" />
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-medium">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>XP Earned:</span>
                    <span className="font-medium text-primary-600">+25</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chess Board */}
          <div className="lg:col-span-2 flex justify-center">
            <ChessBoard />
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Game Controls" />
              <CardContent>
                <div className="space-y-3">
                  <Button variant="secondary" fullWidth leftIcon={<Target className="w-4 h-4" />}>
                    Hint
                  </Button>
                  <Button variant="secondary" fullWidth leftIcon={<TrendingUp className="w-4 h-4" />}>
                    Analysis
                  </Button>
                  <Button variant="danger" fullWidth>
                    Resign
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Learning Tips" />
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <p>• Control the center early</p>
                  <p>• Develop knights before bishops</p>
                  <p>• Castle your king to safety</p>
                  <p>• Don't move the same piece twice in opening</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="mb-6"
        >
          Back to Home
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
          Practice Arena
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Improve your chess skills by practicing against AI opponents, solving puzzles, and studying positions
        </p>
      </motion.div>

      {/* Practice Modes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="elevated">
          <CardHeader title="Practice Mode" subtitle="Choose your training focus" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practiceModes.map((mode) => (
                <motion.button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    selectedMode === mode.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <mode.icon className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {mode.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* AI Level Selection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="elevated">
          <CardHeader title="AI Difficulty" subtitle="Select your opponent's strength" />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiLevels.map((level) => (
                <motion.button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all duration-200 text-center',
                    selectedLevel === level.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3', level.bgColor)}>
                    <level.icon className={cn('w-6 h-6', level.color)} />
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {level.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Rating: {level.rating}
                  </p>
                  <p className="text-xs text-slate-500">
                    {level.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Start Practice */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={startPracticeGame}
          leftIcon={<Play className="w-5 h-5" />}
          className="min-w-48"
        >
          Start Practice
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Playing as White against {aiLevels.find(l => l.id === selectedLevel)?.name} AI
        </p>
      </motion.section>

      {/* Practice Stats */}
      {user && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader title="Your Practice Stats" />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {user.stats.gamesPlayed}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total Games
                  </div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-primary-600">
                    {user.stats.level}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Level
                  </div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {user.stats.xp}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    XP
                  </div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {user.stats.achievements.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Achievements
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}
    </div>
  )
}

export default PracticePage