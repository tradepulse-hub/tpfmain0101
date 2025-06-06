"use client"

import { useState, useRef, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"
import { X } from "lucide-react"

type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"
type PieceColor = "white" | "black"
type GameMode = "menu" | "playing" | "gameover"

interface ChessPiece {
  type: PieceType
  color: PieceColor
  position: [number, number]
  id: string
}

interface GameState {
  board: (ChessPiece | null)[][]
  selectedSquare: [number, number] | null
  validMoves: [number, number][]
  currentPlayer: PieceColor
  gameMode: GameMode
  vsComputer: boolean
  moveHistory: string[]
  winner: PieceColor | null
  capturedPieces: ChessPiece[]
}

// Particle explosion effect
function ParticleExplosion({ position, active }: { position: [number, number, number]; active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (particlesRef.current && active) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 2
      const scale = Math.max(0, 1 - (state.clock.elapsedTime % 1))
      particlesRef.current.scale.setScalar(scale)
    }
  })

  if (!active) return null

  const particleCount = 30
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1.5
    positions[i * 3 + 1] = Math.random() * 1
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5
  }

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ff6b35" size={0.1} />
    </points>
  )
}

// Compact 3D Chess Piece
function ChessPiece3D({
  piece,
  position,
  isSelected,
  onClick,
}: {
  piece: ChessPiece
  position: [number, number, number]
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.position.y = position[1] + 0.05 + Math.sin(state.clock.elapsedTime * 5) * 0.02
      } else {
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], 0.1)
      }
      if (hovered) meshRef.current.scale.setScalar(1.05)
      else meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }
  })

  const color = piece.color === "white" ? "#f5f5f5" : "#333"
  const emissive = isSelected ? "#4ade80" : "#000"

  // Ultra-compact piece shapes
  const shapes = {
    king: (
      <group>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.2, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.03, 0.08, 0.03]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.08, 0.02, 0.02]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
    queen: (
      <group>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.2, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.06, 0.12, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
    rook: (
      <group>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.14, 0.03, 0.14]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
    bishop: (
      <group>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.2, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.05, 0.1, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
    knight: (
      <group>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.2, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.18, 0.05]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.08]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
    pawn: (
      <group>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.16, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
        </mesh>
      </group>
    ),
  }

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {shapes[piece.type]}
    </group>
  )
}

// Compact Chess Board
function ChessBoard3D({
  board,
  selectedSquare,
  validMoves,
  onSquareClick,
  explosions,
}: {
  board: (ChessPiece | null)[][]
  selectedSquare: [number, number] | null
  validMoves: [number, number][]
  onSquareClick: (row: number, col: number) => void
  explosions: { position: [number, number, number]; active: boolean }[]
}) {
  return (
    <group>
      {/* Compact board base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[4.2, 0.1, 4.2]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Squares */}
      {board.map((row, rowIndex) =>
        row.map((_, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0
          const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex
          const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex)

          let color = isLight ? "#f0d9b5" : "#b58863"
          if (isSelected) color = "#4ade80"
          else if (isValidMove) color = "#fbbf24"

          return (
            <mesh
              key={`${rowIndex}-${colIndex}`}
              position={[(colIndex - 3.5) * 0.5, 0, (rowIndex - 3.5) * 0.5]}
              onClick={() => onSquareClick(rowIndex, colIndex)}
            >
              <boxGeometry args={[0.5, 0.05, 0.5]} />
              <meshStandardMaterial color={color} />
            </mesh>
          )
        }),
      )}

      {/* Pieces */}
      {board.flat().map((piece, index) => {
        if (!piece) return null
        const [row, col] = piece.position
        const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col

        return (
          <ChessPiece3D
            key={piece.id}
            piece={piece}
            position={[(col - 3.5) * 0.5, 0.025, (row - 3.5) * 0.5]}
            isSelected={isSelected}
            onClick={() => onSquareClick(row, col)}
          />
        )
      })}

      {/* Explosion effects */}
      {explosions.map((explosion, index) => (
        <ParticleExplosion key={index} position={explosion.position} active={explosion.active} />
      ))}
    </group>
  )
}

// Initial board setup
const createBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  const pieces: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
  pieces.forEach((type, col) => {
    board[0][col] = { type, color: "black", position: [0, col], id: `black-${type}-${col}` }
    board[7][col] = { type, color: "white", position: [7, col], id: `white-${type}-${col}` }
  })

  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: "pawn", color: "black", position: [1, col], id: `black-pawn-${col}` }
    board[6][col] = { type: "pawn", color: "white", position: [6, col], id: `white-pawn-${col}` }
  }

  return board
}

export function Chess3D({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>({
    board: createBoard(),
    selectedSquare: null,
    validMoves: [],
    currentPlayer: "white",
    gameMode: "menu",
    vsComputer: false,
    moveHistory: [],
    winner: null,
    capturedPieces: [],
  })

  const [explosions, setExplosions] = useState<{ position: [number, number, number]; active: boolean }[]>([])

  // Get valid moves (simplified)
  const getValidMoves = useCallback((piece: ChessPiece, board: (ChessPiece | null)[][]): [number, number][] => {
    const [row, col] = piece.position
    const moves: [number, number][] = []

    const isValid = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8
    const isEmpty = (r: number, c: number) => isValid(r, c) && !board[r][c]
    const isEnemy = (r: number, c: number) => isValid(r, c) && board[r][c] && board[r][c]!.color !== piece.color

    const directions: Record<string, number[][]> = {
      rook: [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ],
      bishop: [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ],
      queen: [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ],
      king: [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ],
    }

    switch (piece.type) {
      case "pawn":
        const dir = piece.color === "white" ? -1 : 1
        const start = piece.color === "white" ? 6 : 1
        if (isEmpty(row + dir, col)) {
          moves.push([row + dir, col])
          if (row === start && isEmpty(row + 2 * dir, col)) moves.push([row + 2 * dir, col])
        }
        if (isEnemy(row + dir, col - 1)) moves.push([row + dir, col - 1])
        if (isEnemy(row + dir, col + 1)) moves.push([row + dir, col + 1])
        break

      case "knight":
        const knightMoves = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ]
        for (const [dr, dc] of knightMoves) {
          const nr = row + dr
          const nc = col + dc
          if (isEmpty(nr, nc) || isEnemy(nr, nc)) moves.push([nr, nc])
        }
        break

      case "rook":
      case "bishop":
      case "queen":
        for (const [dr, dc] of directions[piece.type]) {
          for (let i = 1; i < 8; i++) {
            const nr = row + dr * i
            const nc = col + dc * i
            if (!isValid(nr, nc)) break
            if (isEmpty(nr, nc)) moves.push([nr, nc])
            else if (isEnemy(nr, nc)) {
              moves.push([nr, nc])
              break
            } else break
          }
        }
        break

      case "king":
        for (const [dr, dc] of directions.king) {
          const nr = row + dr
          const nc = col + dc
          if (isEmpty(nr, nc) || isEnemy(nr, nc)) moves.push([nr, nc])
        }
        break
    }

    return moves
  }, [])

  // Handle square click
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameState.gameMode !== "playing") return

      const piece = gameState.board[row][col]

      if (gameState.selectedSquare) {
        const [selectedRow, selectedCol] = gameState.selectedSquare
        const selectedPiece = gameState.board[selectedRow][selectedCol]

        if (selectedPiece && gameState.validMoves.some(([r, c]) => r === row && c === col)) {
          // Make move
          const newBoard = gameState.board.map((r) => [...r])
          const capturedPiece = newBoard[row][col]

          // Add explosion effect if capturing
          if (capturedPiece) {
            const explosionPos: [number, number, number] = [(col - 3.5) * 0.5, 0.1, (row - 3.5) * 0.5]
            setExplosions((prev) => [...prev, { position: explosionPos, active: true }])
            setTimeout(() => {
              setExplosions((prev) => prev.map((exp, i) => (i === prev.length - 1 ? { ...exp, active: false } : exp)))
            }, 1000)
          }

          newBoard[row][col] = { ...selectedPiece, position: [row, col] }
          newBoard[selectedRow][selectedCol] = null

          setGameState((prev) => ({
            ...prev,
            board: newBoard,
            selectedSquare: null,
            validMoves: [],
            currentPlayer: prev.currentPlayer === "white" ? "black" : "white",
            capturedPieces: capturedPiece ? [...prev.capturedPieces, capturedPiece] : prev.capturedPieces,
          }))
        } else {
          setGameState((prev) => ({ ...prev, selectedSquare: null, validMoves: [] }))
        }
      } else if (piece && piece.color === gameState.currentPlayer) {
        const validMoves = getValidMoves(piece, gameState.board)
        setGameState((prev) => ({ ...prev, selectedSquare: [row, col], validMoves }))
      }
    },
    [gameState, getValidMoves],
  )

  const startGame = (vsComputer: boolean) => {
    setGameState({
      board: createBoard(),
      selectedSquare: null,
      validMoves: [],
      currentPlayer: "white",
      gameMode: "playing",
      vsComputer,
      moveHistory: [],
      winner: null,
      capturedPieces: [],
    })
  }

  const resetGame = () => {
    setGameState((prev) => ({ ...prev, gameMode: "menu" }))
    setExplosions([])
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
      {/* Close button */}
      <button
        onClick={onBack}
        className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
        aria-label="Close game"
      >
        <X size={20} />
      </button>

      {/* Game UI */}
      <div className="absolute top-4 left-4 z-10 text-white">
        <div className="bg-black/50 p-3 rounded-lg">
          <div className="text-sm">Current Player</div>
          <div className={`text-lg font-bold ${gameState.currentPlayer === "white" ? "text-white" : "text-gray-400"}`}>
            {gameState.currentPlayer === "white" ? "⚪ White" : "⚫ Black"}
          </div>
          <div className="text-xs mt-1">Captured: {gameState.capturedPieces.length}</div>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [5, 8, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, 10, -5]} intensity={0.5} />

        {gameState.gameMode === "playing" && (
          <ChessBoard3D
            board={gameState.board}
            selectedSquare={gameState.selectedSquare}
            validMoves={gameState.validMoves}
            onSquareClick={handleSquareClick}
            explosions={explosions}
          />
        )}

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} minDistance={3} maxDistance={12} />
      </Canvas>

      {/* Game Menu */}
      {gameState.gameMode === "menu" && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/90 p-8 rounded-lg border border-gray-700 text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-6">♟️ 3D Chess</h1>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
              >
                👥 Two Players
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(true)}
                className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
              >
                🤖 vs Computer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Game Over */}
      {gameState.gameMode === "gameover" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/90 p-8 rounded-lg border border-gray-700 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">🏆 Game Over!</h2>
            <p className="text-xl text-yellow-400 mb-6">{gameState.winner} Wins!</p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(gameState.vsComputer)}
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
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Chess3D
