import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/utils/constants'
import toast from 'react-hot-toast'
import { environment } from '@/config/environment'

// Types
export interface RoomData {
  code: string
  players: Player[]
  status: 'waiting' | 'ready' | 'playing' | 'finished'
  gameSettings: any
  createdAt: string
  playerCount: number
  spectatorCount: number
  maxPlayers: number
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
  private isConnecting = false

  connect(username?: string, userPreferences?: any) {
    // If socket exists and is connected, just return it
    if (this.socket?.connected && this.isConnected) {
      console.log('✅ Socket already connected, reusing existing connection')
      console.log('Socket ID:', this.socket.id)
      return this.socket
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('⏳ Socket connection already in progress, waiting...')
      return this.socket
    }

    // Clean up any existing socket completely
    if (this.socket) {
      console.log('🧹 Cleaning up existing socket before creating new one')
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }

    this.isConnecting = true

    // Get user data for authentication
    const auth = {
      username: username || `Player${Math.floor(Math.random() * 10000)}`,
      rating: 1200,
      preferences: userPreferences || {
        timeControl: 'blitz',
        autoQueen: true,
        showCoordinates: true,
        playSound: true
      }
    }

    console.log('\n🔌 CREATING NEW SOCKET CONNECTION')
    console.log('Auth data:', auth)
    console.log('WebSocket URL:', environment.websocketUrl)

    this.socket = io(environment.websocketUrl, {
      auth,
      transports: ['polling', 'websocket'], // Start with polling for reliability
      timeout: 10000, // Reasonable timeout
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true, // Force new connection to avoid conflicts
      upgrade: true,
      autoConnect: true,
      withCredentials: true, // Match backend CORS configuration
    })

    this.setupEventListeners()
    return this.socket
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0
      console.log('\n✅ CONNECTED TO SERVER')
      console.log('Socket ID:', this.socket?.id)
      console.log('Transport:', this.socket?.io.engine.transport.name)
      toast.success('Connected to server')
    })

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.isConnected = false
      this.isConnecting = false
      console.log('\n❌ DISCONNECTED FROM SERVER')
      console.log('Reason:', reason)
      console.log('Socket ID was:', this.socket?.id)

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
      this.isConnecting = false
      console.error('\n❌ CONNECTION ERROR')
      console.error('Error details:', error)
      console.error('Attempt:', this.reconnectAttempts, '/', this.maxReconnectAttempts)
      console.error('Error message:', error.message)
      console.error('Error type:', error.type)

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
      console.error('\n❌ SOCKET ERROR')
      console.error('Error object:', error)
      console.error('Error message:', error.message)
      console.error('Error type:', error.type)
      console.error('Socket ID:', this.socket?.id)
      toast.error(error.message || 'An error occurred')
    })

    // Global game_started listener for debugging - catch events that might be missed
    this.socket.on('game_started', (data) => {
      console.log('\n🔥 GLOBAL game_started EVENT DETECTED in socketService!')
      console.log('Global listener received data:', JSON.stringify(data, null, 2))
      console.log('Current URL:', window.location.href)
      console.log('Socket ID:', this.socket?.id)
      console.log('Socket rooms:', Array.from(this.socket?.rooms || []))
    })

    // Handle authentication errors
    this.socket.on('auth_error', (error) => {
      console.error('\n❌ AUTHENTICATION ERROR')
      console.error('Auth error:', error)
      toast.error('Authentication failed: ' + (error.message || 'Please refresh the page'))
    })

    // Handle room errors
    this.socket.on('room_error', (error) => {
      console.error('\n❌ ROOM ERROR')
      console.error('Room error:', error)
      toast.error('Room error: ' + (error.message || 'Unknown room error'))
    })

    // Handle game errors
    this.socket.on('game_error', (error) => {
      console.error('\n❌ GAME ERROR')
      console.error('Game error:', error)
      toast.error('Game error: ' + (error.message || 'Unknown game error'))
    })
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket:', this.socket.id)
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.isConnecting = false
    }
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    const connected = this.isConnected && this.socket?.connected
    if (!connected) {
      console.log('⚠️ Socket connection check failed:', {
        isConnected: this.isConnected,
        socketExists: !!this.socket,
        socketConnected: this.socket?.connected,
        socketId: this.socket?.id
      })
    }
    return connected
  }

  // Room methods
  createRoom(timeControl: TimeControl): Promise<RoomData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      console.log('\n🏗️ CREATING ROOM with timeControl:', timeControl)
      console.log('Socket ID:', this.socket.id)
      console.log('Socket connected:', this.socket.connected)

      let timeoutId: NodeJS.Timeout | null = null
      let resolved = false

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.error('⏰ Room creation timeout after 10 seconds')
          reject(new Error('Room creation timeout - server did not respond in time'))
        }
      }, 10000)

      // Use callback pattern as expected by backend
      this.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { gameSettings: timeControl }, (response: any) => {
        console.log('\n📥 RECEIVED create_room RESPONSE')
        console.log('Response:', JSON.stringify(response, null, 2))

        if (resolved) {
          console.log('⚠️ Response received after timeout, ignoring')
          return
        }

        resolved = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (response && response.success) {
          console.log('✅ Successfully created room:', response.room?.code)
          // Set up room event listeners immediately after successful creation
          this.setupRoomEventListeners()
          resolve(response.room)  // Return the room data, not the whole response
        } else {
          console.error('❌ Failed to create room:', response?.error || 'Unknown error')
          reject(new Error(response?.error || 'Failed to create room - invalid response'))
        }
      })
    })
  }

  joinRoom(roomCode: string, isSpectator: boolean = false): Promise<RoomData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error('❌ Cannot join room - socket not connected')
        reject(new Error('Socket not connected'))
        return
      }

      console.log(`\n🚪 JOINING ROOM ${roomCode}`)
      console.log('Socket ID:', this.socket.id)
      console.log('Socket connected:', this.socket.connected)
      console.log('Current socket rooms:', Array.from(this.socket.rooms || []))

      const requestData = { roomCode, isSpectator }
      console.log('📤 Emitting join_room event with data:', JSON.stringify(requestData, null, 2))

      let timeoutId: NodeJS.Timeout | null = null
      let resolved = false

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.error('⏰ Room join timeout after 15 seconds')
          reject(new Error('Room join timeout - server did not respond in time'))
        }
      }, 15000)

      // Use callback pattern as expected by backend
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, requestData, (response: any) => {
        console.log('\n📥 RECEIVED join_room RESPONSE')
        console.log('Response:', JSON.stringify(response, null, 2))
        console.log('Socket rooms after join:', Array.from(this.socket?.rooms || []))

        // Log socket room status more thoroughly
        console.log('🔍 DETAILED SOCKET ROOM STATUS:')
        console.log('- Socket ID:', this.socket?.id)
        console.log('- Socket connected:', this.socket?.connected)
        console.log('- Socket rooms (Array):', Array.from(this.socket?.rooms || []))
        console.log('- Expected to be in room:', `room_${response?.room?.code}`)

        if (resolved) {
          console.log('⚠️ Response received after timeout, ignoring')
          return
        }

        resolved = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (response && response.success) {
          console.log('✅ Successfully joined room:', response.room?.code)

          // Additional validation: check if we're actually in the room
          const expectedRoomName = `room_${response.room?.code}`
          const isInRoom = this.socket?.rooms?.has(expectedRoomName)
          console.log(`🔍 Are we in room ${expectedRoomName}?`, isInRoom)

          if (!isInRoom) {
            console.log('⚠️ WARNING: Socket shows success but we are not in the expected room!')
            console.log('Available rooms:', Array.from(this.socket?.rooms || []))
            console.log('Expected room:', expectedRoomName)
          }

          // Set up room event listeners immediately after successful join
          this.setupRoomEventListeners()
          resolve(response.room)  // Return the room data, not the whole response
        } else {
          console.error('❌ Failed to join room:', response?.error || 'Unknown error')
          reject(new Error(response?.error || 'Failed to join room - invalid response'))
        }
      })
    })
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM)
    }
  }

  startGame() {
    // Note: This method is deprecated - games start automatically when room is full
    console.log('startGame() called - but backend starts games automatically when room has 2 players')
    // No longer emit start_game event as backend doesn't handle it
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
      console.log('📡 Setting up onRoomUpdated listener')
      // Remove existing listener to prevent duplicates
      this.socket.off(SOCKET_EVENTS.ROOM_UPDATED)
      this.socket.off('room_updated')

      // Set up the listener
      this.socket.on('room_updated', (data) => {
        console.log('📡 SocketService onRoomUpdated: Received room_updated event')
        console.log('Room data:', JSON.stringify(data, null, 2))
        if (data && data.room) {
          callback(data.room)
        }
      })
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
    if (!this.socket) {
      console.error('❌ SocketService: Cannot set up game_started listener - socket is null')
      return
    }

    console.log('\n🎮 SETTING UP game_started LISTENER in socketService')
    console.log('Socket ID:', this.socket.id)
    console.log('Socket connected:', this.socket.connected)
    console.log('Socket rooms:', Array.from(this.socket.rooms || []))

    // Remove any existing game_started listeners to prevent duplicates
    this.socket.off('game_started')

    // Set up the listener with error handling
    this.socket.on('game_started', (data) => {
      console.log('\n🚀 RECEIVED game_started EVENT in SocketService')
      console.log('Raw event data:', JSON.stringify(data, null, 2))

      try {
        // Validate the data structure
        if (!data || !data.gameId || !data.gameState) {
          console.error('❌ Invalid game_started data structure:', data)
          return
        }

        console.log('✅ Valid game_started event received')
        console.log('Game ID:', data.gameId)
        console.log('Game State status:', data.gameState?.status)
        console.log('Players in game:', data.gameState?.players?.length || 0)

        // Call the callback with the full data object
        callback(data)
        console.log('✅ Game started callback executed successfully')

      } catch (error) {
        console.error('❌ Error processing game_started event:', error)
        console.error('Error stack:', error.stack)
        console.error('Event data that caused error:', data)
      }
    })

    console.log('✅ game_started listener set up successfully')
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

  // Setup room-specific event listeners
  private setupRoomEventListeners() {
    if (!this.socket) {
      console.error('❌ Cannot setup room listeners - socket is null')
      return
    }

    console.log('\n📡 SETTING UP ROOM EVENT LISTENERS')
    console.log('Socket ID:', this.socket.id)
    console.log('Socket connected:', this.socket.connected)

    // Remove existing listeners to prevent duplicates
    this.socket.off('room_updated')

    // Set up room update listener with simplified logging
    this.socket.on('room_updated', (data) => {
      console.log('📡 SocketService: room_updated event received')
      if (data?.event) {
        console.log('Room event type:', data.event)
      }
    })

    console.log('✅ Room event listeners set up successfully')
  }

  // Health check method
  getConnectionHealth() {
    const socket = this.socket
    const health = {
      isConnected: this.isConnected,
      socketExists: !!socket,
      socketConnected: socket?.connected || false,
      socketId: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || null,
      rooms: socket ? Array.from(socket.rooms || []) : [],
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting,
    }

    console.log('\n🔍 CONNECTION HEALTH CHECK')
    console.log(JSON.stringify(health, null, 2))

    return health
  }

  // Enhanced connection check with retry
  async ensureConnection(maxRetries = 3, retryDelay = 1000): Promise<boolean> {
    console.log('\n🔄 ENSURING SOCKET CONNECTION')

    for (let i = 0; i < maxRetries; i++) {
      if (this.isSocketConnected()) {
        console.log('✅ Socket connection verified')
        return true
      }

      console.log(`⚠️ Connection attempt ${i + 1}/${maxRetries}`)

      if (!this.socket || !this.socket.connected) {
        console.log('🔄 Attempting to reconnect...')
        this.connect()
      }

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }

    console.log('❌ Failed to establish socket connection after', maxRetries, 'attempts')
    this.getConnectionHealth()
    return false
  }

  // Cleanup methods
  removeAllListeners() {
    if (this.socket) {
      console.log('🧹 Removing all socket listeners')
      this.socket.removeAllListeners()
      this.setupEventListeners() // Re-add basic connection listeners
    }
  }

  removeListener(event: string) {
    if (this.socket) {
      console.log('🧹 Removing listener for event:', event)
      this.socket.off(event)
    }
  }
}

export const socketService = new SocketService()