import React, { useMemo, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import { Square } from 'chess.js'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

interface ChessBoardProps {
  className?: string
}

const ChessBoard: React.FC<ChessBoardProps> = ({ className }) => {
  const {
    game,
    selectedSquare,
    possibleMoves,
    lastMove,
    isMyTurn,
    myColor,
    selectSquare,
    makeMove,
  } = useGameStore()

  const {
    boardOrientation,
    boardSize,
    animations,
  } = useUIStore()

  // Calculate board width based on size setting
  const boardWidth = useMemo(() => {
    const sizes = {
      small: 320,
      medium: 480,
      large: 600,
    }
    return sizes[boardSize]
  }, [boardSize])

  // Handle piece selection and moves
  const onSquareClick = useCallback((square: Square) => {
    if (!isMyTurn) return
    selectSquare(square)
  }, [isMyTurn, selectSquare])

  // Handle piece drop (drag and drop)
  const onPieceDrop = useCallback((sourceSquare: Square, targetSquare: Square) => {
    if (!isMyTurn) return false

    const success = makeMove(sourceSquare, targetSquare)
    return success
  }, [isMyTurn, makeMove])

  // Custom square styles for highlights
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(247, 247, 105, 0.8)',
        border: '2px solid #f7f769',
      }
    }

    // Highlight possible moves
    possibleMoves.forEach(square => {
      styles[square] = {
        background: 'radial-gradient(circle, rgba(0,0,0,0.1) 25%, transparent 25%)',
        borderRadius: '50%',
      }
    })

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      }
      styles[lastMove.to] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      }
    }

    // Highlight check
    if (game.inCheck()) {
      const kingSquare = game.board().flat().find(
        piece => piece?.type === 'k' && piece?.color === game.turn()
      )
      if (kingSquare) {
        // Find the king's position
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const square = String.fromCharCode(97 + file) + (8 - rank) as Square
            const piece = game.get(square)
            if (piece?.type === 'k' && piece?.color === game.turn()) {
              styles[square] = {
                backgroundColor: 'rgba(255, 71, 87, 0.8)',
                border: '2px solid #ff4757',
              }
            }
          }
        }
      }
    }

    return styles
  }, [selectedSquare, possibleMoves, lastMove, game])

  // Custom piece style for smooth animations
  const customPieceStyle = useMemo(() => {
    if (!animations.enabled) return {}

    const duration = {
      slow: '0.6s',
      normal: '0.3s',
      fast: '0.1s',
    }

    return {
      transition: `all ${duration[animations.speed]} ease-in-out`,
    }
  }, [animations])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('chess-board-container', className)}
    >
      <div
        className="chess-board-wrapper shadow-chess-lg rounded-lg overflow-hidden"
        style={{
          width: boardWidth,
          height: boardWidth,
        }}
      >
        <Chessboard
          position={game.fen()}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          boardOrientation={myColor || boardOrientation}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '8px',
          }}
          customLightSquareStyle={{
            backgroundColor: '#f0d9b5',
          }}
          customDarkSquareStyle={{
            backgroundColor: '#b58863',
          }}
          customPieceStyle={customPieceStyle}
          areArrowsAllowed={false}
          arePiecesDraggable={isMyTurn}
          animationDuration={animations.enabled ? (animations.speed === 'fast' ? 100 : animations.speed === 'slow' ? 600 : 300) : 0}
          showBoardNotation={true}
          boardWidth={boardWidth}
        />
      </div>

      {/* Board controls */}
      <div className="mt-4 flex justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          onClick={() => {
            // Toggle board orientation
            const newOrientation = boardOrientation === 'white' ? 'black' : 'white'
            useUIStore.getState().setBoardOrientation(newOrientation)
          }}
        >
          Flip Board
        </motion.button>
      </div>
    </motion.div>
  )
}

export default ChessBoard