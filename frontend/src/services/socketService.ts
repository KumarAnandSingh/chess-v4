import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/utils/constants'
import toast from 'react-hot-toast'
import { environment } from '@/config/environment'

// Types
export interface RoomData {
  roomCode: string
  roomId: string
  players: Player[]
  status: 'waiting' | 'ready' | 'playing' | 'finished'
  timeControl: TimeControl
  createdAt: string
}

export interface Player {
  id: string
  name: string
  rating: number
  color?: 'white' | 'black'
  connected: boolean
}

export interface TimeControl {
  time: number // seconds
  increment: number // seconds
}

export interface GameMove {
  from: string
  to: string
  promotion?: string
  san: string
  timeLeft?: number
}

export interface GameState {
  gameId: string
  position: string // FEN
  turn: 'white' | 'black'
  moves: string[]
  status: 'active' | 'finished'
  result?: 'white' | 'black' | 'draw'
  reason?: string
  lastMove?: { from: string; to: string }
  check?: boolean
  players: {
    white: Player
    black: Player
  }
  timeControl: TimeControl
  clock: {
    white: number
    black: number
  }
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: string
  type: 'message' | 'system'
}

class SocketService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect()
    }

    this.socket = io(environment.websocketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.setupEventListeners()
    return this.socket
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('Connected to server')
      toast.success('Connected to server')
    })

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.isConnected = false
      console.log('Disconnected from server:', reason)

      if (reason === 'io server disconnect') {
        // Server disconnected the client, manual reconnection needed
        toast.error('Disconnected from server')
      } else {
        // Client disconnected, auto-reconnection will happen
        toast.error('Connection lost, reconnecting...')
      }
    })

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++
      console.error('Connection error:', error)

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to server. Please refresh the page.')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts')
      toast.success('Reconnected to server')
    })

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect')
      toast.error('Unable to reconnect. Please refresh the page.')
    })

    // Handle general errors
    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error)
      toast.error(error.message || 'An error occurred')
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }

  // Room methods
  createRoom(timeControl: TimeControl): Promise<RoomData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { timeControl })

      this.socket.once(SOCKET_EVENTS.ROOM_CREATED, (data: RoomData) => {
        resolve(data)
      })

      this.socket.once(SOCKET_EVENTS.ROOM_ERROR, (error) => {
        reject(new Error(error.message))
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Room creation timeout'))
      }, 10000)
    })
  }

  joinRoom(roomCode: string): Promise<RoomData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode })

      this.socket.once(SOCKET_EVENTS.ROOM_JOINED, (data: RoomData) => {
        resolve(data)
      })

      this.socket.once(SOCKET_EVENTS.ROOM_ERROR, (error) => {
        reject(new Error(error.message))
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Room join timeout'))
      }, 10000)
    })
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM)
    }
  }

  startGame() {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.START_GAME)
    }
  }

  // Game methods
  makeMove(gameId: string, move: GameMove) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.MAKE_MOVE, {
        gameId,
        move: {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        },
        timeLeft: move.timeLeft,
      })
    }
  }

  resign(gameId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.RESIGN, { gameId })
    }
  }

  offerDraw(gameId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.DRAW_OFFER, { gameId })
    }
  }

  respondToDraw(gameId: string, accept: boolean) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.DRAW_RESPONSE, { gameId, accept })
    }
  }

  // Chat methods
  sendMessage(message: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { message })
    }
  }

  // Matchmaking methods
  findMatch(timeControl: TimeControl): Promise<GameState> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(SOCKET_EVENTS.FIND_MATCH, { timeControl })

      this.socket.once(SOCKET_EVENTS.MATCH_FOUND, (data: GameState) => {
        resolve(data)
      })

      this.socket.once(SOCKET_EVENTS.ERROR, (error) => {
        reject(new Error(error.message))
      })
    })
  }

  cancelSearch() {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.CANCEL_SEARCH)
    }
  }

  // Event listeners
  onRoomUpdated(callback: (room: RoomData) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.ROOM_UPDATED, callback)
    }
  }

  onPlayerJoined(callback: (player: Player) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.PLAYER_JOINED, callback)
    }
  }

  onPlayerLeft(callback: (playerId: string) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.PLAYER_LEFT, callback)
    }
  }

  onGameStarted(callback: (game: GameState) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.GAME_STARTED, callback)
    }
  }

  onMoveMade(callback: (move: any) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.MOVE_MADE, callback)
    }
  }

  onGameEnded(callback: (result: any) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.GAME_ENDED, callback)
    }
  }

  onMessageReceived(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, callback)
    }
  }

  onDrawOffer(callback: (playerId: string) => void) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.DRAW_OFFER, callback)
    }
  }

  // Cleanup methods
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.setupEventListeners() // Re-add basic connection listeners
    }
  }

  removeListener(event: string) {
    if (this.socket) {
      this.socket.off(event)
    }
  }
}

export const socketService = new SocketService()