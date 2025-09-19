import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, RotateCcw } from 'lucide-react'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/utils/cn'

interface MoveListProps {
  className?: string
}

const MoveList: React.FC<MoveListProps> = ({ className }) => {
  const { moveHistory, game } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [moveHistory])

  // Group moves by pairs (white and black moves)
  const movePairs = []
  for (let i = 0; i < moveHistory.length; i += 2) {
    const whiteMove = moveHistory[i]
    const blackMove = moveHistory[i + 1]
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: whiteMove,
      black: blackMove,
    })
  }

  const exportPGN = () => {
    const moves = moveHistory.map(move => move.move).join(' ')
    const pgn = `[Event "Chess v4 Game"]
[Date "${new Date().toISOString().split('T')[0]}"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

${moves} *`

    // Copy to clipboard or download
    navigator.clipboard.writeText(pgn).then(() => {
      console.log('PGN copied to clipboard')
    }).catch(() => {
      // Fallback: create download link
      const blob = new Blob([pgn], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chess-game.pgn'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader
        title="Move List"
        subtitle={`${moveHistory.length} moves`}
        action={
          moveHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={exportPGN}
              leftIcon={<ScrollText className="w-4 h-4" />}
            >
              Export
            </Button>
          )
        }
      />

      <CardContent className="flex-1 flex flex-col">
        {moveHistory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No moves yet</div>
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-1"
            style={{ maxHeight: '300px' }}
          >
            {movePairs.map((pair, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {/* Move number */}
                <div className="w-8 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                  {pair.moveNumber}.
                </div>

                {/* White move */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                    {pair.white.move}
                  </span>
                </div>

                {/* Black move */}
                <div className="flex-1 min-w-0">
                  {pair.black && (
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {pair.black.move}
                    </span>
                  )}
                </div>

                {/* Time stamps (if available) */}
                {pair.white.timeLeft && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {Math.floor(pair.white.timeLeft.white / 60)}:
                    {(pair.white.timeLeft.white % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Game notation footer */}
        {moveHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>Current position: {game.fen().split(' ')[0]}</div>
              <div className="flex items-center gap-2">
                <span>Turn: {game.turn() === 'w' ? 'White' : 'Black'}</span>
                {game.inCheck() && (
                  <span className="text-red-500 font-medium">Check!</span>
                )}
                {game.isCheckmate() && (
                  <span className="text-red-600 font-bold">Checkmate!</span>
                )}
                {game.isDraw() && (
                  <span className="text-amber-600 font-medium">Draw</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MoveList