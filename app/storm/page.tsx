"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface FloatingWord {
  id: string
  text: string
  x: number
  y: number
  color: string
  createdAt: number
}

export default function StormPage() {
  const [word, setWord] = useState("")
  const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))

  // Cores vibrantes para as palavras
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ]

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()))
    }

    handleLanguageChange()
    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  // Buscar palavras do servidor a cada 2 segundos
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/api/storm/words")
        const data = await response.json()

        if (data.words && Array.isArray(data.words)) {
          // Converter palavras do servidor para formato local - dentro da janela
          const serverWords = data.words.map((serverWord: any) => {
            // Posição dentro da janela transparente (coordenadas percentuais) - com mais margem
            const x = 25 + Math.random() * 50 // 25% a 75% da largura da janela (era 20-80%)
            const y = 25 + Math.random() * 50 // 25% a 75% da altura da janela (era 20-80%)

            return {
              id: serverWord.id,
              text: serverWord.text,
              x: x,
              y: y,
              color: serverWord.color,
              createdAt: serverWord.timestamp,
            }
          })

          setFloatingWords(serverWords)
        }
      } catch (error) {
        console.error("Erro ao buscar palavras:", error)
      }
    }

    // Buscar imediatamente
    fetchWords()

    // Buscar a cada 2 segundos
    const interval = setInterval(fetchWords, 2000)
    return () => clearInterval(interval)
  }, [])

  // Remover palavras após 10 segundos (localmente)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setFloatingWords((prev) => prev.filter((word) => now - word.createdAt < 10000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const publishWord = async () => {
    if (!word.trim() || isPublishing) return

    setIsPublishing(true)

    try {
      const color = getRandomColor()

      // Enviar para o servidor
      const response = await fetch("/api/storm/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: word.trim(),
          color,
        }),
      })

      if (response.ok) {
        setWord("")
        // Não adicionar palavra localmente - deixar apenas o servidor gerenciar
      }
    } catch (error) {
      console.error("Erro ao publicar palavra:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      publishWord()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header - Fixed at top */}
      <motion.div
        className="absolute top-8 left-0 right-0 text-center z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center space-x-3 mb-2">
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ {translations.storm?.title || "Storm"}
          </h1>
          {floatingWords.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-1 bg-blue-600/20 backdrop-blur-sm rounded-full px-3 py-1 border border-blue-500/30"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">{floatingWords.length}</span>
            </motion.div>
          )}
        </div>
        <p className="text-gray-300 text-sm">
          {translations.storm?.subtitle || "Publique palavras que aparecem na tela por alguns segundos"}
        </p>
      </motion.div>

      {/* Transparent Window - Between header and input */}
      <motion.div
        className="absolute top-32 left-4 right-4 bottom-40 z-15"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="w-full h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Floating Words - Inside transparent window */}
          <AnimatePresence>
            {floatingWords.map((floatingWord) => (
              <motion.div
                key={floatingWord.id}
                initial={{
                  opacity: 0,
                  scale: 0,
                  left: `${floatingWord.x}%`,
                  top: `${floatingWord.y}%`,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  left: `${floatingWord.x + (Math.random() - 0.5) * 5}%`, // Reduzir movimento de 10% para 5%
                  top: `${floatingWord.y - 3}%`, // Reduzir movimento de 5% para 3%
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  top: `${floatingWord.y - 10}%`, // Reduzir movimento de 15% para 10%
                }}
                transition={{
                  duration: 10,
                  ease: "easeOut",
                }}
                className="absolute pointer-events-none z-20 max-w-[90%]" // Adicionar max-width
                style={{
                  color: floatingWord.color,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="text-3xl md:text-5xl font-bold drop-shadow-lg text-center break-words" // Reduzir tamanho e adicionar break-words
                  style={{
                    textShadow: `0 0 20px ${floatingWord.color}40, 0 0 40px ${floatingWord.color}20`,
                    filter: "brightness(1.2)",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {floatingWord.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content - Positioned at bottom - Compacted */}
      <div className="absolute bottom-0 left-0 right-0 z-20 max-w-sm mx-auto px-4 pb-24">
        {/* Storm Card - Compacted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 backdrop-blur-md border-gray-700/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder={translations.storm?.placeholder || "Digite uma palavra..."}
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 flex-1"
                    maxLength={20}
                    disabled={isPublishing}
                  />
                  <Button
                    onClick={publishWord}
                    disabled={!word.trim() || isPublishing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 transition-all duration-300 disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "⚡"
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-400 text-right">{word.length}/20</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Status - Compacted */}
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-green-600/20 backdrop-blur-sm rounded-full px-3 py-1 border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs">Online</span>
          </div>
        </motion.div>
      </div>

      <BottomNav activeTab="storm" />
    </div>
  )
}
