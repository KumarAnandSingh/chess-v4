import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
import Button from '@/components/ui/Button'
import ChessBoard from '@/components/chess/ChessBoard'
import GameInfo from '@/components/chess/GameInfo'
import MoveList from '@/components/chess/MoveList'
import GameChat from '@/components/chess/GameChat'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { socketService } from '@/services/socketService'
import { cn } from '@/utils/cn'

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const {
    gameState,
    myColor,
    initializeGame,
    updateGameState,
    reset: resetGame
  } = useGameStore()

  const {
    isFullscreen,
    setFullscreen,
    showMoveList,
    showCapturedPieces,
    chatOpen,
    toggleChat,
    isMobile
  } = useUIStore()

  const { user, addXP, updateUserStats } = useAuthStore()

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize game when component mounts
  useEffect(() => {
    console.log('\n🎮 GAME PAGE: Component mounted')
    console.log('Game ID from URL:', gameId)
    console.log('Current game state:', gameState?.gameId)
    console.log('Player color:', myColor)
    console.log('Game state exists:', !!gameState)
    console.log('Game state status:', gameState?.status)

    if (!gameId) {
      console.log('❌ No gameId in URL, redirecting to home')
      navigate('/')
      return
    }

    // If we don't have game state but have a gameId,
    // it might mean we navigated directly to this URL or the store was reset
    if (!gameState && gameId) {
      console.log('⚠️ No game state found but have gameId - setting up fallback game_started listener')

      // Set up a fallback game_started listener in case the event is fired again
      const handleGameStartedFallback = (data: any) => {
        console.log('\n🔄 GAME PAGE: Received fallback game_started event')
        console.log('Checking if this is our game...')
        console.log('Event gameId:', data?.gameId)
        console.log('Expected gameId:', gameId)

        if (data?.gameId === gameId) {
          console.log('✅ This is our game! Initializing...')
          const { gameState: newGameState } = data

          // Determine player color using socket ID
          const currentSocket = socketService.getSocket()
          const currentSocketId = currentSocket?.id
          let myColor: 'white' | 'black' | null = null

          if (currentSocketId && newGameState.players) {
            const myPlayer = newGameState.players.find((p: any) => p.id === currentSocketId)
            if (myPlayer) {
              myColor = myPlayer.color
            }
          }

          if (myColor && newGameState) {
            initializeGame(newGameState, myColor)
            console.log('✅ Game initialized from fallback event')
          }
        }
      }

      socketService.onGameStarted(handleGameStartedFallback)

      // Clean up the fallback listener after a timeout
      setTimeout(() => {
        console.log('🧹 Cleaning up fallback game_started listener')
        socketService.removeListener('game_started')
      }, 5000)
    }

    // Listen for game events
    const handleGameUpdate = (newGameState: any) => {
      updateGameState(newGameState)
    }

    const handleGameEnd = (result: any) => {
      updateGameState(result)

      // Handle game end rewards and stats
      if (user && result.status === 'finished') {
        const isWin = result.result === myColor
        const isDraw = result.result === 'draw'

        // Update stats
        const newStats = {
          gamesPlayed: user.stats.gamesPlayed + 1,
          wins: isWin ? user.stats.wins + 1 : user.stats.wins,
          losses: !isDraw && !isWin ? user.stats.losses + 1 : user.stats.losses,
          draws: isDraw ? user.stats.draws + 1 : user.stats.draws,
        }

        updateUserStats(newStats)

        // Add XP based on result
        const xpGained = isWin ? 50 : isDraw ? 25 : 10
        addXP(xpGained)

        // Show confetti for wins
        if (isWin) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
      }
    }

    socketService.onMoveMade(handleGameUpdate)
    socketService.onGameEnded(handleGameEnd)

    return () => {
      socketService.removeListener('move_made')
      socketService.removeListener('game_ended')
    }
  }, [gameId, navigate, updateGameState, user, myColor, addXP, updateUserStats])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleBack = () => {
    if (gameState?.status === 'active') {
      const confirmed = window.confirm(
        'Are you sure you want to leave? This will forfeit the game.'
      )
      if (!confirmed) return
    }

    resetGame()
    navigate('/')
  }

  if (!gameState || !myColor) {
    console.log('\n⏳ GAME PAGE: Still loading...')
    console.log('Game state exists:', !!gameState)
    console.log('Player color exists:', !!myColor)

    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
          <div className="text-center py-12">
            <div className="text-lg text-slate-600 dark:text-slate-400">
              Loading game...
            </div>
            {gameId && (
              <div className="text-sm text-slate-500 mt-2">
                Game ID: {gameId}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  console.log('\n✅ GAME PAGE: Rendering game successfully')
  console.log('Game state ID:', gameState.gameId)
  console.log('Player color:', myColor)
  console.log('Game status:', gameState.status)

  return (
    <>
      {/* Confetti for wins */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className={cn(
        'transition-all duration-300',
        isFullscreen ? 'fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4' : 'max-w-7xl mx-auto'
      )}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full space-y-4"
        >
          {/* Game Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {gameState.status === 'finished' ? 'Back to Home' : 'Leave Game'}
            </Button>

            <div className="flex items-center gap-2">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="sm:hidden"
                >
                  Chat
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                leftIcon={isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            </div>
          </div>

          {/* Game Layout */}
          <div className={cn(
            'grid gap-6 h-full',
            isMobile
              ? 'grid-cols-1'
              : 'grid-cols-1 lg:grid-cols-4 xl:grid-cols-5'
          )}>
            {/* Left Sidebar - Game Info (Desktop) */}
            {!isMobile && (
              <div className="lg:col-span-1 space-y-4">
                <GameInfo />
              </div>
            )}

            {/* Main Game Area */}
            <div className={cn(
              'flex flex-col items-center justify-center space-y-4',
              isMobile ? 'col-span-1' : 'lg:col-span-2 xl:col-span-3'
            )}>
              {/* Mobile Game Info */}
              {isMobile && (
                <div className="w-full max-w-md">
                  <GameInfo />
                </div>
              )}

              {/* Chess Board */}
              <ChessBoard className="flex-shrink-0" />

              {/* Mobile Move List */}
              {isMobile && showMoveList && (
                <div className="w-full max-w-md">
                  <MoveList />
                </div>
              )}
            </div>

            {/* Right Sidebar (Desktop) */}
            {!isMobile && (
              <div className="lg:col-span-1 space-y-4">
                {showMoveList && <MoveList />}
                {!chatOpen && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleChat}
                    fullWidth
                  >
                    Open Chat
                  </Button>
                )}
                {chatOpen && <GameChat />}
              </div>
            )}
          </div>

          {/* Mobile Chat Overlay */}
          {isMobile && chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed inset-x-0 bottom-0 h-2/3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-40 p-4"
            >
              <div className="h-full">
                <GameChat />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  )
}

export default GamePage