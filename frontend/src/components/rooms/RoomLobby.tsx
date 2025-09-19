import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Clock,
  Copy,
  Check,
  Play,
  MessageCircle,
  Crown,
  UserCircle,
  Share,
  LogOut
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface RoomLobbyProps {
  onStartGame?: () => void
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ onStartGame }) => {
  const [codeCopied, setCodeCopied] = useState(false)
  const [chatMessage, setChatMessage] = useState('')

  const { currentRoom, leaveRoom, startGame } = useRoomStore()
  const { user } = useAuthStore()

  if (!currentRoom || !user) {
    return null
  }

  const isRoomCreator = currentRoom.players[0]?.id === user.id
  const canStartGame = currentRoom.players.length === 2 && currentRoom.status === 'ready'
  const opponent = currentRoom.players.find(p => p.id !== user.id)

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom.roomCode)
      setCodeCopied(true)
      toast.success('Room code copied!')
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy room code')
    }
  }

  const shareRoom = async () => {
    const shareData = {
      title: 'Join my Chess game!',
      text: `Join my chess game with room code: ${currentRoom.roomCode}`,
      url: `${window.location.origin}/room/${currentRoom.roomCode}`,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Room link copied!')
      }
    } catch (error) {
      toast.error('Failed to share room')
    }
  }

  const handleStartGame = () => {
    startGame()
    onStartGame?.()
  }

  const handleLeaveRoom = () => {
    leaveRoom()
    toast.info('Left the room')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Room Header */}
      <Card variant="elevated">
        <CardHeader
          title="Room Lobby"
          subtitle={`Room Code: ${currentRoom.roomCode}`}
          action={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyRoomCode}
                leftIcon={codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={shareRoom}
                leftIcon={<Share className="w-4 h-4" />}
              >
                Share
              </Button>
            </div>
          }
        />

        <CardContent>
          {/* Room Code Display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-700">
              <div className="room-code text-3xl">
                {currentRoom.roomCode}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Time Control
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {Math.floor(currentRoom.timeControl.time / 60)}+{currentRoom.timeControl.increment}
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Players
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {currentRoom.players.length}/2
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Play className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Status
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                {currentRoom.status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players */}
        <Card>
          <CardHeader title="Players" />
          <CardContent>
            <div className="space-y-3">
              {currentRoom.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    player.id === user.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'bg-slate-50 dark:bg-slate-700'
                  )}
                >
                  <div className="relative">
                    <UserCircle className="w-10 h-10 text-slate-400" />
                    {index === 0 && (
                      <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {player.name}
                      {player.id === user.id && (
                        <span className="text-xs text-primary-600 ml-2">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Rating: {player.rating}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-yellow-600">Host</span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    player.connected ? 'bg-green-500' : 'bg-red-500'
                  )} />
                </motion.div>
              ))}

              {/* Empty slot */}
              {currentRoom.players.length === 1 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <UserCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-500 dark:text-slate-400">
                      Waiting for opponent...
                    </div>
                    <div className="text-sm text-slate-400 dark:text-slate-500">
                      Share the room code to invite a friend
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Chat */}
        <Card>
          <CardHeader title="Quick Chat" />
          <CardContent>
            <div className="space-y-3">
              {/* Chat messages would go here */}
              <div className="h-32 bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
                {opponent ? 'Say hello to your opponent!' : 'Chat will be available when opponent joins'}
              </div>

              {/* Chat input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={opponent ? 'Type a message...' : 'Waiting for opponent'}
                  disabled={!opponent}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!chatMessage.trim() || !opponent}
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={handleLeaveRoom}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Leave Room
        </Button>

        <div className="flex gap-3">
          {canStartGame && isRoomCreator && (
            <Button
              variant="success"
              size="lg"
              onClick={handleStartGame}
              leftIcon={<Play className="w-5 h-5" />}
            >
              Start Game
            </Button>
          )}

          {canStartGame && !isRoomCreator && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              Waiting for host to start the game...
            </div>
          )}

          {!canStartGame && currentRoom.players.length === 1 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              Waiting for opponent to join...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomLobby