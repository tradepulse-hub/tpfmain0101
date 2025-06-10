"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"

// Tipos de peças do Tetris
const TETRIS_PIECES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
}

const PIECE_COLORS = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

type PieceType = keyof typeof TETRIS_PIECES
type Board = number[][]
type Position = { x: number; y: number }

interface Piece {
  shape: number[][]
  type: PieceType
  position: Position
}

interface TetrisGameProps {
  onBack?: () => void
  minimalUI?: boolean
}

export function TetrisGame({ onBack, minimalUI = false }: TetrisGameProps) {
  // Estado do jogo
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0)),
  )
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [nextPiece, setNextPiece] = useState<PieceType | null>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const gameLoopRef = useRef<NodeJS.Timeout>()
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Inicializar o jogo automaticamente
  useEffect(() => {
    const initGame = () => {
      const firstPiece = getRandomPiece()
      const secondPiece = getRandomPiece()
      setCurrentPiece(createPiece(firstPiece))
      setNextPiece(secondPiece)
      setIsPlaying(true)
    }

    initGame()
  }, [])

  // Gerar peça aleatória
  const getRandomPiece = useCallback((): PieceType => {
    const pieces = Object.keys(TETRIS_PIECES) as PieceType[]
    return pieces[Math.floor(Math.random() * pieces.length)]
  }, [])

  // Criar nova peça
  const createPiece = useCallback((type: PieceType): Piece => {
    return {
      shape: TETRIS_PIECES[type],
      type,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
    }
  }, [])

  // Verificar se posição é válida
  const isValidPosition = useCallback(
    (piece: Piece, newBoard?: Board): boolean => {
      const boardToCheck = newBoard || board

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.position.x + x
            const newY = piece.position.y + y

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && boardToCheck[newY][newX])) {
              return false
            }
          }
        }
      }
      return true
    },
    [board],
  )

  // Rotacionar peça
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) => piece.shape.map((row) => row[index]).reverse())

    return {
      ...piece,
      shape: rotated,
    }
  }, [])

  // Mover peça
  const movePiece = useCallback((piece: Piece, dx: number, dy: number): Piece => {
    return {
      ...piece,
      position: {
        x: piece.position.x + dx,
        y: piece.position.y + dy,
      },
    }
  }, [])

  // Fixar peça no tabuleiro
  const placePiece = useCallback((piece: Piece, currentBoard: Board): Board => {
    const newBoard = currentBoard.map((row) => [...row])

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y
          const boardX = piece.position.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = 1
          }
        }
      }
    }

    return newBoard
  }, [])

  // Limpar linhas completas
  const clearLines = useCallback((currentBoard: Board): { newBoard: Board; linesCleared: number } => {
    const newBoard = currentBoard.filter((row) => row.some((cell) => cell === 0))
    const linesCleared = BOARD_HEIGHT - newBoard.length

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }

    return { newBoard, linesCleared }
  }, [])

  // Spawnar nova peça
  const spawnNewPiece = useCallback(() => {
    if (!nextPiece) return

    const newPiece = createPiece(nextPiece)
    const newNextPiece = getRandomPiece()

    if (!isValidPosition(newPiece)) {
      setGameOver(true)
      setIsPlaying(false)
      return
    }

    setCurrentPiece(newPiece)
    setNextPiece(newNextPiece)
  }, [nextPiece, createPiece, getRandomPiece, isValidPosition])

  // Lógica principal do jogo
  const gameStep = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const movedPiece = movePiece(currentPiece, 0, 1)

    if (isValidPosition(movedPiece)) {
      setCurrentPiece(movedPiece)
    } else {
      // Fixar peça e spawnar nova
      const newBoard = placePiece(currentPiece, board)
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)

      setBoard(clearedBoard)
      setLines((prev) => prev + linesCleared)
      setScore((prev) => prev + linesCleared * 100 * level)

      spawnNewPiece()
    }
  }, [
    currentPiece,
    board,
    gameOver,
    isPaused,
    isValidPosition,
    movePiece,
    placePiece,
    clearLines,
    spawnNewPiece,
    level,
  ])

  // Iniciar jogo
  const startGame = useCallback(() => {
    const newBoard = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0))

    setBoard(newBoard)
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setIsPlaying(true)
    setIsPaused(false)

    // Forçar a criação da primeira peça imediatamente
    setTimeout(() => {
      if (!currentPiece) {
        const firstPiece = getRandomPiece()
        const secondPiece = getRandomPiece()
        setCurrentPiece(createPiece(firstPiece))
        setNextPiece(secondPiece)
      }
    }, 100)
  }, [getRandomPiece, createPiece, currentPiece])

  // Controles touch
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchStartRef.current || !currentPiece) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Se foi um tap (movimento pequeno), rotacionar
    if (distance < 20) {
      const rotated = rotatePiece(currentPiece)
      if (isValidPosition(rotated)) {
        setCurrentPiece(rotated)
      }
    } else {
      // Se foi um swipe, mover horizontalmente
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const direction = deltaX > 0 ? 1 : -1
        const moved = movePiece(currentPiece, direction, 0)
        if (isValidPosition(moved)) {
          setCurrentPiece(moved)
        }
      } else if (deltaY > 50) {
        // Swipe para baixo - drop rápido
        const moved = movePiece(currentPiece, 0, 1)
        if (isValidPosition(moved)) {
          setCurrentPiece(moved)
        }
      }
    }

    touchStartRef.current = null
  }

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const speed = Math.max(100, 1000 - (level - 1) * 100)
      gameLoopRef.current = setInterval(gameStep, speed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isPlaying, isPaused, gameStep, level])

  // Atualizar nível baseado nas linhas
  useEffect(() => {
    setLevel(Math.floor(lines / 10) + 1)
  }, [lines])

  // Auto-iniciar o jogo
  useEffect(() => {
    if (!isPlaying && !gameOver && !currentPiece) {
      startGame()
    }
  }, [isPlaying, startGame, gameOver, currentPiece])

  // Renderizar tabuleiro com peça atual
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row])

    // Adicionar peça atual ao display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = 2 // 2 para peça atual
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-4 h-4 border border-gray-700 ${
              cell === 1 ? "bg-gray-400" : cell === 2 ? `bg-blue-500` : "bg-gray-900"
            }`}
          />
        ))}
      </div>
    ))
  }

  // Renderizar próxima peça
  const renderNextPiece = () => {
    if (!nextPiece) return null

    const shape = TETRIS_PIECES[nextPiece]
    return shape.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div key={x} className={`w-2 h-2 border border-gray-700 ${cell ? "bg-blue-400" : "bg-gray-900"}`} />
        ))}
      </div>
    ))
  }

  return (
    <div className="flex flex-col items-center bg-gray-800 text-white p-1">
      {/* Botão de voltar (apenas se fornecido) */}
      {onBack && (
        <div className="w-full flex justify-start mb-1">
          <Button onClick={onBack} variant="outline" size="sm" className="text-xs py-0 px-1 h-6">
            ←
          </Button>
        </div>
      )}

      {/* Layout ultra-compacto */}
      <div className="flex gap-1">
        {/* Tabuleiro principal */}
        <div
          className="bg-gray-900 border border-gray-700 p-1 rounded-sm select-none touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderBoard()}
        </div>

        {/* Painel lateral ultra-compacto */}
        <div className="flex flex-col gap-1 w-16">
          {/* Próxima peça */}
          <div className="bg-gray-900 border border-gray-700 p-1 rounded-sm">
            <div className="text-center">
              <div className="text-[10px] text-gray-400">Próx</div>
              <div className="flex flex-col items-center">{renderNextPiece()}</div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-gray-900 border border-gray-700 p-1 rounded-sm">
            <div className="text-center space-y-1">
              <div>
                <div className="text-[10px] text-gray-400">Pts</div>
                <div className="text-xs font-bold">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Lin</div>
                <div className="text-xs font-bold">{lines}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Nvl</div>
                <div className="text-xs font-bold">{level}</div>
              </div>
            </div>
          </div>

          {/* Botão de pausa/continuar */}
          <Button
            onClick={() => setIsPaused(!isPaused)}
            className="w-full text-xs py-0 h-6"
            variant={isPaused ? "default" : "outline"}
            size="sm"
          >
            {isPaused ? "▶️" : "⏸️"}
          </Button>
        </div>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-3 rounded-sm text-center">
            <h2 className="text-sm font-bold mb-1">Game Over!</h2>
            <div className="mb-2 text-xs">
              <div>Pts: {score}</div>
              <div>Lin: {lines}</div>
              <div>Nvl: {level}</div>
            </div>
            <Button onClick={startGame} size="sm" className="text-xs py-0 h-6">
              Jogar Novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
