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
    set({ isCreatingRoom: true, roomError: null })

    try {
      const room = await socketService.createRoom(timeControl)
      set({
        currentRoom: room,
        isInRoom: true,
        isCreatingRoom: false,
      })
      toast.success(`Room ${room.roomCode} created!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room'
      set({
        isCreatingRoom: false,
        roomError: message,
      })
      toast.error(message)
    }
  },

  joinRoom: async (roomCode) => {
    set({ isJoiningRoom: true, roomError: null })

    try {
      const room = await socketService.joinRoom(roomCode.toUpperCase())
      set({
        currentRoom: room,
        isInRoom: true,
        isJoiningRoom: false,
      })
      toast.success(`Joined room ${room.roomCode}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room'
      set({
        isJoiningRoom: false,
        roomError: message,
      })
      toast.error(message)
    }
  },

  leaveRoom: () => {
    socketService.leaveRoom()
    set({
      currentRoom: null,
      isInRoom: false,
      roomError: null,
    })
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
    set({
      currentRoom: room,
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
  const { updateRoom, setRoom } = useRoomStore.getState()

  socketService.onRoomUpdated((room) => {
    updateRoom(room)
  })

  socketService.onPlayerJoined((player) => {
    toast.success(`${player.name} joined the room`)
  })

  socketService.onPlayerLeft((playerId) => {
    toast.info('A player left the room')
  })
}