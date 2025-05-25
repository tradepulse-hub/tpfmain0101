"use client"

import { useState, useEffect } from "react"
import { getCurrentLanguage } from "@/lib/i18n"

const translations = {
  en: {
    title: "TPulseFi Tokenomics",
    totalSupply: "Total Supply",
    circulatingSupply: "Circulating Supply",
    distribution: "Token Distribution",
    utility: "Token Utility",
    staking: "Staking",
    governance: "Governance",
    fees: "Transaction Fees",
    burning: "Token Burning",
    stakingDesc: "Stake TPF tokens to earn rewards and participate in the ecosystem growth.",
    governanceDesc: "Use TPF tokens to vote on proposals and shape the future of the platform.",
    feesDesc: "A small percentage of transaction fees are used to buy back and burn TPF tokens.",
    burningDesc: "Token burning reduces the total supply over time, potentially increasing value.",
    tokenUtility: "What can you do with TPF?",
    tokenomicsExplained: "Tokenomics Explained",
    tokenomicsExplainedDesc:
      "Tokenomics is the study of how cryptocurrencies work within the broader ecosystem. This includes token distribution, utility, and the incentive structures that influence behavior.",
  },
  es: {
    title: "Tokenomics de TPulseFi",
    totalSupply: "Suministro Total",
    circulatingSupply: "Suministro Circulante",
    distribution: "Distribución de Tokens",
    utility: "Utilidad del Token",
    staking: "Staking",
    governance: "Gobernanza",
    fees: "Tarifas de Transacción",
    burning: "Quema de Tokens",
    stakingDesc: "Haz staking de tokens TPF para ganar recompensas y participar en el crecimiento del ecosistema.",
    governanceDesc: "Usa tokens TPF para votar propuestas y dar forma al futuro de la plataforma.",
    feesDesc: "Un pequeño porcentaje de las tarifas de transacción se utiliza para recomprar y quemar tokens TPF.",
    burningDesc: "La quema de tokens reduce el suministro total con el tiempo, potencialmente aumentando su valor.",
    tokenUtility: "¿Qué puedes hacer con TPF?",
    tokenomicsExplained: "Tokenomics Explicado",
    tokenomicsExplainedDesc:
      "Tokenomics es el estudio de cómo funcionan las criptomonedas dentro del ecosistema más amplio. Esto incluye la distribución de tokens, utilidad y las estructuras de incentivos que influyen en el comportamiento.",
  },
  pt: {
    title: "Tokenomics do TPulseFi",
    totalSupply: "Fornecimento Total",
    circulatingSupply: "Fornecimento Circulante",
    distribution: "Distribuição de Tokens",
    utility: "Utilidade do Token",
    staking: "Staking",
    governance: "Governança",
    fees: "Taxas de Transação",
    burning: "Queima de Tokens",
    stakingDesc: "Faça staking de tokens TPF para ganhar recompensas e participar do crescimento do ecossistema.",
    governanceDesc: "Use tokens TPF para votar em propostas e moldar o futuro da plataforma.",
    feesDesc: "Uma pequena porcentagem das taxas de transação é usada para recomprar e queimar tokens TPF.",
    burningDesc: "A queima de tokens reduz o fornecimento total ao longo do tempo, potencialmente aumentando o valor.",
    tokenUtility: "O que você pode fazer com TPF?",
    tokenomicsExplained: "Tokenomics Explicado",
    tokenomicsExplainedDesc:
      "Tokenomics é o estudo de como as criptomoedas funcionam dentro do ecossistema mais amplo. Isso inclui distribuição de tokens, utilidade e as estruturas de incentivo que influenciam o comportamento.",
  },
}

export const TokenomicsExplainer = () => {
  const [language, setLanguage] = useState<"en" | "es" | "pt">("en")
  const [t, setT] = useState(translations.en)

  useEffect(() => {
    // Set initial language
    const currentLang = getCurrentLanguage() as "en" | "es" | "pt"
    setLanguage(currentLang)
    setT(translations[currentLang] || translations.en)

    // Add listener for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage() as "en" | "es" | "pt"
      setLanguage(newLang)
      setT(translations[newLang] || translations.en)
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Sample data for the token distribution chart
  const distributionData = [
    { name: "Community", percentage: 40, color: "#3B82F6" },
    { name: "Team", percentage: 20, color: "#10B981" },
    { name: "Treasury", percentage: 15, color: "#F59E0B" },
    { name: "Investors", percentage: 15, color: "#8B5CF6" },
    { name: "Advisors", percentage: 5, color: "#EC4899" },
    { name: "Ecosystem", percentage: 5, color: "#6366F1" },
  ]

  return (
    <div className="p-4 text-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{t.title}</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">{t.totalSupply}</div>
            <div className="text-lg font-bold">1,000,000,000 TPF</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">{t.circulatingSupply}</div>
            <div className="text-lg font-bold">650,000,000 TPF</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">{t.distribution}</h3>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex mb-4">
            {distributionData.map((item, index) => (
              <div
                key={index}
                className="h-4"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                  borderRadius:
                    index === 0
                      ? "0.25rem 0 0 0.25rem"
                      : index === distributionData.length - 1
                        ? "0 0.25rem 0.25rem 0"
                        : "0",
                }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {distributionData.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <div className="flex-1">{item.name}</div>
                <div className="font-medium">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">{t.tokenUtility}</h3>
        <div className="space-y-3">
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium mb-1">{t.staking}</h4>
            <p className="text-sm text-gray-300">{t.stakingDesc}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium mb-1">{t.governance}</h4>
            <p className="text-sm text-gray-300">{t.governanceDesc}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium mb-1">{t.fees}</h4>
            <p className="text-sm text-gray-300">{t.feesDesc}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium mb-1">{t.burning}</h4>
            <p className="text-sm text-gray-300">{t.burningDesc}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">{t.tokenomicsExplained}</h3>
          <p className="text-sm text-gray-300">{t.tokenomicsExplainedDesc}</p>
        </div>
      </div>
    </div>
  )
}
