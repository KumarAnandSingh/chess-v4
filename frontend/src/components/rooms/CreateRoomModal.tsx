import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Play, Copy, Check } from 'lucide-react'
import Modal, { ModalContent, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { GAME_MODES } from '@/utils/constants'
import { useRoomStore } from '@/stores/roomStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState('RAPID')
  const [customTime, setCustomTime] = useState(600)
  const [customIncrement, setCustomIncrement] = useState(5)
  const [codeCopied, setCodeCopied] = useState(false)

  const {
    createRoom,
    isCreatingRoom,
    currentRoom,
    roomError
  } = useRoomStore()

  const handleCreateRoom = async () => {
    const mode = GAME_MODES[selectedMode as keyof typeof GAME_MODES]
    const timeControl = selectedMode === 'CUSTOM'
      ? { time: customTime, increment: customIncrement }
      : { time: mode.time, increment: mode.increment }

    await createRoom(timeControl)
  }

  const copyRoomCode = async () => {
    if (!currentRoom) return

    try {
      await navigator.clipboard.writeText(currentRoom.code)
      setCodeCopied(true)
      toast.success('Room code copied!')
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy room code')
    }
  }

  const shareRoom = async () => {
    if (!currentRoom) return

    const shareData = {
      title: 'Join my Chess game!',
      text: `Join my chess game with room code: ${currentRoom.code}`,
      url: `${window.location.origin}/room/${currentRoom.code}`,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Room link copied!')
      }
    } catch (error) {
      toast.error('Failed to share room')
    }
  }

  // If room is created, show the room details
  if (currentRoom) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Room Created Successfully!"
        size="md"
      >
        <ModalContent>
          <div className="text-center space-y-6">
            {/* Room Code Display */}
            <div className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Room Code
              </div>
              <div className="room-code text-4xl mb-4">
                {currentRoom?.code || 'Loading...'}
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyRoomCode}
                  leftIcon={codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {codeCopied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={shareRoom}
                >
                  Share Room
                </Button>
              </div>
            </div>

            {/* Room Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Time Control
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {currentRoom?.gameSettings ?
                    `${Math.floor(currentRoom.gameSettings.initialTime / 60000)}+${currentRoom.gameSettings.increment / 1000}` :
                    'N/A'
                  }
                </div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Players
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {currentRoom?.players?.length || 0}/2
                </div>
              </div>
            </div>

            {/* Waiting Message */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <div className="font-medium mb-1">Waiting for opponent...</div>
                <div className="text-xs">Share the room code with a friend to start playing!</div>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Room"
      size="lg"
    >
      <ModalContent>
        <div className="space-y-6">
          {/* Game Mode Selection */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Select Time Control
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(GAME_MODES).map(([key, mode]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-200',
                      selectedMode === key
                        ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}
                    padding="sm"
                    onClick={() => setSelectedMode(key)}
                  >
                    <div className="text-center">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {mode.label}
                      </div>
                      {key !== 'CUSTOM' && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {Math.floor(mode.time / 60)} min + {mode.increment}s
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Time Controls */}
          {selectedMode === 'CUSTOM' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Custom Time Control
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="3600"
                    value={customTime}
                    onChange={(e) => setCustomTime(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Increment (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={customIncrement}
                    onChange={(e) => setCustomIncrement(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {roomError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
            >
              <div className="text-sm text-red-800 dark:text-red-200">
                {roomError}
              </div>
            </motion.div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={isCreatingRoom}
          onClick={handleCreateRoom}
          leftIcon={<Play className="w-4 h-4" />}
        >
          Create Room
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default CreateRoomModal