import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Users,
  Bot,
  Zap,
  Crown,
  Star,
  TrendingUp,
  ArrowRight,
  Chess,
  Clock,
  Trophy,
  Target
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import CreateRoomModal from '@/components/rooms/CreateRoomModal'
import JoinRoomModal from '@/components/rooms/JoinRoomModal'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

const LandingPage: React.FC = () => {
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const features = [
    {
      icon: Users,
      title: 'Room-Based Play',
      description: 'Create private rooms with 4-digit codes and invite friends to play',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Zap,
      title: 'Real-Time Multiplayer',
      description: 'Smooth, lag-free gameplay with instant move synchronization',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Bot,
      title: 'AI Practice',
      description: 'Train against intelligent bots with adjustable difficulty levels',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: Trophy,
      title: 'Progress Tracking',
      description: 'Track your improvement with stats, ratings, and achievements',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      icon: Clock,
      title: 'Multiple Time Controls',
      description: 'Play blitz, rapid, or classical games with custom time settings',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      icon: Target,
      title: 'Educational Features',
      description: 'Hints, move analysis, and interactive learning tools',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ]

  const gameStats = [
    { label: 'Games Played', value: user?.stats.gamesPlayed || 0 },
    { label: 'Rating', value: user?.stats.rating || 1200 },
    { label: 'Win Rate', value: user?.stats.gamesPlayed ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100) : 0, suffix: '%' },
    { label: 'Level', value: user?.stats.level || 1 },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto space-y-12"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="text-center space-y-6">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl mb-6 shadow-lg"
          >
            <Chess className="w-10 h-10 text-white" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient">
            Chess v4
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Play chess online with friends using room codes, practice against AI, and improve your game with educational features.
          </p>
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowCreateRoom(true)}
            leftIcon={<Play className="w-5 h-5" />}
            className="flex-1"
          >
            Create Room
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowJoinRoom(true)}
            leftIcon={<Users className="w-5 h-5" />}
            className="flex-1"
          >
            Join Room
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/lobby')}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Quick Match
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/practice')}
            leftIcon={<Bot className="w-4 h-4" />}
          >
            Practice vs AI
          </Button>
        </motion.div>
      </motion.section>

      {/* User Stats */}
      {user && (
        <motion.section variants={itemVariants}>
          <Card variant="elevated" padding="lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome back, {user.name}!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Here's your progress overview
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gameStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {user.stats.achievements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-3">Recent Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {user.stats.achievements.slice(-3).map((achievement) => (
                    <div
                      key={achievement}
                      className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
                    >
                      <Crown className="w-4 h-4" />
                      {achievement.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.section>
      )}

      {/* Features Grid */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Why Choose Chess v4?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Experience chess like never before with our modern, feature-rich platform designed for players of all levels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card hover clickable className="h-full">
                <CardContent>
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', feature.bgColor)}>
                    <feature.icon className={cn('w-6 h-6', feature.color)} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section variants={itemVariants}>
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Ready to Play?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Join thousands of players already enjoying Chess v4. Create your first room or jump into a quick match!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/lobby')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="flex-1"
              >
                Get Started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowCreateRoom(true)}
                leftIcon={<Users className="w-5 h-5" />}
                className="flex-1"
              >
                Create Room
              </Button>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />

      <JoinRoomModal
        isOpen={showJoinRoom}
        onClose={() => setShowJoinRoom(false)}
      />
    </motion.div>
  )
}

export default LandingPage