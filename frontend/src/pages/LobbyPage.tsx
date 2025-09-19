import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Users,
  Plus,
  LogIn,
  Clock,
  Zap,
  Bot,
  Search,
  X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import CreateRoomModal from '@/components/rooms/CreateRoomModal'
import JoinRoomModal from '@/components/rooms/JoinRoomModal'
import { useRoomStore } from '@/stores/roomStore'
import { GAME_MODES } from '@/utils/constants'
import { cn } from '@/utils/cn'

const LobbyPage: React.FC = () => {
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [selectedTimeControl, setSelectedTimeControl] = useState('RAPID')

  const navigate = useNavigate()
  const { findMatch, cancelSearch, isSearchingMatch } = useRoomStore()

  const handleQuickMatch = async () => {
    const mode = GAME_MODES[selectedTimeControl as keyof typeof GAME_MODES]
    const timeControl = { time: mode.time, increment: mode.increment }

    try {
      await findMatch(timeControl)
      // Navigation will be handled by the socket event listener
    } catch (error) {
      console.error('Failed to find match:', error)
    }
  }

  const handleCancelSearch = () => {
    cancelSearch()
  }

  const quickPlayOptions = [
    {
      key: 'BULLET',
      icon: Zap,
      title: 'Bullet',
      subtitle: '1+1 minutes',
      description: 'Fast-paced games for quick thinking',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      key: 'BLITZ',
      icon: Clock,
      title: 'Blitz',
      subtitle: '5+3 minutes',
      description: 'Popular time control for exciting games',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      key: 'RAPID',
      icon: Play,
      title: 'Rapid',
      subtitle: '10+5 minutes',
      description: 'Balanced games with time to think',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      key: 'CLASSICAL',
      icon: Clock,
      title: 'Classical',
      subtitle: '30+30 minutes',
      description: 'Long games for deep calculation',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
          Game Lobby
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Choose how you want to play: create a private room, join with a code, or find a quick match
        </p>
      </motion.div>

      {/* Room Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="elevated">
          <CardHeader title="Private Rooms" subtitle="Play with friends using room codes" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowCreateRoom(true)}
                leftIcon={<Plus className="w-5 h-5" />}
                fullWidth
              >
                Create Room
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowJoinRoom(true)}
                leftIcon={<LogIn className="w-5 h-5" />}
                fullWidth
              >
                Join Room
              </Button>
            </div>

            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Create a room to get a 4-digit code to share with friends
                </div>
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Join an existing room using a friend's room code
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Quick Match */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="elevated">
          <CardHeader
            title="Quick Match"
            subtitle="Find an opponent automatically"
          />
          <CardContent>
            {isSearchingMatch ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
                <div>
                  <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Searching for opponent...
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Time Control: {GAME_MODES[selectedTimeControl as keyof typeof GAME_MODES].label}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleCancelSearch}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel Search
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Time Control Selection */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Select Time Control
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickPlayOptions.map((option) => (
                      <motion.div
                        key={option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => setSelectedTimeControl(option.key)}
                          className={cn(
                            'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                            selectedTimeControl === option.key
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', option.bgColor)}>
                            <option.icon className={cn('w-4 h-4', option.color)} />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {option.title}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {option.subtitle}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              {option.description}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Search Button */}
                <div className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleQuickMatch}
                    leftIcon={<Search className="w-5 h-5" />}
                    className="min-w-48"
                  >
                    Find Match
                  </Button>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    You'll be matched with a player of similar skill level
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Practice Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="outlined">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Practice vs AI
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Improve your skills against computer opponents
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate('/practice')}
                leftIcon={<Bot className="w-4 h-4" />}
              >
                Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Recent Games (Future Enhancement) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader title="Recent Games" subtitle="Your game history" />
          <CardContent>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm">No recent games found</div>
              <div className="text-xs mt-1">Start playing to see your game history here</div>
            </div>
          </CardContent>
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
    </div>
  )
}

export default LobbyPage