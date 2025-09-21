import React, { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import RoomLobby from '@/components/rooms/RoomLobby'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
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

  const { initializeGame } = useGameStore()
  const { user } = useAuthStore()

  // Get the store getter function for debugging
  const getGameStore = useGameStore.getState

  // Use refs to store current state for the event handler
  const currentStateRef = useRef({ user, navigate, initializeGame })
  currentStateRef.current = { user, navigate, initializeGame }

  // Function to transform backend data to frontend format
  const transformGameData = (backendData: any) => {
    console.log('🔄 Transforming backend game data to frontend format')
    console.log('Backend data received:', JSON.stringify(backendData, null, 2))

    const { gameId, gameState, room } = backendData

    // Transform players array to players object with color keys
    const players = gameState.players || []
    const playersObject = players.reduce((acc: any, player: any) => {
      acc[player.color] = {
        id: player.id,
        name: player.name,
        rating: player.rating || 1200,
        connected: true
      }
      return acc
    }, {})

    // Transform the nested gameState to flattened format expected by frontend
    const transformedGameState = {
      gameId: gameId,
      position: gameState.fen || gameState.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: gameState.turn || 'white',
      moves: gameState.moves || [],
      status: gameState.status || 'active',
      result: gameState.result,
      reason: gameState.reason,
      lastMove: gameState.lastMove,
      check: gameState.check,
      players: playersObject,
      timeControl: gameState.timeControl || { time: 300, increment: 5 },
      clock: gameState.clock || { white: 300000, black: 300000 }
    }

    console.log('✅ Transformed game state:', JSON.stringify(transformedGameState, null, 2))
    return transformedGameState
  }

  // Listen for game start - set up ONCE when component mounts
  useEffect(() => {
    const handleGameStarted = (data: any) => {
      console.log('\n🎯 GAME STARTED EVENT RECEIVED in RoomPage')
      console.log('Current room code:', code)
      console.log('Event gameId:', data?.gameId)
      console.log('Event data keys:', Object.keys(data || {}))
      console.log('Raw backend data:', JSON.stringify(data, null, 2))

      const { user, navigate, initializeGame } = currentStateRef.current

      // Validate required data
      if (!data?.gameId || !data?.gameState || !user) {
        console.error('❌ Missing required data in game_started event')
        console.error('- GameId:', !!data?.gameId)
        console.error('- GameState:', !!data?.gameState)
        console.error('- User:', !!user?.name)
        return
      }

      try {
        // Transform backend data to frontend format
        const transformedGameState = transformGameData(data)
        const gameId = data.gameId

        console.log('✅ Valid game_started event with gameId:', gameId)

        // Determine player color using socket ID (most reliable method)
        const currentSocket = socketService.getSocket()
        const currentSocketId = currentSocket?.id
        let myColor: 'white' | 'black' | null = null

        console.log('🔍 Current socket ID:', currentSocketId)
        console.log('🔍 Players in transformed gameState:', transformedGameState.players)

        // Check if we have the proper players object
        if (currentSocketId && transformedGameState.players) {
          // Check both white and black players for socket ID match
          if (transformedGameState.players.white?.id === currentSocketId) {
            myColor = 'white'
            console.log('✅ Found player as white by socket ID:', transformedGameState.players.white)
          } else if (transformedGameState.players.black?.id === currentSocketId) {
            myColor = 'black'
            console.log('✅ Found player as black by socket ID:', transformedGameState.players.black)
          } else {
            // Fallback to username matching
            if (transformedGameState.players.white?.name === user.name) {
              myColor = 'white'
              console.log('✅ Found player as white by username fallback:', transformedGameState.players.white)
            } else if (transformedGameState.players.black?.name === user.name) {
              myColor = 'black'
              console.log('✅ Found player as black by username fallback:', transformedGameState.players.black)
            } else {
              console.error('❌ Could not find player by socket ID or username')
              console.error('Current socket ID:', currentSocketId)
              console.error('Current username:', user.name)
              console.error('Available players:', transformedGameState.players)
              return
            }
          }
        }

        if (!myColor) {
          console.error('❌ Failed to determine player color')
          return
        }

        console.log('🎨 Player color determined:', myColor)
        console.log('🎮 Initializing game and navigating...')

        // Initialize game store with transformed data
        console.log('🔄 About to initialize game store with transformed data...')
        initializeGame(transformedGameState, myColor)
        console.log('✅ Game store initialized successfully')

        // Small delay to ensure store is updated
        setTimeout(() => {
          console.log('🧭 About to navigate to /game/' + gameId)
          console.log('Current URL before navigation:', window.location.href)

          // Double-check that game store was initialized correctly
          const storeState = getGameStore()
          console.log('Game store before navigation:', {
            hasGameState: !!storeState.gameState,
            hasMyColor: !!storeState.myColor,
            gameStateId: storeState.gameState?.gameId,
            myColor: storeState.myColor
          })

          try {
            navigate(`/game/${gameId}`, { replace: true })
            console.log('✅ Navigation to /game/' + gameId + ' completed')
            console.log('New URL after navigation:', window.location.href)

            // Verify the game store state is still available after navigation
            setTimeout(() => {
              const postNavState = getGameStore()
              console.log('Game store after navigation:', {
                hasGameState: !!postNavState.gameState,
                hasMyColor: !!postNavState.myColor,
                gameStateId: postNavState.gameState?.gameId,
                myColor: postNavState.myColor
              })
            }, 100)

          } catch (navError) {
            console.error('❌ Navigation error:', navError)

            // Try alternative navigation method
            console.log('🔄 Trying alternative navigation...')
            window.location.href = `/game/${gameId}`
          }
        }, 100)

      } catch (error) {
        console.error('❌ Error in game initialization:', error)
        console.error('Error details:', error.message, error.stack)

        // Try fallback navigation even if game init fails
        setTimeout(() => {
          try {
            console.log('🔄 Attempting fallback navigation...')
            navigate(`/game/${data.gameId}`, { replace: true })
            console.log('✅ Fallback navigation successful')
          } catch (retryError) {
            console.error('❌ Fallback navigation failed:', retryError)
            console.log('🌐 Using window.location as last resort...')
            window.location.href = `/game/${data.gameId}`
          }
        }, 100)
      }
    }

    console.log('\n🎮 SETTING UP game_started LISTENER in RoomPage')

    // Set up the listener without complex connection checks
    if (socketService.getSocket()) {
      socketService.onGameStarted(handleGameStarted)
      console.log('✅ Game started listener set up')
    } else {
      console.error('❌ No socket available for game_started listener')
    }

    // Cleanup only on unmount
    return () => {
      console.log('🧹 Cleaning up game_started listener')
      socketService.removeListener('game_started')
    }
  }, []) // No dependencies to prevent re-setup

  // Join room AFTER event listener is set up
  useEffect(() => {
    if (!code) {
      navigate('/')
      return
    }

    // Ensure socket connection before attempting to join
    const attemptJoin = async () => {
      const isConnected = await socketService.ensureConnection(3, 1000)
      if (!isConnected) {
        console.error('❌ Cannot join room - failed to establish socket connection')
        socketService.getConnectionHealth()
        return
      }

      // Check if we need to join the room
      if (!isInRoom || currentRoom?.code !== code.toUpperCase()) {
        console.log('🔄 Attempting to join room with verified connection')
        try {
          await joinRoom(code.toUpperCase())
        } catch (error) {
          console.error('❌ Room join failed:', error)
        }
      } else {
        console.log('✅ Already in correct room:', currentRoom?.code)
      }
    }

    attemptJoin()
  }, [code, isInRoom, currentRoom?.code, joinRoom, navigate])

  const handleStartGame = () => {
    // This will be handled by the socket event listener
    console.log('🎮 Game starting button clicked - waiting for backend to start game automatically')
    // The backend automatically starts games when 2 players join
    // No manual action needed from frontend
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