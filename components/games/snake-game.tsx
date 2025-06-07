"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react" // Importando o ícone X
import { GameLoadingScreen } from "./game-loading-screen"
import { getCurrentLanguage } from "@/lib/i18n"

interface SnakeGameProps {
  onBack: () => void
  minimalUI?: boolean
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type Position = { x: number; y: number }

interface TouchPosition {
  x: number
  y: number
}

const GRID_SIZE = 20
const CELL_SIZE = 15
const GAME_SPEED = 150
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
]

export const SnakeGame = ({ onBack, minimalUI = false }: SnakeGameProps) => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<Direction>("UP")
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null)

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tpfTokenImageRef = useRef<HTMLImageElement | null>(null)
  const directionRef = useRef<Direction>("UP")
  const snakeRef = useRef<Position[]>(INITIAL_SNAKE)
  const foodRef = useRef<Position>({ x: 5, y: 5 })
  const scoreRef = useRef<number>(0)
  const minSwipeDistance = 30

  // Keep refs updated with latest state values
  useEffect(() => {
    directionRef.current = direction
    snakeRef.current = snake
    foodRef.current = food
    scoreRef.current = score
  }, [direction, snake, food, score])

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("tpf_snake_high_score")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Load TPF token image
    const img = new Image()
    img.src = "/logo-tpf.png"
    img.onload = () => {
      tpfTokenImageRef.current = img
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [])

  // Funções para controle de toque
  const onTouchStart = (e: React.TouchEvent) => {
    if (!gameStarted || gameOver) return

    const touchPos = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
    setTouchStart(touchPos)
    setTouchEnd(null) // Resetar o fim do toque
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !gameStarted || gameOver) return

    const touchPos = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
    setTouchEnd(touchPos)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !gameStarted || gameOver) return

    // Calcular distâncias
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    // Verificar se a distância é suficiente para considerar um swipe
    if (Math.max(Math.abs(distanceX), Math.abs(distanceY)) < minSwipeDistance) {
      return // Não foi um swipe, apenas um toque
    }

    // Determinar a direção do swipe
    if (isHorizontalSwipe) {
      // Swipe horizontal
      if (distanceX > 0 && directionRef.current !== "RIGHT") {
        setDirection("LEFT")
      } else if (distanceX < 0 && directionRef.current !== "LEFT") {
        setDirection("RIGHT")
      }
    } else {
      // Swipe vertical
      if (distanceY > 0 && directionRef.current !== "DOWN") {
        setDirection("UP")
      } else if (distanceY < 0 && directionRef.current !== "UP") {
        setDirection("DOWN")
      }
    }

    // Resetar os valores de toque
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Generate random food position
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }

    // Make sure food doesn't spawn on snake
    const isOnSnake = snakeRef.current.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    if (isOnSnake) {
      return generateFood()
    }

    return newFood
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return

      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current !== "DOWN") setDirection("UP")
          break
        case "ArrowDown":
          if (directionRef.current !== "UP") setDirection("DOWN")
          break
        case "ArrowLeft":
          if (directionRef.current !== "RIGHT") setDirection("LEFT")
          break
        case "ArrowRight":
          if (directionRef.current !== "LEFT") setDirection("RIGHT")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted])

  // Draw game
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw snake
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#FFFFFF" : "#CCCCCC"
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
    })

    // Draw food (TPF token)
    if (tpfTokenImageRef.current) {
      ctx.drawImage(
        tpfTokenImageRef.current,
        foodRef.current.x * CELL_SIZE,
        foodRef.current.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      )
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.arc(
        foodRef.current.x * CELL_SIZE + CELL_SIZE / 2,
        foodRef.current.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }, [])

  // Start game
  const startGame = () => {
    const initialSnake = [...INITIAL_SNAKE]
    const initialFood = generateFood()

    setSnake(initialSnake)
    snakeRef.current = initialSnake

    setFood(initialFood)
    foodRef.current = initialFood

    setDirection("UP")
    directionRef.current = "UP"

    setGameOver(false)
    setScore(0)
    scoreRef.current = 0

    setGameStarted(true)

    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }

    // Set up game loop
    gameLoopRef.current = setInterval(() => {
      moveSnake()
      drawGame()
    }, GAME_SPEED)
  }

  // Move snake function - CORRIGIDO
  const moveSnake = useCallback(() => {
    // Don't use the gameOver state directly, check it inside the function
    if (gameLoopRef.current === null) return

    // Get current head and direction
    const head = { ...snakeRef.current[0] }
    const currentDirection = directionRef.current

    // Move head based on direction - CORRIGIDO OS CONTROLES
    switch (currentDirection) {
      case "UP":
        head.y -= 1
        break
      case "DOWN":
        head.y += 1
        break
      case "LEFT":
        head.x -= 1 // CORRIGIDO: era head.x -= 1
        break
      case "RIGHT":
        head.x += 1 // CORRIGIDO: era head.x -= 1 (estava errado)
        break
    }

    // Check for collisions with walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true)
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      return
    }

    // Check for collisions with self
    if (snakeRef.current.some((segment) => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true)
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      return
    }

    // Create new snake array with new head
    const newSnake = [head, ...snakeRef.current]

    // Check for food collision
    const ateFood = head.x === foodRef.current.x && head.y === foodRef.current.y

    if (ateFood) {
      // Generate new food position
      const newFood = generateFood()
      setFood(newFood)
      foodRef.current = newFood

      // Increase score
      const newScore = scoreRef.current + 10
      setScore(newScore)
      scoreRef.current = newScore
    } else {
      // Remove tail if no food eaten
      newSnake.pop()
    }

    // Update snake state
    setSnake(newSnake)
    snakeRef.current = newSnake
  }, [generateFood])

  // Restart game
  const restartGame = () => {
    // Update high score if needed
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current)
      localStorage.setItem("tpf_snake_high_score", scoreRef.current.toString())
    }

    // Clear the existing game loop
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }

    // Reset game state completely
    const initialSnake = [...INITIAL_SNAKE]
    const initialFood = generateFood()

    // Update all state and refs
    setSnake(initialSnake)
    snakeRef.current = initialSnake

    setFood(initialFood)
    foodRef.current = initialFood

    setDirection("UP")
    directionRef.current = "UP"

    setScore(0)
    scoreRef.current = 0

    setGameOver(false)

    // Force a small delay before starting the new game loop
    // This ensures all state updates have been processed
    setTimeout(() => {
      setGameStarted(true)
      // Start a new game loop
      gameLoopRef.current = setInterval(() => {
        moveSnake()
        drawGame()
      }, GAME_SPEED)
    }, 50)
  }

  // Adicionar função para finalizar o carregamento
  const handleLoadComplete = () => {
    setIsLoading(false)
    // Iniciar o jogo automaticamente após o carregamento
    startGame()
  }

  // Função para lidar com o clique no botão de fechar
  const handleClose = () => {
    // Limpar o loop do jogo antes de sair
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
    // Chamar a função onBack para voltar à página anterior
    onBack()
  }

  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Botão de fechar (X) no canto superior direito - sempre visível */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
        aria-label="Close game"
      >
        <X size={20} />
      </button>

      {isLoading && (
        <GameLoadingScreen onLoadComplete={handleLoadComplete} gameName="Snake Game" gameImage="/snake-game.png" />
      )}

      <div className="flex justify-between w-full mb-2 px-2">
        <div className="text-sm">
          <span className="text-white">Score: </span>
          <span className="font-bold text-white">{score}</span>
        </div>
        <div className="text-sm">
          <span className="text-white">High Score: </span>
          <span className="font-bold text-white">{highScore}</span>
        </div>
      </div>

      <div
        ref={gameAreaRef}
        className="relative bg-black rounded-lg overflow-hidden border border-gray-800"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} width={GRID_SIZE * CELL_SIZE} height={GRID_SIZE * CELL_SIZE} className="block" />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <h3 className="text-xl font-bold text-white mb-2">Game Over</h3>
            <p className="mb-4">
              <span className="text-white">Score: </span>
              <span className="font-bold text-white">{score}</span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartGame}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              {getCurrentLanguage() === "pt" ? "Jogar Novamente" : "Play Again"}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SnakeGame
