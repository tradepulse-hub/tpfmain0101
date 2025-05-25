"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
            else {
              if (isEnemy(nr, nc)) moves.push([nr, nc])
              break
            }
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

  // Check for game over
  const checkGameOver = useCallback(
    (board: (ChessPiece | null)[][], currentPlayer: PieceColor) => {
      const pieces = board.flat().filter((p) => p && p.color === currentPlayer)
      const king = pieces.find((p) => p!.type === "king")

      if (!king) {
        return currentPlayer === "white" ? "black" : "white"
      }

      // Check if player has any valid moves
      for (const piece of pieces) {
        if (piece && getValidMoves(piece, board).length > 0) {
          return null
        }
      }

      return currentPlayer === "white" ? "black" : "white"
    },
    [getValidMoves],
  )

  // Computer AI
  const makeComputerMove = useCallback(() => {
    const pieces = gameState.board.flat().filter((p) => p && p.color === "black")
    let bestMove: { piece: ChessPiece; to: [number, number] } | null = null
    let bestScore = -999

    for (const piece of pieces) {
      if (!piece) continue
      const moves = getValidMoves(piece, gameState.board)
      for (const move of moves) {
        let score = Math.random() * 5
        const target = gameState.board[move[0]][move[1]]
        if (target) {
          const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 }
          score += values[target.type] * 10
        }
        if (score > bestScore) {
          bestScore = score
          bestMove = { piece, to: move }
        }
      }
    }

    if (bestMove) {
      setTimeout(() => handleMove(bestMove.piece, bestMove.to), 600)
    }
  }, [gameState, getValidMoves])

  // Handle move with explosion effect
  const handleMove = useCallback(
    (piece: ChessPiece, to: [number, number]) => {
      setGameState((prev) => {
        const newBoard = prev.board.map((row) => [...row])
        const [fromRow, fromCol] = piece.position
        const [toRow, toCol] = to

        const capturedPiece = newBoard[toRow][toCol]

        // Add explosion effect if piece captured
        if (capturedPiece) {
          const explosionPos: [number, number, number] = [(toCol - 3.5) * 0.5, 0.1, (toRow - 3.5) * 0.5]
          setExplosions((prev) => [...prev, { position: explosionPos, active: true }])
          setTimeout(() => {
            setExplosions((prev) => prev.map((exp, i) => (i === prev.length - 1 ? { ...exp, active: false } : exp)))
          }, 1000)
        }

        newBoard[fromRow][fromCol] = null
        newBoard[toRow][toCol] = { ...piece, position: [toRow, toCol] }

        const nextPlayer = prev.currentPlayer === "white" ? "black" : "white"
        const winner = checkGameOver(newBoard, nextPlayer)
        const newCapturedPieces = capturedPiece ? [...prev.capturedPieces, capturedPiece] : prev.capturedPieces

        return {
          ...prev,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedSquare: null,
          validMoves: [],
          capturedPieces: newCapturedPieces,
          moveHistory: [...prev.moveHistory, `${piece.type} to ${String.fromCharCode(97 + toCol)}${8 - toRow}`],
          winner,
          gameMode: winner ? "gameover" : "playing",
        }
      })
    },
    [checkGameOver],
  )

  // Handle click
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameState.gameMode !== "playing") return
      if (gameState.vsComputer && gameState.currentPlayer === "black") return

      const piece = gameState.board[row][col]

      if (gameState.selectedSquare) {
        const [sr, sc] = gameState.selectedSquare
        const selectedPiece = gameState.board[sr][sc]
        const isValidMove = gameState.validMoves.some(([r, c]) => r === row && c === col)

        if (isValidMove && selectedPiece) {
          handleMove(selectedPiece, [row, col])
        } else {
          setGameState((prev) => ({ ...prev, selectedSquare: null, validMoves: [] }))
        }
      } else if (piece && piece.color === gameState.currentPlayer) {
        const moves = getValidMoves(piece, gameState.board)
        setGameState((prev) => ({ ...prev, selectedSquare: [row, col], validMoves: moves }))
      }
    },
    [gameState, getValidMoves, handleMove],
  )

  // Computer move effect
  useEffect(() => {
    if (gameState.vsComputer && gameState.currentPlayer === "black" && gameState.gameMode === "playing") {
      makeComputerMove()
    }
  }, [gameState.currentPlayer, gameState.vsComputer, gameState.gameMode, makeComputerMove])

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
    setExplosions([])
  }

  const playAgain = () => {
    startGame(gameState.vsComputer)
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 relative">
      {/* Menu */}
      {gameState.gameMode === "menu" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl text-center max-w-sm mx-4">
            <h1 className="text-3xl font-bold text-amber-800 mb-4">♟️ Chess 3D</h1>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                👥 Player vs Player
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                🤖 vs Computer
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.gameMode === "gameover" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-8 rounded-xl text-center max-w-sm mx-4">
            <h1 className="text-4xl font-bold mb-4">
              {gameState.winner === "white" ? "🎉" : gameState.winner === "black" ? "😔" : "🤝"}
            </h1>
            <h2 className="text-2xl font-bold mb-2">
              {gameState.winner === "white" && !gameState.vsComputer && "White Wins!"}
              {gameState.winner === "black" && !gameState.vsComputer && "Black Wins!"}
              {gameState.winner === "white" && gameState.vsComputer && "You Win!"}
              {gameState.winner === "black" && gameState.vsComputer && "Computer Wins!"}
            </h2>
            <p className="text-gray-600 mb-6">
              Captured {gameState.capturedPieces.length} pieces in {gameState.moveHistory.length} moves
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playAgain}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                🔄 Play Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState((prev) => ({ ...prev, gameMode: "menu" }))}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                📋 Main Menu
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Game UI */}
      {gameState.gameMode === "playing" && (
        <>
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-sm"
            >
              ← Back
            </motion.button>

            <div className="text-center text-white">
              <h1 className="text-lg font-bold">Chess 3D</h1>
              <p className="text-xs">{gameState.vsComputer ? "vs Computer" : "vs Player"}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameState((prev) => ({ ...prev, gameMode: "menu" }))}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Menu
            </motion.button>
          </div>
          {/* Botão de fechar (X) no canto superior direito - sempre visível */}
          <button
            onClick={onBack}
            className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
            aria-label="Close game"
          >
            <X size={20} />
          </button>
        </>
      )}

      {/* Compact 3D Scene */}
      <Canvas camera={{ position: [0, 5, 3], fov: 65 }} className="w-full h-full">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 3]} intensity={1} castShadow />

        <ChessBoard3D
          board={gameState.board}
          selectedSquare={gameState.selectedSquare}
          validMoves={gameState.validMoves}
          onSquareClick={handleSquareClick}
          explosions={explosions}
        />

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.8} minDistance={3} maxDistance={8} />
      </Canvas>
    </div>
  )
}
