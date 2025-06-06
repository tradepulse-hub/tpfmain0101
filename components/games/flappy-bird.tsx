"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface FlappyBirdProps {
  onBack?: () => void
  minimalUI?: boolean
}

interface Bird {
  x: number
  y: number
  velocity: number
}

interface Pipe {
  x: number
  topHeight: number
  bottomY: number
  passed: boolean
}

interface ScoreEffect {
  id: number
  x: number
  y: number
  score: number
}

export function FlappyBird({ onBack, minimalUI = false }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [scoreEffects, setScoreEffects] = useState<ScoreEffect[]>([])

  // Game objects
  const [bird, setBird] = useState<Bird>({ x: 80, y: 200, velocity: 0 })
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [gameSpeed, setGameSpeed] = useState(1.5) // Era 2, agora 1.5

  // Game constants
  const GRAVITY = 0.3 // Era 0.5, agora 0.3
  const JUMP_FORCE = -6 // Era -8, agora -6
  const PIPE_WIDTH = 60
  const PIPE_GAP = 120
  const PIPE_SPAWN_RATE = 120 // Era 90, agora 120 frames (mais tempo entre canos)
  const CANVAS_WIDTH = 320
  const CANVAS_HEIGHT = 480

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flappy_bird_best_score")
    if (saved) setBestScore(Number.parseInt(saved))
  }, [])

  // Save best score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem("flappy_bird_best_score", score.toString())
    }
  }, [score, bestScore])

  // Create score effect
  const createScoreEffect = useCallback((x: number, y: number, scoreValue: number) => {
    const effect: ScoreEffect = {
      id: Date.now() + Math.random(),
      x,
      y,
      score: scoreValue,
    }
    setScoreEffects((prev) => [...prev, effect])

    // Remove effect after animation
    setTimeout(() => {
      setScoreEffects((prev) => prev.filter((e) => e.id !== effect.id))
    }, 1000)
  }, [])

  // Jump function
  const jump = useCallback(() => {
    if (gameState === "playing") {
      setBird((prev) => ({ ...prev, velocity: JUMP_FORCE }))
    }
  }, [gameState])

  // Start game
  const startGame = useCallback(() => {
    setGameState("playing")
    setScore(0)
    setBird({ x: 80, y: 200, velocity: 0 })
    setPipes([
      {
        x: CANVAS_WIDTH + 100,
        topHeight: 150,
        bottomY: 270,
        passed: false,
      },
    ]) // Cano inicial
    setScoreEffects([])
    setGameSpeed(1.5)
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState("menu")
    setScore(0)
    setBird({ x: 80, y: 200, velocity: 0 })
    setPipes([])
    setScoreEffects([])
    setGameSpeed(1.5)
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let frameCount = 0

    const gameLoop = () => {
      frameCount++

      // Update bird
      setBird((prev) => {
        const newVelocity = prev.velocity + GRAVITY
        const newY = prev.y + newVelocity

        // Check ground collision
        if (newY > CANVAS_HEIGHT - 30 || newY < 0) {
          setGameState("gameOver")
          return prev
        }

        return { ...prev, y: newY, velocity: newVelocity }
      })

      // Update pipes
      setPipes((prev) => {
        let newPipes = [...prev]

        // Move pipes
        newPipes = newPipes.map((pipe) => ({ ...pipe, x: pipe.x - gameSpeed }))

        // Remove off-screen pipes
        newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH)

        // Add new pipes - garantir que sempre há pipes na tela
        const lastPipe = newPipes[newPipes.length - 1]
        const shouldSpawnPipe = !lastPipe || lastPipe.x < CANVAS_WIDTH - 200

        if (shouldSpawnPipe) {
          const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 75
          newPipes.push({
            x: CANVAS_WIDTH,
            topHeight,
            bottomY: topHeight + PIPE_GAP,
            passed: false,
          })
        }

        // Check scoring and collisions
        newPipes = newPipes.map((pipe) => {
          // Check if bird passed pipe
          if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true
            setScore((prev) => {
              const newScore = prev + 1
              createScoreEffect(pipe.x + PIPE_WIDTH / 2, CANVAS_HEIGHT / 2, 1)
              return newScore
            })

            // Increase speed every 5 points
            if ((score + 1) % 5 === 0) {
              setGameSpeed((prev) => Math.min(prev + 0.5, 6))
            }
          }

          // Check collision
          if (
            bird.x + 20 > pipe.x &&
            bird.x < pipe.x + PIPE_WIDTH &&
            (bird.y < pipe.topHeight || bird.y + 20 > pipe.bottomY)
          ) {
            setGameState("gameOver")
          }

          return pipe
        })

        return newPipes
      })

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, bird.x, bird.y, score, gameSpeed, createScoreEffect])

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    for (let i = 0; i < 3; i++) {
      const x = ((i * 120 + Date.now() * 0.01) % (CANVAS_WIDTH + 40)) - 40
      ctx.beginPath()
      ctx.arc(x, 60 + i * 30, 20, 0, Math.PI * 2)
      ctx.arc(x + 20, 60 + i * 30, 25, 0, Math.PI * 2)
      ctx.arc(x + 40, 60 + i * 30, 20, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw pipes
    ctx.fillStyle = "#228B22"
    pipes.forEach((pipe) => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY)

      // Pipe caps
      ctx.fillStyle = "#32CD32"
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20)
      ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20)
      ctx.fillStyle = "#228B22"
    })

    // Draw bird
    ctx.save()
    ctx.translate(bird.x + 10, bird.y + 10)
    ctx.rotate(Math.min(bird.velocity * 0.1, 0.5))

    // Bird body
    ctx.fillStyle = "#FFD700"
    ctx.beginPath()
    ctx.arc(0, 0, 12, 0, Math.PI * 2)
    ctx.fill()

    // Bird wing
    ctx.fillStyle = "#FFA500"
    ctx.beginPath()
    ctx.ellipse(-5, 0, 8, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Bird eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(3, -3, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(4, -3, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Bird beak
    ctx.fillStyle = "#FF6347"
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(15, -2)
    ctx.lineTo(15, 2)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Draw ground
    ctx.fillStyle = "#8B4513"
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30)

    // Ground pattern
    ctx.fillStyle = "#A0522D"
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, CANVAS_HEIGHT - 25, 10, 20)
    }
  }, [bird, pipes])

  // Handle input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        if (gameState === "menu") {
          startGame()
        } else if (gameState === "playing") {
          jump()
        } else if (gameState === "gameOver") {
          resetGame()
        }
      }
    }

    const handleClick = () => {
      if (gameState === "menu") {
        startGame()
      } else if (gameState === "playing") {
        jump()
      } else if (gameState === "gameOver") {
        resetGame()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("click", handleClick)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      if (canvas) {
        canvas.removeEventListener("click", handleClick)
      }
    }
  }, [gameState, startGame, jump, resetGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
      {!minimalUI && (
        <div className="flex items-center justify-between w-full max-w-sm mb-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Flappy Bird</h1>
          <div className="w-16" />
        </div>
      )}

      <div className="relative">
        {/* Botão de fechar (X) no canto superior direito - sempre visível */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
          aria-label="Close game"
        >
          <X size={20} />
        </button>
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-yellow-400 rounded-lg shadow-2xl cursor-pointer"
        />

        {/* Score Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-xs">Score</div>
          </div>
        </div>

        {/* Speed Indicator */}
        {gameState === "playing" && (
          <div className="absolute top-4 right-4">
            <div className="bg-red-500/80 text-white px-2 py-1 rounded text-xs">Speed: {gameSpeed.toFixed(1)}x</div>
          </div>
        )}

        {/* Score Effects */}
        <AnimatePresence>
          {scoreEffects.map((effect) => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, y: -50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute pointer-events-none"
              style={{
                left: effect.x,
                top: effect.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg">+{effect.score}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Game States Overlay */}
        <AnimatePresence>
          {gameState === "menu" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">🐦 Flappy Bird</h2>
                <p className="text-lg mb-4">Tap or press Space to fly!</p>
                <div className="mb-6">
                  <div className="text-sm text-gray-300">Best Score</div>
                  <div className="text-2xl font-bold text-yellow-400">{bestScore}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Start Game
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === "gameOver" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white"
            >
              <div className="text-center bg-gray-900/90 p-6 rounded-lg border border-gray-700">
                <h2 className="text-3xl font-bold mb-2 text-red-400">💥 Game Over!</h2>
                <div className="mb-4">
                  <div className="text-lg">Final Score</div>
                  <div className="text-3xl font-bold text-yellow-400">{score}</div>
                </div>
                <div className="mb-6">
                  <div className="text-sm text-gray-300">Best Score</div>
                  <div className="text-xl font-bold text-yellow-400">{bestScore}</div>
                  {score === bestScore && score > 0 && (
                    <div className="text-sm text-green-400 mt-1">🎉 New Record!</div>
                  )}
                </div>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
                  >
                    🔄 Play Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="w-full px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    📋 Main Menu
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {gameState === "playing" && (
        <div className="mt-4 text-center text-white/80 text-sm">
          <p>Tap screen or press Space to fly</p>
          <p>Avoid the pipes and collect points!</p>
        </div>
      )}
    </div>
  )
}

export default FlappyBird
