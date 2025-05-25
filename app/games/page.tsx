"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { DuckHuntGame } from "@/components/games/duck-hunt-game"
import { HangmanGame } from "@/components/games/hangman-game"
import { SnakeGame } from "@/components/games/snake-game"
import { Chess3D } from "@/components/games/chess-3d"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { FlappyBird } from "@/components/games/flappy-bird"

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [showGameInfo, setShowGameInfo] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState(getCurrentLanguage())
  const [translations, setTranslations] = useState(getTranslations(language).games || {})

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang).games || {})
    }

    // Definir traduções iniciais
    setTranslations(getTranslations(language).games || {})

    // Adicionar listener para mudanças de idioma
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Dados dos jogos
  const games = [
    {
      id: 1,
      title: "Duck Hunt",
      icon: "🦆",
      image: "/duck-hunt-game.png",
      component: DuckHuntGame,
      instructions: {
        en: "Tap or click to shoot the ducks before they escape. Each round gets progressively harder with more ducks and faster movement.",
        pt: "Toque ou clique para atirar nos patos antes que eles escapem. Cada rodada fica progressivamente mais difícil com mais patos e movimento mais rápido.",
      },
      controls: {
        en: "Tap/click on ducks to shoot them",
        pt: "Toque/clique nos patos para atirar neles",
      },
    },
    {
      id: 2,
      title: "Snake",
      icon: "🐍",
      image: "/snake-game.png",
      component: SnakeGame,
      instructions: {
        en: "Control the snake to collect TPF tokens and grow longer. Avoid hitting the walls or your own tail.",
        pt: "Controle a cobra para coletar tokens TPF e crescer. Evite bater nas paredes ou na sua própria cauda.",
      },
      controls: {
        en: "Swipe to change direction. On desktop, use arrow keys.",
        pt: "Deslize para mudar de direção. No desktop, use as teclas de seta.",
      },
    },
    {
      id: 3,
      title: "Hangman",
      icon: "📝",
      image: "/hangman-game.png",
      component: HangmanGame,
      instructions: {
        en: "Guess the crypto-related word before the hangman is complete. Each wrong guess adds a part to the hangman.",
        pt: "Adivinhe la palabra relacionada a la criptomoneda antes de que el ahorcado esté completo. Cada suposición incorrecta agrega una parte al ahorcado.",
      },
      controls: {
        en: "Tap on letters to make your guess",
        pt: "Toque nas letras para fazer seu palpite",
      },
    },
    {
      id: 4,
      title: "Chess 3D",
      icon: "♟️",
      image: "/chess-icon.svg",
      component: Chess3D,
      instructions: {
        en: "Play chess against yourself or a friend in stunning 3D. Click on pieces to select them, then click on valid squares to move.",
        pt: "Jogue xadrez contra você mesmo ou um amigo em 3D impressionante. Clique nas peças para selecioná-las, depois clique em quadrados válidos para mover.",
      },
      controls: {
        en: "Click on pieces to select and move them. Rotate the camera with mouse/touch.",
        pt: "Clique nas peças para selecioná-las e movê-las. Gire a câmera com mouse/toque.",
      },
    },
    {
      id: 5,
      title: "Flappy Bird",
      icon: "🐦",
      image: "/flappy-bird-game.png",
      component: FlappyBird,
      instructions: {
        en: "Tap or press space to make the bird fly. Avoid the pipes and try to get the highest score possible. The game gets faster as you score more points!",
        pt: "Toque ou pressione espaço para fazer o pássaro voar. Evite os canos e tente conseguir a maior pontuação possível. O jogo fica mais rápido conforme você pontua!",
      },
      controls: {
        en: "Tap screen or press Space to fly",
        pt: "Toque na tela ou pressione Espaço para voar",
      },
    },
  ]

  // Selecionar um jogo para ver informações
  const handleSelectGame = (gameId: number) => {
    setSelectedGame(gameId)
    setShowGameInfo(true)
    setIsPlaying(false)
  }

  // Iniciar o jogo
  const handlePlayGame = () => {
    setIsLoading(true)
    setShowGameInfo(false)

    // Simular tempo de carregamento
    setTimeout(() => {
      setIsLoading(false)
      setIsPlaying(true)
    }, 1500)
  }

  // Voltar para a lista de jogos
  const handleBackToGames = () => {
    setSelectedGame(null)
    setShowGameInfo(false)
    setIsPlaying(false)
  }

  // Renderizar o jogo selecionado
  const renderSelectedGame = () => {
    const game = games.find((g) => g.id === selectedGame)
    if (!game || !game.component) return null

    const GameComponent = game.component
    return <GameComponent onBack={handleBackToGames} minimalUI={true} />
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <BackgroundEffect />

      <div className="container mx-auto px-4 pt-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Lista de jogos */}
          {!selectedGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectGame(game.id)}
                  className="flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-4 cursor-pointer border border-gray-800/50"
                >
                  <div className="text-3xl mb-2">{game.icon}</div>
                  <span className="text-xs text-center">{game.title}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Informações do jogo */}
          {selectedGame && showGameInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/70 rounded-lg p-4 border border-gray-800/50"
            >
              {(() => {
                const game = games.find((g) => g.id === selectedGame)
                if (!game) return null

                return (
                  <>
                    <div className="flex items-center mb-4">
                      <button
                        onClick={handleBackToGames}
                        className="mr-2 p-1 rounded-full bg-gray-800 hover:bg-gray-700"
                      >
                        ←
                      </button>
                      <h2 className="text-xl font-bold">{game.title}</h2>
                    </div>

                    <div className="mb-4 aspect-video rounded-lg overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-1">
                        {language === "pt" ? "Instruções:" : "Instructions:"}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {language === "pt" ? game.instructions.pt : game.instructions.en}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold mb-1">{language === "pt" ? "Controles:" : "Controls:"}</h3>
                      <p className="text-sm text-gray-300">{language === "pt" ? game.controls.pt : game.controls.en}</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePlayGame}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                    >
                      {language === "pt" ? "Jogar" : "Play"}
                    </motion.button>
                  </>
                )
              })()}
            </motion.div>
          )}

          {/* Tela de carregamento */}
          {selectedGame && isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="w-full max-w-md bg-gray-900/70 rounded-lg p-6 border border-gray-800/50">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold mb-4">{language === "pt" ? "Carregando..." : "Loading..."}</h3>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5 }}
                    className="bg-blue-600 h-2.5 rounded-full"
                  />
                </div>

                <div className="text-center text-xs text-gray-400">
                  {language === "pt" ? "Desenvolvido por TPulseFi" : "Developed by TPulseFi"}
                </div>
              </div>
            </motion.div>
          )}

          {/* Jogo */}
          {selectedGame && isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black rounded-lg overflow-hidden"
            >
              {renderSelectedGame()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav activeTab="games" />
    </main>
  )
}
