import { create } from 'zustand'
import { socketService, type RoomData, type Player, type TimeControl } from '@/services/socketService'
import toast from 'react-hot-toast'

interface RoomState {
  currentRoom: RoomData | null
  isInRoom: boolean
  isCreatingRoom: boolean
  isJoiningRoom: boolean
  isSearchingMatch: boolean
  roomError: string | null
}

interface RoomActions {
  createRoom: (timeControl: TimeControl) => Promise<void>
  joinRoom: (roomCode: string) => Promise<void>
  leaveRoom: () => void
  startGame: () => void
  findMatch: (timeControl: TimeControl) => Promise<void>
  cancelSearch: () => void
  setRoom: (room: RoomData | null) => void
  updateRoom: (room: RoomData) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useRoomStore = create<RoomState & RoomActions>((set, get) => ({
  currentRoom: null,
  isInRoom: false,
  isCreatingRoom: false,
  isJoiningRoom: false,
  isSearchingMatch: false,
  roomError: null,

  createRoom: async (timeControl) => {
    console.log('\n🏗️ ROOM STORE: Starting createRoom with timeControl:', timeControl)
    set({ isCreatingRoom: true, roomError: null })

    try {
      console.log('📞 Calling socketService.createRoom...')
      const room = await socketService.createRoom(timeControl)
      console.log('✅ SocketService returned room data:', JSON.stringify(room, null, 2))

      // Verify the room data is valid
      if (!room || !room.code) {
        throw new Error('Invalid room data received from server')
      }

      set({
        currentRoom: room,
        isInRoom: true,
        isCreatingRoom: false,
        roomError: null,
      })
      console.log('🔄 Store state updated: room created and set')
      console.log('Created room:', room.code)

      toast.success(`Room ${room.code} created!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room'
      console.error('❌ Create room error:', message)
      console.error('Error details:', error)

      set({
        isCreatingRoom: false,
        roomError: message,
      })

      toast.error(message)
    }
  },

  joinRoom: async (roomCode) => {
    console.log(`\n🏪 ROOM STORE: Starting joinRoom for ${roomCode}`)
    const currentState = get()
    console.log('Current store state:', {
      currentRoom: currentState.currentRoom?.code,
      isInRoom: currentState.isInRoom,
      isJoiningRoom: currentState.isJoiningRoom,
      roomError: currentState.roomError
    })

    // Prevent multiple simultaneous join attempts
    if (currentState.isJoiningRoom) {
      console.log('⚠️ Already joining room, skipping duplicate request')
      return
    }

    set({ isJoiningRoom: true, roomError: null })
    console.log('🔄 Store state updated: isJoiningRoom = true, roomError = null')

    try {
      console.log('📞 Calling socketService.joinRoom...')
      const room = await socketService.joinRoom(roomCode.toUpperCase())
      console.log('✅ SocketService returned room data:', JSON.stringify(room, null, 2))

      // Verify the room data is valid
      if (!room || !room.code) {
        throw new Error('Invalid room data received from server')
      }

      set({
        currentRoom: room,
        isInRoom: true,
        isJoiningRoom: false,
        roomError: null, // Clear any previous errors
      })
      console.log('🔄 Store state updated: room set, isInRoom = true, isJoiningRoom = false')
      console.log('Final room in store:', room?.code)
      console.log('Room status:', room?.status)
      console.log('Room player count:', room?.playerCount)

      toast.success(`Joined room ${room.code}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room'
      console.error('❌ Join room error:', message)
      console.error('Error details:', error)

      set({
        isJoiningRoom: false,
        roomError: message,
        // Don't clear currentRoom on error - user might already be in the room
      })
      console.log('🔄 Store state updated: isJoiningRoom = false, roomError =', message)

      // Only show error toast if it's not a timeout (user might have already joined)
      if (!message.includes('timeout')) {
        toast.error(message)
      } else {
        console.log('⚠️ Join timeout - user might already be in room, checking...')
      }
    }
  },

  leaveRoom: () => {
    console.log('\n🚪 ROOM STORE: Leaving room')
    const currentState = get()
    console.log('Leaving room:', currentState.currentRoom?.code)

    socketService.leaveRoom()
    set({
      currentRoom: null,
      isInRoom: false,
      roomError: null,
    })

    console.log('✅ Room store cleared')
  },

  startGame: () => {
    socketService.startGame()
  },

  findMatch: async (timeControl) => {
    set({ isSearchingMatch: true, roomError: null })

    try {
      await socketService.findMatch(timeControl)
      // Game state will be handled by gameStore when match is found
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to find match'
      set({
        isSearchingMatch: false,
        roomError: message,
      })
      toast.error(message)
    }
  },

  cancelSearch: () => {
    socketService.cancelSearch()
    set({
      isSearchingMatch: false,
      roomError: null,
    })
    toast.success('Search cancelled')
  },

  setRoom: (room) => {
    set({
      currentRoom: room,
      isInRoom: !!room,
    })
  },

  updateRoom: (room) => {
    console.log('\n🔄 ROOM STORE: Updating room data')
    console.log('New room data:', JSON.stringify(room, null, 2))

    const currentState = get()
    console.log('Previous room state:', {
      code: currentState.currentRoom?.code,
      status: currentState.currentRoom?.status,
      playerCount: currentState.currentRoom?.playerCount
    })

    set({
      currentRoom: room,
      isInRoom: !!room,
    })

    console.log('Room updated in store:', {
      code: room?.code,
      status: room?.status,
      playerCount: room?.playerCount
    })
  },

  setError: (error) => {
    set({ roomError: error })
  },

  reset: () => {
    set({
      currentRoom: null,
      isInRoom: false,
      isCreatingRoom: false,
      isJoiningRoom: false,
      isSearchingMatch: false,
      roomError: null,
    })
  },
}))

// Set up socket event listeners
if (typeof window !== 'undefined') {
  console.log('🏪 ROOM STORE: Setting up socket event listeners')

  // Delay setup to ensure socket is available
  const setupEventListeners = () => {
    const socket = socketService.getSocket()
    if (!socket) {
      console.log('⚠️ Socket not available, retrying in 1 second...')
      setTimeout(setupEventListeners, 1000)
      return
    }

    const { updateRoom, setRoom } = useRoomStore.getState()

    socketService.onRoomUpdated((room) => {
      console.log('\n📡 ROOM STORE: Received room_updated event')
      console.log('Updated room data:', JSON.stringify(room, null, 2))

      const currentState = useRoomStore.getState()
      console.log('Current room in store before update:', currentState.currentRoom?.code)
      console.log('Current room status before update:', currentState.currentRoom?.status)
      console.log('Current player count before update:', currentState.currentRoom?.playerCount)

      // Only update if we're actually in this room or it's a valid room
      if (room && (currentState.currentRoom?.code === room.code || currentState.isInRoom)) {
        updateRoom(room)

        const newState = useRoomStore.getState()
        console.log('Room store updated - new room code:', newState.currentRoom?.code)
        console.log('Room store updated - new room status:', newState.currentRoom?.status)
        console.log('Room store updated - new player count:', newState.currentRoom?.playerCount)
      } else {
        console.log('⚠️ Ignoring room update for different room:', room?.code)
      }
    })

    socketService.onPlayerJoined((player) => {
      console.log('\n👥 ROOM STORE: Player joined event')
      console.log('Player data:', JSON.stringify(player, null, 2))

      // Only show toast if we're in a room
      const currentState = useRoomStore.getState()
      if (currentState.isInRoom) {
        toast.success(`${player.name} joined the room`)
      }
    })

    socketService.onPlayerLeft((playerId) => {
      console.log('\n👋 ROOM STORE: Player left event')
      console.log('Player ID:', playerId)

      // Only show toast if we're in a room
      const currentState = useRoomStore.getState()
      if (currentState.isInRoom) {
        toast.info('A player left the room')
      }
    })

    console.log('✅ Socket event listeners set up successfully')
  }

  // Start setup process
  setupEventListeners()
}