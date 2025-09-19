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

export const useGameStore = create<GameStoreState & GameStoreActions>((set, get) => ({
  ...initialState,

  initializeGame: (gameState, myColor) => {
    const game = new Chess(gameState.position)

    set({
      game,
      gameState,
      myColor,
      isMyTurn: game.turn() === myColor[0],
      isGameActive: gameState.status === 'active',
      moveHistory: [],
      selectedSquare: null,
      possibleMoves: [],
      lastMove: gameState.lastMove || null,
      drawOffered: false,
      drawOfferedBy: null,
    })
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

  updateGameState: (gameState) => {
    const { myColor } = get()
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
  },
}))

// Set up socket event listeners
if (typeof window !== 'undefined') {
  const { updateGameState, setDrawOffer } = useGameStore.getState()

  socketService.onGameStarted((gameState) => {
    // This will be handled by the GamePage component
    console.log('Game started:', gameState)
  })

  socketService.onMoveMade((moveData) => {
    // Update the game state with the new move
    updateGameState(moveData)
  })

  socketService.onGameEnded((result) => {
    updateGameState(result)
  })

  socketService.onDrawOffer((playerId) => {
    setDrawOffer(true, playerId)
  })
}