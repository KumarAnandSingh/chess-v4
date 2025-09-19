import React from 'react'
import { motion } from 'framer-motion'
import { Clock, User, Crown, Flag, Handshake, Lightbulb } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

interface GameInfoProps {
  className?: string
}

const GameInfo: React.FC<GameInfoProps> = ({ className }) => {
  const {
    gameState,
    myColor,
    isMyTurn,
    drawOffered,
    drawOfferedBy,
    resign,
    offerDraw,
    respondToDraw,
    getHint,
    hints,
  } = useGameStore()

  const { user } = useAuthStore()

  if (!gameState || !myColor || !user) {
    return null
  }

  const myPlayer = gameState.players[myColor]
  const opponentColor = myColor === 'white' ? 'black' : 'white'
  const opponentPlayer = gameState.players[opponentColor]

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleHint = () => {
    const hint = getHint()
    if (hint) {
      // Show hint in a toast or modal
      console.log('Hint:', hint)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Players Info */}
      <div className="space-y-3">
        {/* Opponent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg transition-all duration-200',
            !isMyTurn && gameState.status === 'active'
              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
              : 'bg-slate-50 dark:bg-slate-700'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              {gameState.turn === opponentColor && gameState.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {opponentPlayer.name}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Rating: {opponentPlayer.rating}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatTime(gameState.clock[opponentColor])}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {opponentColor}
            </div>
          </div>
        </motion.div>

        {/* Current Player */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg transition-all duration-200',
            isMyTurn && gameState.status === 'active'
              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
              : 'bg-slate-50 dark:bg-slate-700'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {isMyTurn && gameState.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {myPlayer.name} (You)
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Rating: {myPlayer.rating}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatTime(gameState.clock[myColor])}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {myColor}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Status */}
      <Card padding="sm">
        <div className="text-center">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
            {gameState.status === 'active' ? (
              isMyTurn ? "Your turn" : "Opponent's turn"
            ) : (
              'Game Over'
            )}
          </div>
          {gameState.status === 'finished' && (
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {gameState.result === 'draw'
                ? `Draw${gameState.reason ? ` by ${gameState.reason}` : ''}`
                : `${gameState.result === myColor ? 'You' : 'Opponent'} won${gameState.reason ? ` by ${gameState.reason}` : ''}`
              }
            </div>
          )}
        </div>
      </Card>

      {/* Draw Offer */}
      {drawOffered && drawOfferedBy && drawOfferedBy !== user.id && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
        >
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Draw Offer Received
          </div>
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => respondToDraw(true)}
              className="flex-1"
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => respondToDraw(false)}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </motion.div>
      )}

      {/* Game Actions */}
      {gameState.status === 'active' && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            fullWidth
            onClick={offerDraw}
            disabled={drawOffered}
            leftIcon={<Handshake className="w-4 h-4" />}
          >
            {drawOffered ? 'Draw Offered' : 'Offer Draw'}
          </Button>

          <Button
            variant="danger"
            fullWidth
            onClick={resign}
            leftIcon={<Flag className="w-4 h-4" />}
          >
            Resign
          </Button>

          {hints.enabled && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleHint}
              disabled={!isMyTurn}
              leftIcon={<Lightbulb className="w-4 h-4" />}
            >
              Get Hint ({hints.used})
            </Button>
          )}
        </div>
      )}

      {/* Time Control Info */}
      <Card padding="sm">
        <div className="text-center">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
            Time Control
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {Math.floor(gameState.timeControl.time / 60)}+{gameState.timeControl.increment}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default GameInfo