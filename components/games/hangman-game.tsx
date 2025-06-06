"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { GameLoadingScreen } from "./game-loading-screen"
import { getCurrentLanguage } from "@/lib/i18n"

interface HangmanGameProps {
  onBack: () => void
  minimalUI?: boolean
}

// Palavras relacionadas ao Analysis & Learn
const CRYPTO_WORDS = [
  { word: "BLOCKCHAIN", category: "Technology" },
  { word: "CRYPTOCURRENCY", category: "Finance" },
  { word: "BITCOIN", category: "Currency" },
  { word: "ETHEREUM", category: "Platform" },
  { word: "WALLET", category: "Storage" },
  { word: "MINING", category: "Process" },
  { word: "TOKEN", category: "Asset" },
  { word: "DEFI", category: "Ecosystem" },
  { word: "STAKING", category: "Earning" },
  { word: "LEDGER", category: "Record" },
  { word: "ALTCOIN", category: "Currency" },
  { word: "EXCHANGE", category: "Platform" },
  { word: "LIQUIDITY", category: "Finance" },
  { word: "PROTOCOL", category: "Technology" },
  { word: "CONSENSUS", category: "Mechanism" },
  { word: "TOKENOMICS", category: "Economics" },
  { word: "YIELD", category: "Farming" },
  { word: "AIRDROP", category: "Distribution" },
  { word: "METAVERSE", category: "Virtual World" },
  { word: "NFT", category: "Digital Asset" },
]

const MAX_GUESSES = 6

export const HangmanGame = (props: HangmanGameProps) => {
  const { onBack } = props
  const [word, setWord] = useState("")
  const [category, setCategory] = useState("")
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadComplete = () => {
    setIsLoading(false)
  }

  // Start a new game
  const startGame = () => {
    const randomIndex = Math.floor(Math.random() * CRYPTO_WORDS.length)
    const { word, category } = CRYPTO_WORDS[randomIndex]
    setWord(word)
    setCategory(category)
    setGuessedLetters([])
    setWrongGuesses(0)
    setGameOver(false)
    setGameWon(false)
    setGameStarted(true)
  }

  // Check if the player has won
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const allLettersGuessed = word.split("").every((letter) => guessedLetters.includes(letter))
    if (allLettersGuessed) {
      setGameWon(true)
      setGameOver(true)
    }
  }, [word, guessedLetters, gameStarted, gameOver])

  // Handle letter guess
  const handleGuess = (letter: string) => {
    if (gameOver || guessedLetters.includes(letter)) return

    const newGuessedLetters = [...guessedLetters, letter]
    setGuessedLetters(newGuessedLetters)

    if (!word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)

      if (newWrongGuesses >= MAX_GUESSES) {
        setGameOver(true)
      }
    }
  }

  // Render the word with blanks for unguessed letters
  const renderWord = () => {
    return word.split("").map((letter, index) => (
      <div key={index} className="w-8 h-10 border-b-2 border-gray-400 mx-1 flex items-center justify-center">
        <span className="text-xl font-bold">{guessedLetters.includes(letter) || gameOver ? letter : ""}</span>
      </div>
    ))
  }

  // Render the keyboard
  const renderKeyboard = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={guessedLetters.includes(letter) || gameOver}
            className={`w-8 h-8 rounded-md flex items-center justify-center font-medium text-sm
              ${
                guessedLetters.includes(letter)
                  ? word.includes(letter)
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              } ${guessedLetters.includes(letter) || gameOver ? "opacity-70" : ""}`}
          >
            {letter}
          </button>
        ))}
      </div>
    )
  }

  // Render the hangman figure - SIMPLIFICADO
  const renderHangman = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto mb-4">
        {/* Base */}
        <line x1="40" y1="180" x2="160" y2="180" stroke="gray" strokeWidth="4" />

        {/* Pole */}
        <line x1="60" y1="20" x2="60" y2="180" stroke="gray" strokeWidth="4" />

        {/* Top */}
        <line x1="60" y1="20" x2="140" y2="20" stroke="gray" strokeWidth="4" />

        {/* Rope */}
        <line x1="140" y1="20" x2="140" y2="40" stroke="gray" strokeWidth="4" />

        {/* Head */}
        {wrongGuesses >= 1 && <circle cx="140" cy="55" r="15" stroke="gray" strokeWidth="4" fill="transparent" />}

        {/* Body */}
        {wrongGuesses >= 2 && <line x1="140" y1="70" x2="140" y2="120" stroke="gray" strokeWidth="4" />}

        {/* Left Arm */}
        {wrongGuesses >= 3 && <line x1="140" y1="80" x2="120" y2="100" stroke="gray" strokeWidth="4" />}

        {/* Right Arm */}
        {wrongGuesses >= 4 && <line x1="140" y1="80" x2="160" y2="100" stroke="gray" strokeWidth="4" />}

        {/* Left Leg */}
        {wrongGuesses >= 5 && <line x1="140" y1="120" x2="120" y2="150" stroke="gray" strokeWidth="4" />}

        {/* Right Leg */}
        {wrongGuesses >= 6 && <line x1="140" y1="120" x2="160" y2="150" stroke="gray" strokeWidth="4" />}
      </svg>
    )
  }

  // Função para lidar com o clique no botão de fechar
  const handleClose = () => {
    // Chamar a função onBack para voltar à página anterior
    onBack()
  }

  return (
    <>
      {isLoading && (
        <GameLoadingScreen onLoadComplete={handleLoadComplete} gameName="Hangman" gameImage="/hangman-game.png" />
      )}
      <div className="w-full flex flex-col items-center relative">
        {/* Botão de fechar (X) no canto superior direito - sempre visível */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
          aria-label="Close game"
        >
          <X size={20} />
        </button>

        {!props.minimalUI && (
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold metallic-title">Crypto Hangman</h2>
            <p className="text-sm text-gray-300">Guess the crypto term before you run out of attempts</p>
          </div>
        )}

        {!gameStarted ? (
          <div className="flex flex-col items-center justify-center p-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
            >
              {getCurrentLanguage() === "pt" ? "Iniciar Jogo" : "Start Game"}
            </motion.button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-black rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between mb-2">
              <div className="text-sm">
                <span className="text-gray-400">Category: </span>
                <span className="font-bold text-blue-400">{category}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Guesses Left: </span>
                <span className={`font-bold ${wrongGuesses >= MAX_GUESSES - 2 ? "text-red-500" : "text-green-500"}`}>
                  {MAX_GUESSES - wrongGuesses}
                </span>
              </div>
            </div>

            {renderHangman()}

            <div className="flex flex-wrap justify-center my-4">{renderWord()}</div>

            {gameOver ? (
              <div className="text-center mb-4">
                <h3 className={`text-xl font-bold ${gameWon ? "text-green-500" : "text-red-500"} mb-2`}>
                  {gameWon ? "You Won!" : "You Lost!"}
                </h3>
                {!gameWon && (
                  <p className="mb-2">
                    <span className="text-gray-300">Word to Guess: </span>
                    <span className="font-bold text-yellow-400">{word}</span>
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                >
                  {getCurrentLanguage() === "pt" ? "Jogar Novamente" : "Play Again"}
                </motion.button>
              </div>
            ) : (
              renderKeyboard()
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default HangmanGame
