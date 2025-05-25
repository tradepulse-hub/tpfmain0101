"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Importar o componente de carregamento
import { GameLoadingScreen } from "./game-loading-screen"

// Adicionar a propriedade minimalUI à interface DuckHuntGameProps
interface DuckHuntGameProps {
  onBack: () => void
  minimalUI?: boolean
}

// Duck types and directions
type DuckColor = "blue" | "red" | "black"
type Direction = "left" | "right" | "up" | "upLeft" | "upRight"

interface Duck {
  id: number
  x: number
  y: number
  width: number
  height: number
  color: DuckColor
  direction: Direction
  speed: number
  flap: boolean
  hit: boolean
  escaped: boolean
}

export const DuckHuntGame = ({ onBack, ...props }: DuckHuntGameProps) => {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [round, setRound] = useState(1)
  const [ducks, setDucks] = useState<Duck[]>([])
  const [showDog, setShowDog] = useState(false)
  const [dogState, setDogState] = useState<"hunting" | "caught" | "laughing">("hunting")
  const [shots, setShots] = useState(3)
  const [showRoundMessage, setShowRoundMessage] = useState(false)
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()).games || {})

  // Adicionar estado para controlar a tela de carregamento
  const [isLoading, setIsLoading] = useState(true)

  // Use refs to track state without triggering re-renders
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const flapIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const roundTransitioningRef = useRef<boolean>(false)
  const currentRoundRef = useRef<number>(1)
  const roundTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dogTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const allDucksProcessedRef = useRef<boolean>(false)

  const DUCK_COLORS: DuckColor[] = ["blue", "red", "black"]
  const DUCK_DIRECTIONS: Direction[] = ["left", "right", "up", "upLeft", "upRight"]

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()).games || {})
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Debug function to log state
  const logGameState = (message: string) => {
    console.log(
      `${message} - Round: ${currentRoundRef.current}, Transitioning: ${roundTransitioningRef.current}, AllDucksProcessed: ${allDucksProcessedRef.current}`,
    )
  }

  // Adicionar função para finalizar o carregamento
  const handleLoadComplete = () => {
    setIsLoading(false)
  }

  // Initialize game
  const startGame = useCallback(() => {
    // Clear any existing timeouts
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current)
      roundTimeoutRef.current = null
    }

    if (dogTimeoutRef.current) {
      clearTimeout(dogTimeoutRef.current)
      dogTimeoutRef.current = null
    }

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    if (flapIntervalRef.current) {
      clearInterval(flapIntervalRef.current)
      flapIntervalRef.current = null
    }

    // Reset all state
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLives(3)
    setRound(1)
    currentRoundRef.current = 1
    setDucks([])
    // Don't show the dog at the start
    setShowDog(false)
    setDogState("hunting")
    setShots(3)
    roundTransitioningRef.current = false
    allDucksProcessedRef.current = false

    logGameState("Game started")

    // Start the first round immediately without showing the dog
    startRound(1)
  }, [])

  // Start a new round
  const startRound = useCallback((roundNumber: number) => {
    logGameState(`Starting round ${roundNumber}`)

    // Update round state
    setRound(roundNumber)
    currentRoundRef.current = roundNumber
    allDucksProcessedRef.current = false
    roundTransitioningRef.current = true

    // Show round message
    setShowRoundMessage(true)

    // Clear any existing game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    // Clear any existing flap interval
    if (flapIntervalRef.current) {
      clearInterval(flapIntervalRef.current)
      flapIntervalRef.current = null
    }

    // Start the round after showing the message
    roundTimeoutRef.current = setTimeout(() => {
      setShowRoundMessage(false)

      // Generate ducks based on round number (more ducks in higher rounds)
      const numDucks = Math.min(1 + Math.floor(roundNumber / 2), 3)
      const newDucks: Duck[] = []

      for (let i = 0; i < numDucks; i++) {
        const randomColor = DUCK_COLORS[Math.floor(Math.random() * DUCK_COLORS.length)]
        const randomDirection = DUCK_DIRECTIONS[Math.floor(Math.random() * DUCK_DIRECTIONS.length)]
        // Slower speed - reduced by 50%
        const randomSpeed = 0.5 + Math.random() * (roundNumber * 0.25)

        newDucks.push({
          id: Date.now() + i,
          x: 20 + Math.random() * 60, // Random x position (20-80%)
          y: 80, // Start at the bottom of the sky
          width: 50,
          height: 50,
          color: randomColor,
          direction: randomDirection,
          speed: randomSpeed,
          flap: false,
          hit: false,
          escaped: false,
        })
      }

      setDucks(newDucks)
      setShots(3 + numDucks) // Give more shots for more ducks

      // Start duck flapping animation
      flapIntervalRef.current = setInterval(() => {
        setDucks((prevDucks) =>
          prevDucks.map((duck) => ({
            ...duck,
            flap: !duck.flap,
          })),
        )
      }, 300) // Slower flapping

      // Start game loop
      lastTimeRef.current = performance.now()
      gameLoopRef.current = requestAnimationFrame(gameLoop)

      // Reset transitioning flag
      roundTransitioningRef.current = false

      logGameState("Round started")
    }, 2000)
  }, [])

  // Game loop
  const gameLoop = useCallback(
    (time: number) => {
      // Skip if game over
      if (gameOver) {
        return
      }

      const deltaTime = time - lastTimeRef.current
      lastTimeRef.current = time

      setDucks((prevDucks) => {
        // If all ducks are hit or escaped, end the round
        if (
          prevDucks.length > 0 &&
          prevDucks.every((duck) => duck.hit || duck.escaped) &&
          !allDucksProcessedRef.current
        ) {
          // Mark ducks as processed to prevent multiple round completions
          allDucksProcessedRef.current = true

          logGameState("All ducks processed")

          // Check if any duck escaped
          const anyEscaped = prevDucks.some((duck) => duck.escaped)

          if (anyEscaped) {
            setLives((prev) => {
              const newLives = prev - 1

              // If no lives left, game over
              if (newLives <= 0) {
                if (gameLoopRef.current) {
                  cancelAnimationFrame(gameLoopRef.current)
                  gameLoopRef.current = null
                }

                setGameOver(true)
                setShowDog(true)
                setDogState("laughing")
                return 0
              }

              return newLives
            })

            // Show laughing dog when a duck escapes
            setShowDog(true)
            setDogState("laughing")
          } else {
            // Show dog with caught duck if any duck was hit
            const anyHit = prevDucks.some((duck) => duck.hit)
            setShowDog(true)
            setDogState(anyHit ? "caught" : "hunting")
          }

          // Schedule next round
          dogTimeoutRef.current = setTimeout(() => {
            setShowDog(false)

            // Increment round
            const nextRound = currentRoundRef.current + 1
            logGameState(`Advancing to round ${nextRound}`)

            // Start next round
            startRound(nextRound)
          }, 2000)

          return prevDucks
        }

        // Move ducks
        return prevDucks.map((duck) => {
          if (duck.hit || duck.escaped) return duck

          let newX = duck.x
          let newY = duck.y

          // Move based on direction
          switch (duck.direction) {
            case "left":
              newX -= duck.speed * (deltaTime / 16)
              break
            case "right":
              newX += duck.speed * (deltaTime / 16)
              break
            case "up":
              newY -= duck.speed * (deltaTime / 16)
              break
            case "upLeft":
              newX -= duck.speed * 0.7 * (deltaTime / 16)
              newY -= duck.speed * 0.7 * (deltaTime / 16)
              break
            case "upRight":
              newX += duck.speed * 0.7 * (deltaTime / 16)
              newY -= duck.speed * 0.7 * (deltaTime / 16)
              break
          }

          // Check boundaries and change direction if needed
          if (newX < 0) {
            newX = 0
            duck.direction = "right"
          } else if (newX > 100 - duck.width) {
            newX = 100 - duck.width
            duck.direction = "left"
          }

          // Check if duck escaped (top of screen)
          if (newY < 0) {
            return { ...duck, escaped: true }
          }

          // Randomly change direction occasionally
          if (Math.random() < 0.005) {
            // Less frequent direction changes
            duck.direction = DUCK_DIRECTIONS[Math.floor(Math.random() * DUCK_DIRECTIONS.length)]
          }

          return { ...duck, x: newX, y: newY }
        })
      })

      // Continue game loop if not game over and not all ducks processed
      if (!gameOver && !allDucksProcessedRef.current) {
        gameLoopRef.current = requestAnimationFrame(gameLoop)
      }
    },
    [gameOver, startRound],
  )

  // Handle shooting
  const handleShoot = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (gameOver || shots <= 0 || showDog || showRoundMessage || roundTransitioningRef.current) return

      // Get click/touch position
      const gameArea = gameAreaRef.current
      if (!gameArea) return

      const rect = gameArea.getBoundingClientRect()
      let clientX, clientY

      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        // Mouse event
        clientX = e.clientX
        clientY = e.clientY
      }

      const x = ((clientX - rect.left) / rect.width) * 100
      const y = ((clientY - rect.top) / rect.height) * 100

      // Decrease shots
      setShots((prev) => prev - 1)

      // Check if any duck was hit
      let duckHit = false

      setDucks((prevDucks) =>
        prevDucks.map((duck) => {
          // Skip already hit ducks
          if (duck.hit || duck.escaped) return duck

          // Check if shot hit this duck
          if (x >= duck.x && x <= duck.x + duck.width && y >= duck.y && y <= duck.y + duck.height) {
            duckHit = true
            setScore((prev) => prev + 10 * currentRoundRef.current)
            return { ...duck, hit: true, direction: "down" }
          }

          return duck
        }),
      )
    },
    [gameOver, shots, showDog, showRoundMessage],
  )

  // Restart game
  const restartGame = useCallback(() => {
    startGame()
  }, [startGame])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
      if (flapIntervalRef.current) {
        clearInterval(flapIntervalRef.current)
      }
      if (roundTimeoutRef.current) {
        clearTimeout(roundTimeoutRef.current)
      }
      if (dogTimeoutRef.current) {
        clearTimeout(dogTimeoutRef.current)
      }
    }
  }, [])

  // Render duck - using detailed SVG
  const renderDuck = (duck: Duck) => {
    // Get duck color based on type
    const duckMainColor = duck.color === "blue" ? "#0047AB" : duck.color === "red" ? "#B22222" : "#333333"
    const duckSecondaryColor = duck.color === "blue" ? "#6495ED" : duck.color === "red" ? "#FF6347" : "#555555"
    const duckHeadColor = duck.color === "blue" ? "#1E90FF" : duck.color === "red" ? "#CD5C5C" : "#444444"
    const duckBeakColor = "#FF8C00" // Orange beak
    const duckFeetColor = "#FF8C00" // Orange feet
    const duckEyeColor = "white"
    const duckPupilColor = "black"
    const duckWingColor = duck.color === "blue" ? "#4169E1" : duck.color === "red" ? "#A52A2A" : "#222222"

    // Position styles
    const duckStyle: React.CSSProperties = {
      position: "absolute",
      left: `${duck.x}%`,
      top: `${duck.y}%`,
      width: `${duck.width}px`,
      height: `${duck.height}px`,
      transform: `${duck.direction === "right" || duck.direction === "upRight" ? "scaleX(-1)" : ""} ${
        duck.flap ? "translateY(-2px)" : ""
      }`,
      transition: "transform 0.2s",
    }

    // If hit, animate falling
    if (duck.hit) {
      return (
        <motion.div
          key={duck.id}
          style={{
            ...duckStyle,
            transform: "rotate(180deg)",
          }}
          animate={{ y: "100vh" }}
          transition={{ duration: 1 }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            {/* Duck body */}
            <ellipse cx="50" cy="60" rx="25" ry="18" fill={duckMainColor} stroke="#000000" strokeWidth="1.5" />

            {/* Duck neck */}
            <path d="M30,50 Q35,45 30,40" fill={duckHeadColor} stroke="#000000" strokeWidth="1.5" />

            {/* Duck head */}
            <ellipse cx="25" cy="38" rx="12" ry="10" fill={duckHeadColor} stroke="#000000" strokeWidth="1.5" />

            {/* Duck beak */}
            <path d="M13,38 L20,35 L20,41 Z" fill={duckBeakColor} stroke="#000000" strokeWidth="1" />

            {/* Duck eye */}
            <circle cx="22" cy="36" r="2.5" fill={duckEyeColor} stroke="#000000" strokeWidth="0.5" />
            <circle cx="22" cy="36" r="1" fill={duckPupilColor} />

            {/* Duck wing */}
            <path
              d={duck.flap ? "M45,45 Q60,35 75,45 Q60,55 45,45" : "M45,55 Q60,45 75,55 Q60,65 45,55"}
              fill={duckWingColor}
              stroke="#000000"
              strokeWidth="1.5"
            />

            {/* Duck tail */}
            <path d="M75,60 L85,55 L85,65 Z" fill={duckSecondaryColor} stroke="#000000" strokeWidth="1" />

            {/* Duck feet */}
            <path d="M40,78 L45,70 L50,78" fill={duckFeetColor} stroke="#000000" strokeWidth="1" />
            <path d="M55,78 L60,70 L65,78" fill={duckFeetColor} stroke="#000000" strokeWidth="1" />

            {/* Duck breast highlight */}
            <path d="M40,60 Q50,70 60,60" fill="none" stroke={duckSecondaryColor} strokeWidth="3" />
          </svg>
        </motion.div>
      )
    }

    return (
      <div key={duck.id} style={duckStyle}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Duck body */}
          <ellipse cx="50" cy="60" rx="25" ry="18" fill={duckMainColor} stroke="#000000" strokeWidth="1.5" />

          {/* Duck neck */}
          <path d="M30,50 Q35,45 30,40" fill={duckHeadColor} stroke="#000000" strokeWidth="1.5" />

          {/* Duck head */}
          <ellipse cx="25" cy="38" rx="12" ry="10" fill={duckHeadColor} stroke="#000000" strokeWidth="1.5" />

          {/* Duck beak */}
          <path d="M13,38 L20,35 L20,41 Z" fill={duckBeakColor} stroke="#000000" strokeWidth="1" />

          {/* Duck eye */}
          <circle cx="22" cy="36" r="2.5" fill={duckEyeColor} stroke="#000000" strokeWidth="0.5" />
          <circle cx="22" cy="36" r="1" fill={duckPupilColor} />

          {/* Duck wing */}
          <path
            d={duck.flap ? "M45,45 Q60,35 75,45 Q60,55 45,45" : "M45,55 Q60,45 75,55 Q60,65 45,55"}
            fill={duckWingColor}
            stroke="#000000"
            strokeWidth="1.5"
          />

          {/* Duck tail */}
          <path d="M75,60 L85,55 L85,65 Z" fill={duckSecondaryColor} stroke="#000000" strokeWidth="1" />

          {/* Duck feet */}
          <path d="M40,78 L45,70 L50,78" fill={duckFeetColor} stroke="#000000" strokeWidth="1" />
          <path d="M55,78 L60,70 L65,78" fill={duckFeetColor} stroke="#000000" strokeWidth="1" />

          {/* Duck breast highlight */}
          <path d="M40,60 Q50,70 60,60" fill="none" stroke={duckSecondaryColor} strokeWidth="3" />
        </svg>
      </div>
    )
  }

  // Render dog - using the original dog images
  const renderDog = () => {
    if (!showDog) return null

    // Fixed position for the dog - centered at the bottom
    const dogContainerStyle = {
      position: "absolute" as const,
      left: "50%",
      bottom: "0", // Position at the very bottom
      transform: "translateX(-50%)",
      width: "140px", // Increased width
      height: "140px", // Increased height
      zIndex: 20,
    }

    // Use the appropriate dog image based on state
    const dogImageSrc = dogState === "laughing" ? "/duck-hunt-laughing-dog.png" : "/duck-hunt-dog.png"

    return (
      <div style={dogContainerStyle}>
        <img
          src={dogImageSrc || "/placeholder.svg"}
          alt={dogState === "laughing" ? "Laughing dog" : "Hunting dog"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom",
          }}
        />
      </div>
    )
  }

  // Função para lidar com o clique no botão de fechar
  const handleClose = () => {
    // Limpar recursos do jogo antes de sair
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    if (flapIntervalRef.current) {
      clearInterval(flapIntervalRef.current)
    }
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current)
    }
    if (dogTimeoutRef.current) {
      clearTimeout(dogTimeoutRef.current)
    }

    // Chamar a função onBack para voltar à página anterior
    onBack()
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Botão de fechar (X) no canto superior direito - sempre visível */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
        aria-label="Close game"
      >
        <X size={20} />
      </button>

      {isLoading && (
        <GameLoadingScreen onLoadComplete={handleLoadComplete} gameName="Duck Hunt" gameImage="/duck-hunt-game.png" />
      )}

      {/* Header - mostrar apenas se não estiver em modo minimalUI */}
      {!props.minimalUI && (
        <div className="flex justify-between items-center mb-1">
          <button onClick={onBack} className="flex items-center text-gray-300 hover:text-white">
            <ArrowLeft size={16} className="mr-1" />
            <span className="text-sm">{translations.back || "Back"}</span>
          </button>
          <div className="text-base font-bold">Duck Hunt</div>
        </div>
      )}

      {/* Game area */}
      <div
        ref={gameAreaRef}
        style={{
          height: "300px",
          backgroundColor: "#4dabf7", // Explicit sky blue color
          position: "relative",
          overflow: "hidden",
          borderRadius: "0.5rem",
          cursor: "crosshair",
        }}
        onClick={handleShoot}
        onTouchStart={handleShoot}
      >
        {/* Sky gradient */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "100%",
            background: "linear-gradient(to bottom, #1E90FF, #87CEEB)",
            zIndex: 0,
          }}
        />

        {/* Clouds */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            top: "15%",
            width: "60px",
            height: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "20px",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "5%",
            top: "18%",
            width: "40px",
            height: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "15px",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "20%",
            top: "10%",
            width: "50px",
            height: "18px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "18px",
            zIndex: 1,
          }}
        />

        {/* Trees */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            bottom: "15%",
            width: "40px",
            height: "80px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              width: "8px",
              height: "40px",
              backgroundColor: "#854d0e",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "32px",
              left: "50%",
              width: "32px",
              height: "32px",
              backgroundColor: "#22c55e",
              borderRadius: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "48px",
              left: "50%",
              width: "24px",
              height: "24px",
              backgroundColor: "#22c55e",
              borderRadius: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            right: "15%",
            bottom: "15%",
            width: "30px",
            height: "60px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              width: "6px",
              height: "30px",
              backgroundColor: "#854d0e",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              width: "24px",
              height: "24px",
              backgroundColor: "#22c55e",
              borderRadius: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        {/* Ground with gradient */}
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            bottom: "0",
            height: "40px",
            background: "linear-gradient(to bottom, #16a34a, #15803d)",
            zIndex: 2,
          }}
        >
          {/* Grass details */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: "0",
                left: `${i * 2.5}%`,
                width: "2px",
                height: `${3 + Math.random() * 5}px`,
                backgroundColor: "#15803d",
              }}
            />
          ))}
        </div>

        {/* Ducks */}
        {ducks.map(renderDuck)}

        {/* Dog */}
        {renderDog()}

        {/* Round message */}
        <AnimatePresence>
          {showRoundMessage && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 10 }}
            >
              <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg text-xl font-bold">
                {translations.round || "Round"} {round}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game over */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ zIndex: 10 }}
            >
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <h2 className="text-xl font-bold mb-2">{translations.gameOver || "Game Over"}</h2>
                <p className="text-lg mb-1">
                  {translations.score || "Score"}: {score}
                </p>
                <p className="text-base mb-3">
                  {translations.round || "Rounds"}: {round - 1}
                </p>
                <button
                  onClick={restartGame}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {translations.playAgain || "Play Again"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start screen */}
        <AnimatePresence>
          {!gameStarted && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 10 }}
            >
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <h2 className="text-xl font-bold mb-2">Duck Hunt</h2>
                <p className="text-sm mb-4">{translations.subtitle || "Tap to shoot the ducks before they escape!"}</p>
                <button onClick={startGame} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {translations.start || "Start Game"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game info */}
      <div className="flex justify-between items-center mt-1 px-2 py-1 bg-gray-800 rounded-lg text-xs">
        <div className="flex items-center">
          <span className="mr-1">{translations.score || "Score"}:</span>
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">{translations.round || "Round"}:</span>
          <span className="font-bold">{round}</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">{translations.lives || "Lives"}:</span>
          <div className="flex">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 mx-0.5 rounded-full ${i < lives ? "bg-red-500" : "bg-gray-600"}`}></div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-1">{translations.shots || "Shots"}:</span>
          <div className="flex">
            {Array.from({ length: Math.min(shots, 5) }).map((_, i) => (
              <div key={i} className="w-1.5 h-4 mx-0.5 bg-yellow-500"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DuckHuntGame
