"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { MiniKit } from "@worldcoin/minikit-js"
import { ethers } from "ethers"
import Image from "next/image"
import { toast } from "sonner"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Endereço da carteira morta (burn address)
const DEAD_WALLET = "0x000000000000000000000000000000000000dEaD"

// ABI simplificado para tokens ERC20 (apenas para a função transfer)
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// Endereço do contrato TPF
const TPF_CONTRACT_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

export default function FurnacePage() {
  const [amount, setAmount] = useState<string>("0")
  const [isBurning, setIsBurning] = useState(false)
  const [burnComplete, setBurnComplete] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [doorOpen, setDoorOpen] = useState(false)
  const [tokenPosition, setTokenPosition] = useState({ x: 0, y: 0 })
  const [fireIntensity, setFireIntensity] = useState(1)
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null)
  const [totalBurned, setTotalBurned] = useState<string>("0")
  const furnaceRef = useRef<HTMLDivElement>(null)
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()))
    }

    // Inicializar traduções
    handleLanguageChange()

    // Adicionar listener para mudanças de idioma
    window.addEventListener("languageChange", handleLanguageChange)

    // Limpar listener ao desmontar
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Efeito para aumentar a intensidade do fogo quando a porta está aberta
  useEffect(() => {
    if (doorOpen) {
      const timer = setTimeout(() => {
        setFireIntensity(2)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setFireIntensity(1)
    }
  }, [doorOpen])

  // Carregar total queimado do localStorage
  useEffect(() => {
    const savedTotal = localStorage.getItem("tpf_total_burned")
    if (savedTotal) {
      setTotalBurned(savedTotal)
    }
  }, [])

  // Função para enviar tokens para a carteira morta
  const sendTokensToBurnAddress = async (amountToBurn: string) => {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit não está instalado")
      }

      // Verificar se o valor é válido
      const burnAmount = Number.parseFloat(amountToBurn)
      if (isNaN(burnAmount) || burnAmount <= 0) {
        throw new Error("Valor inválido para queima")
      }

      // Converter o valor para wei (18 casas decimais)
      const amountInWei = ethers.parseUnits(amountToBurn, 18).toString()

      console.log("Enviando", amountToBurn, "TPF para queima")
      console.log("Endereço da carteira morta:", DEAD_WALLET)
      console.log("Valor em wei:", amountInWei)

      // Enviar a transação usando o MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: TPF_CONTRACT_ADDRESS,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [DEAD_WALLET, amountInWei],
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.message || "Falha no envio da transação")
      }

      console.log("Transação enviada com sucesso:", finalPayload)

      // Atualizar o hash da transação
      setBurnTxHash(finalPayload.transaction_id)

      // Atualizar o total queimado
      const newTotal = (Number.parseFloat(totalBurned) + burnAmount).toString()
      setTotalBurned(newTotal)
      localStorage.setItem("tpf_total_burned", newTotal)

      return {
        success: true,
        txHash: finalPayload.transaction_id,
      }
    } catch (error) {
      console.error("Erro ao queimar tokens:", error)
      throw error
    }
  }

  // Simular o processo de queima
  const handleBurn = async () => {
    if (Number(amount) <= 0 || isBurning || !doorOpen) return

    // Iniciar a animação
    setIsBurning(true)

    // Calcular a posição para onde o token deve se mover
    if (furnaceRef.current) {
      const rect = furnaceRef.current.getBoundingClientRect()
      setTokenPosition({
        x: rect.width / 2,
        y: rect.height / 2 - 20,
      })
    }

    try {
      // Enviar a transação para a carteira morta
      const result = await sendTokensToBurnAddress(amount)

      // Aumentar o fogo quando o token é queimado
      setFireIntensity(3)

      // Aguardar a animação de queima
      setTimeout(() => {
        setIsBurning(false)
        setBurnComplete(true)

        // Mostrar notificação de sucesso
        toast.success(`${amount} TPF ${translations.furnace?.burnCompleted || "queimados com sucesso!"}`, {
          description: `${translations.furnace?.lastTransaction || "Hash da transação"}: ${result.txHash.substring(0, 10)}...`,
          action: {
            label: translations.sendToken?.viewTx || "Ver TX",
            onClick: () => window.open(`https://worldscan.org/tx/${result.txHash}`, "_blank"),
          },
        })

        // Fechar a porta e resetar após alguns segundos
        setTimeout(() => {
          setDoorOpen(false)
          setBurnComplete(false)
          setAmount("0")
          setFireIntensity(1)
        }, 3000)
      }, 3000)
    } catch (error) {
      console.error("Erro na queima:", error)
      setIsBurning(false)

      // Mostrar notificação de erro
      toast.error(translations.sendToken?.transactionFailed || "Falha ao queimar tokens", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-20 overflow-hidden">
      <BackgroundEffect />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3 relative z-10"
      >
        <h1 className="text-2xl font-bold tracking-tighter">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {translations.furnace?.title || "Fornalha"}
          </span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">
          {translations.furnace?.subtitle || "Queime tokens TPF e contribua para a substabilidade do token"}
        </p>
      </motion.div>

      {/* Estatísticas de queima */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-4 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 text-center"
      >
        <p className="text-xs text-gray-400">{translations.furnace?.totalBurned || "Total queimado"}</p>
        <p className="text-xl font-bold text-orange-500">{Number.parseFloat(totalBurned).toLocaleString()} TPF</p>
      </motion.div>

      {/* Fornalha Compacta */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-sm relative z-10 px-4"
      >
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
          {/* Estrutura externa da fornalha */}
          <div className="relative p-4 bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700/50">
            {/* Medidor de temperatura - mais compacto */}
            <div className="absolute top-4 right-4 w-8 h-24 bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
              <motion.div
                className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-b-full"
                animate={{ height: `${20 + fireIntensity * 25}%` }}
                transition={{ duration: 1 }}
              />
              <div className="absolute inset-0 flex flex-col justify-between p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-px bg-gray-600" />
                ))}
              </div>
              <div className="absolute inset-0 border border-gray-700 rounded-full pointer-events-none" />
            </div>

            {/* Fornalha 3D - mais compacta */}
            <div
              ref={furnaceRef}
              className="relative w-full h-48 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700/50"
            >
              {/* Estrutura de tijolos */}
              <div className="absolute inset-0">
                {/* Padrão de tijolos */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 gap-1 p-1 opacity-70">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-sm border border-gray-900/50"
                      style={{
                        boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.05), inset -1px -1px 0 rgba(0,0,0,0.2)",
                      }}
                    />
                  ))}
                </div>

                {/* Manchas e desgaste */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`stain-${i}`}
                    className="absolute rounded-full bg-black/20"
                    style={{
                      width: `${20 + Math.random() * 30}px`,
                      height: `${20 + Math.random() * 30}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      opacity: 0.2 + Math.random() * 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Porta da fornalha - mais compacta */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                {/* Moldura da porta */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-700 shadow-inner">
                  {/* Parafusos decorativos */}
                  {[
                    { top: "10%", left: "10%" },
                    { top: "10%", right: "10%" },
                    { bottom: "10%", left: "10%" },
                    { bottom: "10%", right: "10%" },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-gray-500 rounded-full border border-gray-600"
                      style={pos as any}
                    />
                  ))}
                </div>

                {/* Porta com animação */}
                <motion.div
                  className="absolute inset-0 origin-left bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-lg border border-gray-700 shadow-md overflow-hidden"
                  animate={{
                    rotateY: doorOpen ? 70 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                >
                  {/* Visor da porta */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm">
                      {/* Grade do visor */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-700" />
                        <div className="h-full w-0.5 bg-gray-700" />
                      </div>

                      {/* Brilho do fogo através do visor */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-orange-600/60 via-orange-500/40 to-yellow-400/20"
                        animate={{
                          opacity: fireIntensity * 0.3,
                        }}
                      />
                    </div>
                  </div>

                  {/* Puxador da porta */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-12 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full border border-gray-600">
                    <div className="absolute inset-0 flex flex-col justify-center items-center gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-2 h-0.5 bg-gray-800 rounded-full" />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Interior da fornalha (visível quando a porta está aberta) */}
                <div className="absolute inset-0 -z-10 rounded-lg overflow-hidden">
                  {/* Fundo da câmara */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
                    {/* Tijolos refratários */}
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-2 opacity-40">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-sm"
                          style={{
                            boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.05), inset -1px -1px 0 rgba(0,0,0,0.2)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Base de carvão/brasa */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-red-900/50 to-transparent" />
                    <div className="absolute inset-0">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <motion.div
                          key={`ember-${i}`}
                          className="absolute rounded-full bg-gradient-to-br from-red-600 to-red-800"
                          style={{
                            width: `${3 + Math.random() * 5}px`,
                            height: `${3 + Math.random() * 5}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${50 + Math.random() * 50}%`,
                          }}
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 1 + Math.random() * 2,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fogo animado */}
                  <div className="absolute bottom-0 left-0 right-0 h-2/3 overflow-hidden">
                    {/* Base do fogo */}
                    <motion.div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-orange-600 rounded-full blur-xl"
                      animate={{
                        opacity: [0.5, 0.7, 0.5],
                        scale: [1, 1.1, 1],
                        width: [20 * fireIntensity, 24 * fireIntensity, 20 * fireIntensity],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />

                    {/* Chamas principais */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute bottom-0 bg-gradient-to-t from-orange-600 via-orange-500 to-yellow-300"
                        style={{
                          width: `${3 + i * 1}px`,
                          height: `${25 + i * 3}px`,
                          left: `calc(50% + ${(i - 4) * 4}px)`,
                          filter: "blur(1px)",
                          opacity: 0.8 - i * 0.03,
                          zIndex: 10 - i,
                        }}
                        animate={{
                          height: [
                            `${(25 + i * 3) * fireIntensity}px`,
                            `${(35 + i * 3) * fireIntensity}px`,
                            `${(25 + i * 3) * fireIntensity}px`,
                          ],
                          width: [
                            `${(3 + i * 1) * fireIntensity}px`,
                            `${(4 + i * 1) * fireIntensity}px`,
                            `${(3 + i * 1) * fireIntensity}px`,
                          ],
                        }}
                        transition={{
                          duration: 0.5 + i * 0.1,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                          delay: i * 0.05,
                        }}
                      />
                    ))}

                    {/* Partículas de fogo */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 rounded-full"
                        style={{
                          left: `calc(50% + ${(Math.random() - 0.5) * 30}px)`,
                          background: i % 2 === 0 ? "#fbbf24" : "#f97316",
                          opacity: 0,
                        }}
                        animate={{
                          y: [0, -40 - Math.random() * 20 * fireIntensity],
                          x: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 25],
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1 + Math.random() * 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}

                    {/* Fumaça */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={`smoke-${i}`}
                        className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-gray-500/20 rounded-full blur-md"
                        style={{
                          left: `calc(50% + ${(Math.random() - 0.5) * 20}px)`,
                        }}
                        animate={{
                          y: [-10, -50 - Math.random() * 20],
                          x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20],
                          opacity: [0, 0.3, 0],
                          scale: [1, 2 + Math.random() * 1, 3],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>

                  {/* Reflexo do fogo nas paredes */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-orange-600/0 via-orange-500/10 to-transparent mix-blend-overlay"
                    animate={{
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />

                  {/* Brilho pulsante */}
                  <motion.div
                    className="absolute inset-0 bg-orange-500/10"
                    animate={{
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                </div>
              </div>

              {/* Token sendo queimado */}
              <AnimatePresence>
                {isBurning && (
                  <motion.div
                    className="absolute z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
                    initial={{ x: -80, y: 100, opacity: 0, rotateZ: 0 }}
                    animate={{
                      x: tokenPosition.x - 24,
                      y: tokenPosition.y,
                      opacity: [1, 1, 0],
                      rotateZ: 360,
                      scale: [1, 1, 0.5],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 4,
                      times: [0, 0.7, 1],
                    }}
                  >
                    <Image
                      src="/burn-token.png"
                      alt="TPF Token"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-orange-500/0"
                      animate={{
                        backgroundColor: ["rgba(249, 115, 22, 0)", "rgba(249, 115, 22, 0.3)"],
                        boxShadow: ["0 0 0 0 rgba(249, 115, 22, 0)", "0 0 10px 5px rgba(249, 115, 22, 0.5)"],
                      }}
                      transition={{
                        duration: 2,
                        delay: 2,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Efeito de iluminação ambiente */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-orange-600/0 via-orange-500/0 to-transparent mix-blend-overlay pointer-events-none"
                animate={{
                  opacity: fireIntensity * 0.15,
                }}
                transition={{ duration: 1 }}
              />

              {/* Brilho da fornalha no ambiente */}
              <motion.div
                className="absolute -inset-10 bg-orange-500/0 rounded-full blur-3xl pointer-events-none"
                animate={{
                  backgroundColor: `rgba(249, 115, 22, ${0.05 * fireIntensity})`,
                }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Controles e medidores - mais compactos */}
            <div className="flex justify-between mt-3 gap-2">
              {/* Botão de ignição */}
              <motion.button
                className={`flex-1 h-12 rounded-md relative ${
                  doorOpen ? "bg-red-600" : "bg-gradient-to-br from-red-600 to-red-800"
                } border-2 border-gray-700 shadow-lg`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => !isBurning && !burnComplete && setDoorOpen(!doorOpen)}
                disabled={isBurning || burnComplete}
              >
                <div className="absolute inset-1 rounded-md bg-gradient-to-br from-red-500 to-red-700 shadow-inner" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {doorOpen ? translations.nav?.close || "FECHAR" : translations.furnace?.openFurnace || "ABRIR"}
                </div>
                <motion.div
                  className="absolute inset-0 rounded-md bg-white/10"
                  animate={{
                    opacity: doorOpen ? [0.2, 0.4, 0.2] : 0,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: doorOpen ? Number.POSITIVE_INFINITY : 0,
                    repeatType: "reverse",
                  }}
                />
              </motion.button>

              {/* Medidor de temperatura */}
              <div className="h-12 w-12 bg-gray-800 rounded-md border-2 border-gray-700 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-b-md transition-all duration-1000">
                  <motion.div
                    className="w-full h-full"
                    animate={{
                      height: `${20 + fireIntensity * 25}%`,
                    }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white font-mono text-xs">{Math.round(300 * fireIntensity)}°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles da fornalha - mais compactos */}
          <div className="p-3 bg-gray-800/50 border-t border-gray-700/30">
            {doorOpen && !isBurning && !burnComplete ? (
              <div className="mb-3">
                <label htmlFor="amount" className="block text-xs font-medium text-gray-300 mb-1">
                  {translations.furnace?.amountToBurn || "Quantidade de TPF para queimar"}
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isBurning || burnComplete}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-l-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-r-md text-gray-300 text-sm">
                    TPF
                  </div>
                </div>
              </div>
            ) : null}

            <button
              onClick={doorOpen ? handleBurn : () => setDoorOpen(true)}
              disabled={doorOpen && (Number(amount) <= 0 || isBurning || burnComplete)}
              className={`w-full py-2 rounded-md font-medium text-white text-sm relative overflow-hidden ${
                isBurning
                  ? "bg-orange-600 cursor-not-allowed"
                  : doorOpen && Number(amount) > 0 && !burnComplete
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                    : doorOpen
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
              }`}
            >
              {isBurning ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {translations.furnace?.burning || "Queimando..."}
                </div>
              ) : burnComplete ? (
                translations.furnace?.burnCompleted || "Queima Concluída!"
              ) : !doorOpen ? (
                translations.furnace?.openFurnace || "Abrir a Fornalha"
              ) : (
                translations.furnace?.startBurn || "Iniciar Queima"
              )}
            </button>

            {/* Instruções */}
            {!doorOpen && !isBurning && !burnComplete && (
              <div className="mt-2 text-center text-xs text-gray-400">
                {translations.furnace?.instructions || "Clique no botão para abrir a fornalha"}
              </div>
            )}
            {doorOpen && !isBurning && !burnComplete && (
              <div className="mt-2 text-center text-xs text-gray-400">
                {translations.furnace?.amountToBurn
                  ? `${translations.furnace.amountToBurn} e ${translations.furnace.startBurn?.toLowerCase()}`
                  : 'Insira a quantidade e clique em "Iniciar Queima"'}
              </div>
            )}
          </div>

          {/* Painel de informações - mais compacto */}
          <div className="p-3 border-t border-gray-800/80 bg-gray-900/50">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-full flex items-center justify-between text-gray-300 hover:text-white"
            >
              <span className="font-medium text-sm">
                {translations.furnace?.furnaceInfo || "Informações sobre a Fornalha"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${showInfo ? "rotate-180" : ""}`}
              >
                <path
                  fillRule="evenodd"
                  d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    <p className="text-gray-300 text-xs">
                      {translations.furnace?.deflation ||
                        "A Fornalha permite que você queime tokens TPF e contribua para o crescimento do TPulseFi a longo prazo."}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-orange-500 mr-1.5 flex-shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="text-xs text-gray-300">
                          <strong className="text-white">
                            {translations.furnace?.deflation?.split(":")[0] || "Deflação"}:
                          </strong>
                          {translations.furnace?.deflation?.split(":")[1] ||
                            " Cada token queimado é enviado para uma carteira morta (0x000...dEaD) e removido permanentemente da circulação."}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Histórico de queima */}
      {burnTxHash && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 w-full max-w-sm px-4"
        >
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 p-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              {translations.furnace?.lastTransaction || "Última Transação"}
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Hash:</span>
              <a
                href={`https://worldscan.org/tx/${burnTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 truncate max-w-[200px]"
              >
                {burnTxHash.substring(0, 10)}...{burnTxHash.substring(burnTxHash.length - 8)}
              </a>
            </div>
          </div>
        </motion.div>
      )}

      <BottomNav activeTab="furnace" />
    </main>
  )
}
