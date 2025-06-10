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
import { TetrisGame } from "@/components/games/tetris-game"
import { Play, ArrowLeft, Star, Trophy, Users, Clock, Gamepad2, Sparkles } from "lucide-react"

export default function GamesPage() {
  const [showGameInfo, setShowGameInfo] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState(getCurrentLanguage())
  const [translations, setTranslations] = useState(getTranslations(language).games || {})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang).games || {})
    }

    setTranslations(getTranslations(language).games || {})
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const gameCategories = [
    {
      id: "action",
      name: { en: "Action", pt: "Ação" },
      icon: "⚡",
      gradient: "from-red-500 via-orange-500 to-yellow-500",
      bgPattern: "bg-gradient-to-br from-red-500/10 via-orange-500/5 to-yellow-500/10",
      description: { en: "Fast-paced games", pt: "Jogos de ritmo acelerado" },
      games: [
        {
          id: 1,
          title: "Duck Hunt",
          icon: "🦆",
          image: "/duck-hunt-game.png",
          component: DuckHuntGame,
          rating: 4.8,
          players: "1.2k",
          difficulty: "Medium",
          duration: "5-10 min",
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
          id: 5,
          title: "Flappy Bird",
          icon: "🐦",
          image: "/flappy-bird-game.png",
          component: FlappyBird,
          rating: 4.5,
          players: "2.1k",
          difficulty: "Hard",
          duration: "2-5 min",
          instructions: {
            en: "Tap or press space to make the bird fly. Avoid the pipes and try to get the highest score possible. The game gets faster as you score more points!",
            pt: "Toque ou pressione espaço para fazer o pássaro voar. Evite os canos e tente conseguir a maior pontuação possível. O jogo fica mais rápido conforme você pontua!",
          },
          controls: {
            en: "Tap screen or press Space to fly",
            pt: "Toque na tela ou pressione Espaço para voar",
          },
        },
      ],
    },
    {
      id: "puzzle",
      name: { en: "Puzzle", pt: "Quebra-cabeça" },
      icon: "🧩",
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      bgPattern: "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-rose-500/10",
      description: { en: "Mind-bending challenges", pt: "Desafios mentais" },
      games: [
        {
          id: 6,
          title: "Tetris",
          icon: "🧩",
          image: "/tetris-game.png",
          component: TetrisGame,
          rating: 4.9,
          players: "3.5k",
          difficulty: "Medium",
          duration: "10-30 min",
          instructions: {
            en: "Stack falling blocks to complete horizontal lines. Tap to rotate pieces and drag to move them. Clear lines to score points and level up!",
            pt: "Empilhe blocos que caem para completar linhas horizontais. Toque para rotacionar peças e arraste para movê-las. Limpe linhas para pontuar e subir de nível!",
          },
          controls: {
            en: "Tap to rotate, drag horizontally to move, drag down to drop faster",
            pt: "Toque para rotacionar, arraste horizontalmente para mover, arraste para baixo para acelerar",
          },
        },
      ],
    },
    {
      id: "strategy",
      name: { en: "Strategy", pt: "Estratégia" },
      icon: "♟️",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgPattern: "bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10",
      description: { en: "Think ahead to win", pt: "Pense à frente para vencer" },
      games: [
        {
          id: 4,
          title: "Chess 3D",
          icon: "♟️",
          image: "/chess-icon.svg",
          component: Chess3D,
          rating: 4.7,
          players: "890",
          difficulty: "Expert",
          duration: "15-60 min",
          instructions: {
            en: "Play chess against yourself or a friend in stunning 3D. Click on pieces to select them, then click on valid squares to move.",
            pt: "Jogue xadrez contra você mesmo ou um amigo em 3D impressionante. Clique nas peças para selecioná-las, depois clique em quadrados válidos para mover.",
          },
          controls: {
            en: "Click on pieces to select and move them. Rotate the camera with mouse/touch.",
            pt: "Clique nas peças para selecioná-las e movê-las. Gire a câmera com mouse/toque.",
          },
        },
      ],
    },
    {
      id: "classic",
      name: { en: "Classic", pt: "Clássicos" },
      icon: "🕹️",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgPattern: "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10",
      description: { en: "Timeless favorites", pt: "Favoritos atemporais" },
      games: [
        {
          id: 2,
          title: "Snake",
          icon: "🐍",
          image: "/snake-game.png",
          component: SnakeGame,
          rating: 4.6,
          players: "1.8k",
          difficulty: "Easy",
          duration: "5-15 min",
          instructions: {
            en: "Control the snake to collect TPF tokens and grow longer. Avoid hitting the walls or your own tail.",
            pt: "Controle a cobra para coletar tokens TPF e crescer. Evite bater nas paredes ou na sua própria cauda.",
          },
          controls: {
            en: "Swipe to change direction. On desktop, use arrow keys.",
            pt: "Deslize para mudar de direção. No desktop, use as teclas de seta.",
          },
        },
      ],
    },
    {
      id: "word",
      name: { en: "Word Games", pt: "Jogos de Palavras" },
      icon: "📝",
      gradient: "from-yellow-500 via-amber-500 to-orange-500",
      bgPattern: "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10",
      description: { en: "Test your vocabulary", pt: "Teste seu vocabulário" },
      games: [
        {
          id: 3,
          title: "Hangman",
          icon: "📝",
          image: "/hangman-game.png",
          component: HangmanGame,
          rating: 4.4,
          players: "950",
          difficulty: "Medium",
          duration: "3-8 min",
          instructions: {
            en: "Guess the crypto-related word before the hangman is complete. Each wrong guess adds a part to the hangman.",
            pt: "Adivinhe a palavra relacionada a criptomoeda antes que o enforcado esteja completo. Cada palpite errado adiciona uma parte ao enforcado.",
          },
          controls: {
            en: "Tap on letters to make your guess",
            pt: "Toque nas letras para fazer seu palpite",
          },
        },
      ],
    },
  ]

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedGame(null)
    setShowGameInfo(false)
    setIsPlaying(false)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setSelectedGame(null)
    setShowGameInfo(false)
    setIsPlaying(false)
  }

  const handleSelectGame = (gameId: number) => {
    setSelectedGame(gameId)
    setShowGameInfo(true)
    setIsPlaying(false)
  }

  const handlePlayGame = () => {
    setIsLoading(true)
    setShowGameInfo(false)
    setLoadingProgress(0)

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsLoading(false)
            setIsPlaying(true)
          }, 300)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)
  }

  const handleBackToGames = () => {
    setSelectedGame(null)
    setShowGameInfo(false)
    setIsPlaying(false)
  }

  const renderSelectedGame = () => {
    if (!selectedCategory || !selectedGame) return null

    const category = gameCategories.find((cat) => cat.id === selectedCategory)
    if (!category) return null

    const game = category.games.find((g) => g.id === selectedGame)
    if (!game || !game.component) return null

    const GameComponent = game.component
    return <GameComponent onBack={handleBackToGames} minimalUI={true} />
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "hard":
        return "text-orange-400"
      case "expert":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <BackgroundEffect />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 pt-6 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          {/* Header com logo e título */}
          {!selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 mb-4"
              >
                <div className="relative">
                  <Gamepad2 className="w-8 h-8 text-blue-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  FiGames
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-lg"
              >
                {language === "pt" ? "Descubra jogos incríveis" : "Discover amazing games"}
              </motion.p>
            </motion.div>
          )}

          {/* Lista de categorias */}
          {!selectedCategory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {gameCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCategory(category.id)}
                    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer ${category.bgPattern} backdrop-blur-sm border border-white/10 group`}
                  >
                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />

                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      initial={false}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className="text-5xl filter drop-shadow-lg">
                          {category.icon}
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold mb-1">
                            {language === "pt" ? category.name.pt : category.name.en}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            {language === "pt" ? category.description.pt : category.description.en}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" />
                              {category.games.length}{" "}
                              {category.games.length === 1
                                ? language === "pt"
                                  ? "jogo"
                                  : "game"
                                : language === "pt"
                                  ? "jogos"
                                  : "games"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="text-2xl text-gray-400 group-hover:text-white transition-colors"
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lista de jogos da categoria */}
          {selectedCategory && !selectedGame && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {(() => {
                const category = gameCategories.find((cat) => cat.id === selectedCategory)
                if (!category) return null

                return (
                  <>
                    <div className="flex items-center mb-8">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleBackToCategories}
                        className="mr-4 p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </motion.button>
                      <div>
                        <h2 className="text-3xl font-bold mb-1">
                          {language === "pt" ? category.name.pt : category.name.en}
                        </h2>
                        <p className="text-gray-400">
                          {category.games.length}{" "}
                          {category.games.length === 1
                            ? language === "pt"
                              ? "jogo disponível"
                              : "game available"
                            : language === "pt"
                              ? "jogos disponíveis"
                              : "games available"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {category.games.map((game, index) => (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectGame(game.id)}
                          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 cursor-pointer border border-white/10 group overflow-hidden relative"
                        >
                          {/* Gradient overlay */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                          />

                          <div className="relative z-10 flex items-center space-x-6">
                            <motion.div
                              whileHover={{ rotate: 5, scale: 1.1 }}
                              className="text-6xl filter drop-shadow-lg"
                            >
                              {game.icon}
                            </motion.div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium">{game.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm">{game.players}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-green-400" />
                                  <span className="text-sm">{game.duration}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${getDifficultyColor(game.difficulty)}`}>
                                  {game.difficulty}
                                </span>
                                <motion.div
                                  whileHover={{ x: 5 }}
                                  className="text-gray-400 group-hover:text-white transition-colors"
                                >
                                  <Play className="w-5 h-5" />
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </motion.div>
          )}

          {/* Informações do jogo */}
          {selectedCategory && selectedGame && showGameInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              {(() => {
                const category = gameCategories.find((cat) => cat.id === selectedCategory)
                if (!category) return null

                const game = category.games.find((g) => g.id === selectedGame)
                if (!game) return null

                return (
                  <>
                    <div className="flex items-center mb-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleBackToGames}
                        className="mr-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </motion.button>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{game.icon}</div>
                        <div>
                          <h2 className="text-2xl font-bold">{game.title}</h2>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm">{game.rating}</span>
                            </div>
                            <span className={`text-sm ${getDifficultyColor(game.difficulty)}`}>{game.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-gray-800/50">
                      <img
                        src={game.image || "/placeholder.svg?height=300&width=500&query=game screenshot"}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          {language === "pt" ? "Como Jogar" : "How to Play"}
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          {language === "pt" ? game.instructions.pt : game.instructions.en}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Gamepad2 className="w-5 h-5 text-blue-400" />
                          {language === "pt" ? "Controles" : "Controls"}
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          {language === "pt" ? game.controls.pt : game.controls.en}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePlayGame}
                      className={`w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r ${category.gradient} hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-3`}
                    >
                      <Play className="w-6 h-6 fill-current" />
                      {language === "pt" ? "Jogar Agora" : "Play Now"}
                    </motion.button>
                  </>
                )
              })()}
            </motion.div>
          )}

          {/* Tela de carregamento aprimorada */}
          {selectedGame && isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="inline-block mb-4"
                  >
                    <Gamepad2 className="w-12 h-12 text-blue-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === "pt" ? "Carregando Jogo..." : "Loading Game..."}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {language === "pt" ? "Preparando a diversão" : "Preparing the fun"}
                  </p>
                </div>

                <div className="relative w-full bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full relative"
                    style={{ width: `${loadingProgress}%` }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </motion.div>
                </div>

                <div className="text-center text-sm text-gray-400">
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {Math.round(loadingProgress)}%
                  </motion.span>
                </div>

                <div className="text-center text-xs text-gray-500 mt-4">
                  {language === "pt" ? "Desenvolvido por TPulseFi" : "Developed by TPulseFi"}
                </div>
              </div>
            </motion.div>
          )}

          {/* Jogo */}
          {selectedGame && isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black rounded-2xl overflow-hidden border border-white/10"
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
