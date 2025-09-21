import React, { useState, useEffect } from 'react'
import { socketService } from '@/services/socketService'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'

interface ConnectionDebugProps {
  enabled?: boolean
}

const ConnectionDebug: React.FC<ConnectionDebugProps> = ({ enabled = false }) => {
  const [connectionHealth, setConnectionHealth] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(enabled)
  const { currentRoom, isInRoom } = useRoomStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!isVisible) return

    const updateHealth = () => {
      const health = socketService.getConnectionHealth()
      setConnectionHealth(health)
    }

    // Update immediately
    updateHealth()

    // Update every 5 seconds
    const interval = setInterval(updateHealth, 5000)

    return () => clearInterval(interval)
  }, [isVisible])

  // Keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow"
          title="Show debug panel (Ctrl+Shift+D)"
        >
          DEBUG
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-90 text-white text-xs p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-green-400">Connection Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      {/* Socket Connection Status */}
      <div className="mb-3">
        <h4 className="text-blue-400 font-semibold">Socket Status</h4>
        {connectionHealth ? (
          <div className="space-y-1">
            <div className={`${connectionHealth.isConnected ? 'text-green-400' : 'text-red-400'}`}>
              Connected: {connectionHealth.isConnected ? '✅' : '❌'}
            </div>
            <div>Socket ID: {connectionHealth.socketId || 'None'}</div>
            <div>Transport: {connectionHealth.transport || 'None'}</div>
            <div>Rooms: {connectionHealth.rooms.join(', ') || 'None'}</div>
            <div>Reconnect Attempts: {connectionHealth.reconnectAttempts}</div>
            <div className={`${connectionHealth.isConnecting ? 'text-yellow-400' : 'text-gray-400'}`}>
              Connecting: {connectionHealth.isConnecting ? '🔄' : '⏸️'}
            </div>
          </div>
        ) : (
          <div className="text-gray-400">Loading...</div>
        )}
      </div>

      {/* Room Status */}
      <div className="mb-3">
        <h4 className="text-blue-400 font-semibold">Room Status</h4>
        <div className="space-y-1">
          <div className={`${isInRoom ? 'text-green-400' : 'text-red-400'}`}>
            In Room: {isInRoom ? '✅' : '❌'}
          </div>
          <div>Room Code: {currentRoom?.code || 'None'}</div>
          <div>Room Status: {currentRoom?.status || 'None'}</div>
          <div>Player Count: {currentRoom?.playerCount || 0}</div>
          <div>Players: {currentRoom?.players?.map(p => p.name).join(', ') || 'None'}</div>
        </div>
      </div>

      {/* User Status */}
      <div className="mb-3">
        <h4 className="text-blue-400 font-semibold">User Status</h4>
        <div className="space-y-1">
          <div>Username: {user?.name || 'None'}</div>
          <div>User ID: {user?.id || 'None'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="text-blue-400 font-semibold">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => socketService.getConnectionHealth()}
            className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
          >
            Health Check
          </button>
          <button
            onClick={() => socketService.connect()}
            className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            Reconnect
          </button>
          <button
            onClick={() => console.log('Current stores:', { room: useRoomStore.getState(), user: useAuthStore.getState() })}
            className="bg-purple-600 px-2 py-1 rounded text-xs hover:bg-purple-700"
          >
            Log Stores
          </button>
        </div>
      </div>

      <div className="mt-2 text-gray-500 text-xs">
        Press Ctrl+Shift+D to toggle
      </div>
    </div>
  )
}

export default ConnectionDebug