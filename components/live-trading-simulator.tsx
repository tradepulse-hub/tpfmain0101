"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getCurrentLanguage } from "@/lib/i18n"

// Simulated trading data
const generateRandomPrice = (base: number, volatility: number) => {
  return base + (Math.random() - 0.5) * volatility
}

const cryptos = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", basePrice: 60000, volatility: 2000 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", basePrice: 3000, volatility: 150 },
  { id: "tpulsefi", symbol: "TPF", name: "TPulseFi", basePrice: 0.5, volatility: 0.05 },
]

const translations = {
  en: {
    title: "Live Trading Simulator",
    balance: "Balance",
    buy: "Buy",
    sell: "Sell",
    amount: "Amount",
    price: "Price",
    value: "Value",
    portfolio: "Portfolio",
    marketValue: "Market Value",
    profit: "Profit/Loss",
    marketOverview: "Market Overview",
    hour: "1h",
    day: "24h",
    week: "7d",
    noHoldings: "You don't have any holdings yet. Buy some crypto to get started!",
    simulatedEnvironment: "This is a simulated environment for educational purposes only.",
  },
  es: {
    title: "Simulador de Trading en Vivo",
    balance: "Saldo",
    buy: "Comprar",
    sell: "Vender",
    amount: "Cantidad",
    price: "Precio",
    value: "Valor",
    portfolio: "Portafolio",
    marketValue: "Valor de Mercado",
    profit: "Beneficio/Pérdida",
    marketOverview: "Visión General del Mercado",
    hour: "1h",
    day: "24h",
    week: "7d",
    noHoldings: "Aún no tienes ninguna posición. ¡Compra algo de cripto para comenzar!",
    simulatedEnvironment: "Este es un entorno simulado solo con fines educativos.",
  },
  pt: {
    title: "Simulador de Trading ao Vivo",
    balance: "Saldo",
    buy: "Comprar",
    sell: "Vender",
    amount: "Quantidade",
    price: "Preço",
    value: "Valor",
    portfolio: "Portfólio",
    marketValue: "Valor de Mercado",
    profit: "Lucro/Perda",
    marketOverview: "Visão Geral do Mercado",
    hour: "1h",
    day: "24h",
    week: "7d",
    noHoldings: "Você ainda não tem nenhuma posição. Compre algumas criptomoedas para começar!",
    simulatedEnvironment: "Este é um ambiente simulado apenas para fins educacionais.",
  },
}

export const LiveTradingSimulator = () => {
  const [balance, setBalance] = useState(10000)
  const [holdings, setHoldings] = useState<{ id: string; amount: number }[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({})
  const [selectedCrypto, setSelectedCrypto] = useState(cryptos[0])
  const [buyAmount, setBuyAmount] = useState("")
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

  // Initialize prices and history
  useEffect(() => {
    const initialPrices: Record<string, number> = {}
    const initialHistory: Record<string, number[]> = {}

    cryptos.forEach((crypto) => {
      const price = generateRandomPrice(crypto.basePrice, crypto.volatility)
      initialPrices[crypto.id] = price
      initialHistory[crypto.id] = [price]
    })

    setPrices(initialPrices)
    setPriceHistory(initialHistory)

    // Update prices every 3 seconds
    const interval = setInterval(() => {
      setPrices((prevPrices) => {
        const newPrices: Record<string, number> = {}

        cryptos.forEach((crypto) => {
          newPrices[crypto.id] = generateRandomPrice(crypto.basePrice, crypto.volatility)
        })

        return newPrices
      })

      setPriceHistory((prevHistory) => {
        const newHistory: Record<string, number[]> = { ...prevHistory }

        cryptos.forEach((crypto) => {
          newHistory[crypto.id] = [...prevHistory[crypto.id].slice(-19), prices[crypto.id]]
        })

        return newHistory
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleBuy = () => {
    const amount = Number.parseFloat(buyAmount)
    if (isNaN(amount) || amount <= 0) return

    const cost = amount * prices[selectedCrypto.id]
    if (cost > balance) return

    setBalance(balance - cost)

    setHoldings((prevHoldings) => {
      const existingHolding = prevHoldings.find((h) => h.id === selectedCrypto.id)

      if (existingHolding) {
        return prevHoldings.map((h) => (h.id === selectedCrypto.id ? { ...h, amount: h.amount + amount } : h))
      } else {
        return [...prevHoldings, { id: selectedCrypto.id, amount }]
      }
    })

    setBuyAmount("")
  }

  const handleSell = () => {
    const amount = Number.parseFloat(buyAmount)
    if (isNaN(amount) || amount <= 0) return

    const holding = holdings.find((h) => h.id === selectedCrypto.id)
    if (!holding || holding.amount < amount) return

    const value = amount * prices[selectedCrypto.id]
    setBalance(balance + value)

    setHoldings((prevHoldings) => {
      return prevHoldings
        .map((h) => (h.id === selectedCrypto.id ? { ...h, amount: h.amount - amount } : h))
        .filter((h) => h.amount > 0)
    })

    setBuyAmount("")
  }

  const getTotalPortfolioValue = () => {
    return holdings.reduce((total, holding) => total + holding.amount * prices[holding.id], 0)
  }

  const getHoldingValue = (holding: { id: string; amount: number }) => {
    return holding.amount * prices[holding.id]
  }

  const getCryptoById = (id: string) => {
    return cryptos.find((c) => c.id === id)
  }

  const getPriceChangeClass = (current: number, previous: number) => {
    if (current > previous) return "text-green-500"
    if (current < previous) return "text-red-500"
    return "text-gray-400"
  }

  const getPriceChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight size={14} className="text-green-500" />
    if (current < previous) return <ArrowDownRight size={14} className="text-red-500" />
    return null
  }

  return (
    <div className="p-4 text-white">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">{t.balance}</h2>
          <span className="text-xl font-bold">${balance.toFixed(2)}</span>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <select
                value={selectedCrypto.id}
                onChange={(e) => setSelectedCrypto(cryptos.find((c) => c.id === e.target.value) || cryptos[0])}
                className="bg-gray-700 text-white p-2 rounded-lg mr-2"
              >
                {cryptos.map((crypto) => (
                  <option key={crypto.id} value={crypto.id}>
                    {crypto.symbol} - {crypto.name}
                  </option>
                ))}
              </select>
              <div className="text-sm">
                <div className="font-medium">${prices[selectedCrypto.id]?.toFixed(2) || "0.00"}</div>
                <div className="flex items-center text-xs">
                  {getPriceChangeIcon(prices[selectedCrypto.id] || 0, priceHistory[selectedCrypto.id]?.[0] || 0)}
                  <span
                    className={getPriceChangeClass(
                      prices[selectedCrypto.id] || 0,
                      priceHistory[selectedCrypto.id]?.[0] || 0,
                    )}
                  >
                    {(
                      (((prices[selectedCrypto.id] || 0) - (priceHistory[selectedCrypto.id]?.[0] || 0)) /
                        (priceHistory[selectedCrypto.id]?.[0] || 1)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex mb-3">
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder={t.amount}
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white"
            />
            <div className="bg-gray-600 p-2 rounded-r-lg text-sm flex items-center">{selectedCrypto.symbol}</div>
          </div>

          <div className="text-sm mb-3">
            <div className="flex justify-between">
              <span>{t.value}:</span>
              <span>${(Number.parseFloat(buyAmount) || 0) * (prices[selectedCrypto.id] || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleBuy}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {t.buy}
            </button>
            <button
              onClick={handleSell}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {t.sell}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">{t.portfolio}</h2>

        {holdings.length === 0 ? (
          <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400 text-sm">{t.noHoldings}</div>
        ) : (
          <div className="space-y-2">
            {holdings.map((holding) => {
              const crypto = getCryptoById(holding.id)
              if (!crypto) return null

              return (
                <div key={holding.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {crypto.symbol} - {crypto.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {holding.amount.toFixed(4)} {crypto.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${getHoldingValue(holding).toFixed(2)}</div>
                      <div
                        className={`text-sm flex items-center justify-end ${getPriceChangeClass(
                          prices[holding.id] || 0,
                          priceHistory[holding.id]?.[0] || 0,
                        )}`}
                      >
                        {getPriceChangeIcon(prices[holding.id] || 0, priceHistory[holding.id]?.[0] || 0)}
                        <span>
                          {(
                            (((prices[holding.id] || 0) - (priceHistory[holding.id]?.[0] || 0)) /
                              (priceHistory[holding.id]?.[0] || 1)) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="font-medium">{t.marketValue}</div>
                <div className="font-bold">${getTotalPortfolioValue().toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-center text-gray-500 mt-4">{t.simulatedEnvironment}</div>
    </div>
  )
}
