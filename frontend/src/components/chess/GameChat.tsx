import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import { socketService } from '@/services/socketService'
import { useAuthStore } from '@/stores/authStore'
import { QUICK_MESSAGES } from '@/utils/constants'
import { cn } from '@/utils/cn'

interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'quick'
}

interface GameChatProps {
  className?: string
}

const GameChat: React.FC<GameChatProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Set up socket listener for messages
  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    }

    socketService.onMessageReceived(handleMessage)

    return () => {
      socketService.removeListener('message_received')
    }
  }, [])

  const sendMessage = (message: string) => {
    if (!message.trim() || !user) return

    const chatMessage = {
      id: crypto.randomUUID(),
      playerId: user.id,
      playerName: user.name,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'message' as const,
    }

    // Add to local messages immediately for better UX
    setMessages(prev => [...prev, chatMessage])

    // Send to server
    socketService.sendMessage(message.trim())
    setInputMessage('')
  }

  const sendQuickMessage = (message: string) => {
    sendMessage(message)
    setShowQuickMessages(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader
        title="Chat"
        subtitle={`${messages.length} messages`}
      />

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3" style={{ maxHeight: '300px' }}>
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No messages yet</div>
                <div className="text-xs mt-1">Say hello to your opponent!</div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-2 rounded-lg text-sm',
                    message.type === 'system'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-center italic'
                      : message.playerId === user?.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 ml-6'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 mr-6'
                  )}
                >
                  {message.type === 'system' ? (
                    <div>{message.message}</div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs">
                          {message.playerId === user?.id ? 'You' : message.playerName}
                        </span>
                        <span className="text-xs opacity-60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div>{message.message}</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Messages */}
        <AnimatePresence>
          {showQuickMessages && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="grid grid-cols-2 gap-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                {QUICK_MESSAGES.map((message) => (
                  <button
                    key={message}
                    onClick={() => sendQuickMessage(message)}
                    className="text-xs p-2 text-left hover:bg-white dark:hover:bg-slate-600 rounded transition-colors"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickMessages(!showQuickMessages)}
              className="text-xs"
            >
              Quick Messages
            </Button>
            <div className="text-xs text-slate-400">
              {inputMessage.length}/200
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GameChat