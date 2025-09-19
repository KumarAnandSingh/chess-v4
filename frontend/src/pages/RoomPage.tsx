import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import RoomLobby from '@/components/rooms/RoomLobby'
import { useRoomStore } from '@/stores/roomStore'
import { socketService } from '@/services/socketService'

const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const {
    currentRoom,
    isInRoom,
    isJoiningRoom,
    joinRoom,
    roomError,
    setRoom
  } = useRoomStore()

  useEffect(() => {
    if (!code) {
      navigate('/')
      return
    }

    // If we're not in a room or in a different room, try to join
    if (!isInRoom || currentRoom?.roomCode !== code.toUpperCase()) {
      joinRoom(code.toUpperCase())
    }
  }, [code, isInRoom, currentRoom?.roomCode, joinRoom, navigate])

  // Listen for game start
  useEffect(() => {
    const handleGameStarted = (gameState: any) => {
      navigate(`/game/${gameState.gameId}`)
    }

    socketService.onGameStarted(handleGameStarted)

    return () => {
      socketService.removeListener('game_started')
    }
  }, [navigate])

  const handleStartGame = () => {
    // This will be handled by the socket event listener
    console.log('Game starting...')
  }

  const handleBack = () => {
    navigate('/')
  }

  // Loading state
  if (isJoiningRoom) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-6"
          >
            Back to Home
          </Button>

          <Card variant="elevated" padding="lg">
            <CardContent>
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Joining Room {code?.toUpperCase()}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Please wait while we connect you to the room...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (roomError && !isInRoom) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-6"
          >
            Back to Home
          </Button>

          <Card variant="elevated" padding="lg">
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Unable to Join Room
                  </h2>
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    {roomError}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    The room code "{code?.toUpperCase()}" might be invalid, expired, or full.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={handleBack}>
                    Go Home
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => joinRoom(code!.toUpperCase())}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Room not found or not in room
  if (!isInRoom || !currentRoom) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-6"
          >
            Back to Home
          </Button>

          <Card variant="elevated" padding="lg">
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Room Not Found
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    We couldn't find a room with the code "{code?.toUpperCase()}".
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={handleBack}>
                    Go Home
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => joinRoom(code!.toUpperCase())}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Successfully in room
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Home
        </Button>

        {/* Room Lobby */}
        <RoomLobby onStartGame={handleStartGame} />
      </motion.div>
    </div>
  )
}

export default RoomPage