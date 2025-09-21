import { create } from 'zustand'
import { Chess } from 'chess.js'
import { socketService, type GameState, type GameMove } from '@/services/socketService'
import { audioService } from '@/services/audioService'
import toast from 'react-hot-toast'

interface MoveHistory {
  move: string
  position: string
  timestamp: number
  timeLeft?: {
    white: number
    black: number
  }
}

interface GameStoreState {
  game: Chess
  gameState: GameState | null
  isMyTurn: boolean
  myColor: 'white' | 'black' | null
  moveHistory: MoveHistory[]
  selectedSquare: string | null
  possibleMoves: string[]
  lastMove: { from: string; to: string } | null
  isGameActive: boolean
  isPaused: boolean
  drawOffered: boolean
  drawOfferedBy: string | null
  isThinking: boolean
  hints: {
    enabled: boolean
    available: string[]
    used: number
  }
}

interface GameStoreActions {
  initializeGame: (gameState: GameState, myColor: 'white' | 'black') => void
  makeMove: (from: string, to: string, promotion?: string) => boolean
  selectSquare: (square: string) => void
  clearSelection: () => void
  updateGameState: (gameState: GameState) => void
  resign: () => void
  offerDraw: () => void
  respondToDraw: (accept: boolean) => void
  setDrawOffer: (offered: boolean, playerId?: string) => void
  toggleHints: () => void
  getHint: () => string | null
  reset: () => void
}

const initialState: GameStoreState = {
  game: new Chess(),
  gameState: null,
  isMyTurn: false,
  myColor: null,
  moveHistory: [],
  selectedSquare: null,
  possibleMoves: [],
  lastMove: null,
  isGameActive: false,
  isPaused: false,
  drawOffered: false,
  drawOfferedBy: null,
  isThinking: false,
  hints: {
    enabled: true,
    available: [],
    used: 0,
  },
}

// Helper function to save game state to localStorage
const saveGameStateToStorage = (state: Partial<GameStoreState>) => {
  try {
    const gameStateToSave = {
      gameState: state.gameState,
      myColor: state.myColor,
      isGameActive: state.isGameActive,
      savedAt: Date.now()
    }
    localStorage.setItem('chess-game-state', JSON.stringify(gameStateToSave))
    console.log('💾 Game state saved to localStorage')
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error)
  }
}

// Helper function to load game state from localStorage
const loadGameStateFromStorage = (): Partial<GameStoreState> | null => {
  try {
    const saved = localStorage.getItem('chess-game-state')
    if (!saved) return null

    const parsed = JSON.parse(saved)

    // Check if the saved state is recent (within 1 hour)
    const isRecent = Date.now() - parsed.savedAt < 60 * 60 * 1000
    if (!isRecent) {
      localStorage.removeItem('chess-game-state')
      return null
    }

    console.log('📁 Game state loaded from localStorage')
    return parsed
  } catch (error) {
    console.warn('Failed to load game state from localStorage:', error)
    localStorage.removeItem('chess-game-state')
    return null
  }
}

// Load initial state from localStorage if available
const savedState = loadGameStateFromStorage()
const enhancedInitialState = savedState ? {
  ...initialState,
  gameState: savedState.gameState || null,
  myColor: savedState.myColor || null,
  isGameActive: savedState.isGameActive || false,
  game: savedState.gameState?.fen ? new Chess(savedState.gameState.fen) : new Chess()
} : initialState

export const useGameStore = create<GameStoreState & GameStoreActions>((set, get) => ({
  ...enhancedInitialState,

  initializeGame: (gameState, myColor) => {
    console.log('\n🏪 GAME STORE: Initializing game')
    console.log('Received gameState:', JSON.stringify(gameState, null, 2))
    console.log('Player color:', myColor)

    // The backend sends FEN position under 'fen' property, not 'position'
    const fenPosition = gameState.fen || gameState.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    console.log('Using FEN position:', fenPosition)

    try {
      const game = new Chess(fenPosition)
      console.log('Chess game initialized, current turn:', game.turn())

      const newState = {
        game,
        gameState,
        myColor,
        isMyTurn: game.turn() === myColor[0],
        isGameActive: gameState.status === 'active' || gameState.status === 'playing',
        moveHistory: [],
        selectedSquare: null,
        possibleMoves: [],
        lastMove: gameState.lastMove || null,
        drawOffered: false,
        drawOfferedBy: null,
      }

      console.log('Setting game store state:', {
        myColor: newState.myColor,
        isMyTurn: newState.isMyTurn,
        isGameActive: newState.isGameActive,
        gameStatus: gameState.status,
        fenPosition: fenPosition
      })

      set(newState)

      // Save to localStorage for persistence
      saveGameStateToStorage(newState)

      console.log('✅ Game store initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing chess game:', error)
      console.error('Invalid FEN position:', fenPosition)
      throw error
    }
  },

  makeMove: (from, to, promotion) => {
    const { game, gameState, myColor, isMyTurn } = get()

    if (!isMyTurn || !gameState) {
      toast.error("It's not your turn!")
      return false
    }

    try {
      // Validate and make move locally first
      const move = game.move({
        from,
        to,
        promotion: promotion || 'q',
      })

      if (!move) {
        toast.error('Invalid move!')
        return false
      }

      // Check for special move conditions
      const isCapture = move.captured !== undefined
      const isCheck = game.inCheck()
      const isCheckmate = game.isCheckmate()

      // Play appropriate sound
      audioService.playMoveSound(isCapture, isCheck, isCheckmate)

      // Create move history entry
      const moveHistoryEntry: MoveHistory = {
        move: move.san,
        position: game.fen(),
        timestamp: Date.now(),
      }

      // Update local state
      set({
        game: new Chess(game.fen()),
        moveHistory: [...get().moveHistory, moveHistoryEntry],
        selectedSquare: null,
        possibleMoves: [],
        lastMove: { from, to },
        isMyTurn: false,
        isThinking: true,
      })

      // Send move to server
      const gameMove: GameMove = {
        from,
        to,
        promotion,
        san: move.san,
        timeLeft: gameState.clock[myColor!],
      }

      socketService.makeMove(gameState.gameId, gameMove)

      return true
    } catch (error) {
      toast.error('Invalid move!')
      return false
    }
  },

  selectSquare: (square) => {
    const { game, selectedSquare, myColor, isMyTurn } = get()

    if (!isMyTurn) return

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      set({
        selectedSquare: null,
        possibleMoves: [],
      })
      return
    }

    // If we have a selected square, try to make a move
    if (selectedSquare) {
      const moved = get().makeMove(selectedSquare, square)
      if (moved) return

      // If move failed, select the new square instead
    }

    // Check if the square has our piece
    const piece = game.get(square)
    if (piece && piece.color === myColor?.[0]) {
      const moves = game.moves({ square, verbose: true })
      const possibleMoves = moves.map(move => move.to)

      set({
        selectedSquare: square,
        possibleMoves,
      })
    } else {
      set({
        selectedSquare: null,
        possibleMoves: [],
      })
    }
  },

  clearSelection: () => {
    set({
      selectedSquare: null,
      possibleMoves: [],
    })
  },

  updateGameState: (gameStateOrData) => {
    const { myColor } = get()

    // Check if we received nested data (from move_made events)
    let gameState = gameStateOrData
    if (gameStateOrData && gameStateOrData.gameState && !gameStateOrData.position) {
      console.log('📥 Received nested game data, transforming...')
      // Transform nested structure to flat structure
      const nestedState = gameStateOrData.gameState
      const players = nestedState.players || []
      const playersObject = players.reduce((acc: any, player: any) => {
        acc[player.color] = {
          id: player.id,
          name: player.name,
          rating: player.rating || 1200,
          connected: true
        }
        return acc
      }, {})

      gameState = {
        gameId: gameStateOrData.gameId || nestedState.gameId,
        position: nestedState.fen || nestedState.position || gameState.position,
        turn: nestedState.turn || 'white',
        moves: nestedState.moves || [],
        status: nestedState.status || 'active',
        result: nestedState.result,
        reason: nestedState.reason,
        lastMove: nestedState.lastMove,
        check: nestedState.check,
        players: playersObject,
        timeControl: nestedState.timeControl || { time: 300, increment: 5 },
        clock: nestedState.clock || { white: 300000, black: 300000 }
      }
      console.log('✅ Transformed nested game data:', gameState)
    }

    const game = new Chess(gameState.position)

    set({
      game,
      gameState,
      isMyTurn: game.turn() === myColor?.[0] && gameState.status === 'active',
      isGameActive: gameState.status === 'active',
      lastMove: gameState.lastMove || null,
      isThinking: false,
    })

    // Handle game end
    if (gameState.status === 'finished') {
      const { result, reason } = gameState
      let message = ''
      let soundType: 'victory' | 'defeat' | 'draw' = 'draw'

      if (result === 'draw') {
        message = `Game drawn${reason ? ` by ${reason}` : ''}!`
        soundType = 'draw'
      } else if (result === myColor) {
        message = 'You won!'
        soundType = 'victory'
      } else {
        message = 'You lost!'
        soundType = 'defeat'
      }

      toast.success(message)
      audioService.playGameEndSound(soundType)
    }
  },

  resign: () => {
    const { gameState } = get()
    if (gameState) {
      socketService.resign(gameState.gameId)
      toast.info('You resigned from the game')
    }
  },

  offerDraw: () => {
    const { gameState, drawOffered } = get()
    if (gameState && !drawOffered) {
      socketService.offerDraw(gameState.gameId)
      set({ drawOffered: true })
      toast.info('Draw offer sent')
    }
  },

  respondToDraw: (accept) => {
    const { gameState } = get()
    if (gameState) {
      socketService.respondToDraw(gameState.gameId, accept)
      set({
        drawOffered: false,
        drawOfferedBy: null,
      })
      toast.info(accept ? 'Draw offer accepted' : 'Draw offer declined')
    }
  },

  setDrawOffer: (offered, playerId) => {
    set({
      drawOffered: offered,
      drawOfferedBy: playerId || null,
    })

    if (offered && playerId) {
      toast.info('Your opponent offered a draw', {
        duration: 6000,
      })
    }
  },

  toggleHints: () => {
    const { hints } = get()
    set({
      hints: {
        ...hints,
        enabled: !hints.enabled,
      },
    })
  },

  getHint: () => {
    const { game, hints, myColor, isMyTurn } = get()

    if (!hints.enabled || !isMyTurn || !myColor) return null

    try {
      // Get all legal moves
      const moves = game.moves({ verbose: true })
      if (moves.length === 0) return null

      // Simple hint system - prioritize captures, then checks
      const captures = moves.filter(move => move.captured)
      const checks = moves.filter(move => {
        const tempGame = new Chess(game.fen())
        tempGame.move(move)
        return tempGame.inCheck()
      })

      let suggestedMove
      if (captures.length > 0) {
        suggestedMove = captures[0]
      } else if (checks.length > 0) {
        suggestedMove = checks[0]
      } else {
        // Random move for now - could be improved with engine
        suggestedMove = moves[Math.floor(Math.random() * moves.length)]
      }

      set({
        hints: {
          ...hints,
          used: hints.used + 1,
        },
      })

      return `Try ${suggestedMove.san} (${suggestedMove.from}-${suggestedMove.to})`
    } catch (error) {
      console.error('Error generating hint:', error)
      return null
    }
  },

  reset: () => {
    set(initialState)
    // Clear localStorage
    localStorage.removeItem('chess-game-state')
    console.log('🧹 Game store reset and localStorage cleared')
  },
}))

// Set up socket event listeners for game events
// Note: game_started is handled in RoomPage.tsx to initialize store before navigation
if (typeof window !== 'undefined') {
  const { updateGameState, setDrawOffer } = useGameStore.getState()

  socketService.onMoveMade((moveData) => {
    console.log('\n♟️ GAME STORE: Received move_made event')
    console.log('Move data:', JSON.stringify(moveData, null, 2))
    // Update the game state with the new move
    updateGameState(moveData)
  })

  socketService.onGameEnded((result) => {
    console.log('\n🏁 GAME STORE: Received game_ended event')
    console.log('Game result:', JSON.stringify(result, null, 2))
    updateGameState(result)
  })

  socketService.onDrawOffer((playerId) => {
    console.log('\n🤝 GAME STORE: Received draw_offer event')
    console.log('Offered by player:', playerId)
    setDrawOffer(true, playerId)
  })
}