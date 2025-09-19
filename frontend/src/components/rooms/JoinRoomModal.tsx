import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, AlertCircle } from 'lucide-react'
import Modal, { ModalContent, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useRoomStore } from '@/stores/roomStore'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [roomCode, setRoomCode] = useState('')
  const [inputError, setInputError] = useState('')

  const {
    joinRoom,
    isJoiningRoom,
    roomError
  } = useRoomStore()

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 4)
    setRoomCode(value)
    setInputError('')
  }

  const handleJoinRoom = async () => {
    // Validate room code format
    if (!roomCode || roomCode.length !== 4) {
      setInputError('Room code must be 4 characters')
      return
    }

    if (!/^[A-Z0-9]+$/.test(roomCode)) {
      setInputError('Room code can only contain letters and numbers')
      return
    }

    await joinRoom(roomCode)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 4) {
      handleJoinRoom()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Room"
      size="md"
    >
      <ModalContent>
        <div className="space-y-6">
          {/* Instructions */}
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter the 4-character room code to join a game
            </div>
          </div>

          {/* Room Code Input */}
          <div className="space-y-2">
            <Input
              label="Room Code"
              value={roomCode}
              onChange={handleRoomCodeChange}
              onKeyPress={handleKeyPress}
              placeholder="e.g., AB12"
              className="text-center text-2xl font-mono tracking-widest uppercase"
              maxLength={4}
              error={inputError}
              autoFocus
              fullWidth
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Room codes are 4 characters long (letters and numbers)
            </div>
          </div>

          {/* Recent Rooms (Future Enhancement) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Recent Rooms
            </h4>
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No recent rooms found
            </div>
          </div>

          {/* Tips */}
          <Card variant="outlined" padding="sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Tips for joining rooms:
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Room codes are case-insensitive</li>
                  <li>• Ask your friend for their room code</li>
                  <li>• Make sure the room hasn't expired</li>
                </ul>
              </div>
            </div>
          </Card>

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
          loading={isJoiningRoom}
          onClick={handleJoinRoom}
          disabled={roomCode.length !== 4}
          leftIcon={<Users className="w-4 h-4" />}
        >
          Join Room
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default JoinRoomModal