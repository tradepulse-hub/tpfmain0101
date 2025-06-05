"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

export default function FinancesPage() {
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()))
    }

    handleLanguageChange()
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Dados financeiros
  const financialData = {
    incentivesReceived: 0,
    transactionFees: 0,
    tradingRevenue: 0,
    projectExpenses: 0,
  }

  const totalRevenue = financialData.incentivesReceived + financialData.transactionFees + financialData.tradingRevenue
  const totalExpenses = Math.abs(financialData.projectExpenses)
  const netBalance = totalRevenue - totalExpenses

  const chartData = [
    {
      name: translations.finances?.incentivesReceived || "Incentivos",
      value: financialData.incentivesReceived,
      color: "bg-blue-500",
    },
    {
      name: translations.finances?.transactionFees || "Taxas",
      value: financialData.transactionFees,
      color: "bg-green-500",
    },
    {
      name: translations.finances?.tradingRevenue || "Trading",
      value: financialData.tradingRevenue,
      color: "bg-purple-500",
    },
    {
      name: translations.finances?.projectExpenses || "Gastos",
      value: Math.abs(financialData.projectExpenses),
      color: "bg-red-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      {/* Header */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative max-w-md mx-auto px-6 py-8">
          <motion.div
            className="flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-center mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {translations.finances?.title || "Finanças"}
          </motion.h1>
          <motion.p
            className="text-gray-300 text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {translations.finances?.subtitle || "Transparência financeira do projeto"}
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Transparency Message */}
        <motion.div
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <p className="text-gray-200 text-center leading-relaxed">
            {translations.finances?.transparencyMessage ||
              "Como a nossa prioridade é a transparência, procuramos alinhar esse princípio com os nossos usuários e investidores"}
          </p>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                {translations.finances?.totalRevenue || "Total Receitas"}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">${totalRevenue}</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm font-medium">
                {translations.finances?.totalExpenses || "Total Despesas"}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-300">${totalExpenses}</p>
          </div>
        </motion.div>

        {/* Net Balance */}
        <motion.div
          className={`bg-gradient-to-br ${
            netBalance >= 0 ? "from-green-500/20 to-green-600/20" : "from-red-500/20 to-red-600/20"
          } backdrop-blur-sm rounded-xl p-6 border ${netBalance >= 0 ? "border-green-500/20" : "border-red-500/20"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-2">
            <DollarSign className={`w-6 h-6 ${netBalance >= 0 ? "text-green-400" : "text-red-400"} mr-2`} />
            <span className={`${netBalance >= 0 ? "text-green-400" : "text-red-400"} font-medium`}>
              {translations.finances?.netBalance || "Saldo Líquido"}
            </span>
          </div>
          <p className={`text-3xl font-bold text-center ${netBalance >= 0 ? "text-green-300" : "text-red-300"}`}>
            ${netBalance}
          </p>
        </motion.div>

        {/* Financial Breakdown */}
        <motion.div
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-center">
            {translations.finances?.financialChart || "Gráfico Financeiro"}
          </h3>

          <div className="space-y-4">
            {chartData.map((item, index) => (
              <motion.div
                key={item.name}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm font-medium">${item.value}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: item.value > 0 ? "100%" : "0%" }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Breakdown */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {/* Incentives */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
            <div className="flex justify-between items-center">
              <span className="text-blue-300 text-sm">
                {translations.finances?.incentivesReceived || "Incentivos conseguidos para progressão do projeto"}
              </span>
              <span className="text-blue-300 font-medium">${financialData.incentivesReceived}</span>
            </div>
          </div>

          {/* Transaction Fees */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="flex justify-between items-center">
              <span className="text-green-300 text-sm">
                {translations.finances?.transactionFees || "Rendimentos obtidos por taxas de transação"}
              </span>
              <span className="text-green-300 font-medium">${financialData.transactionFees}</span>
            </div>
          </div>

          {/* Trading Revenue */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
            <div className="flex justify-between items-center">
              <span className="text-purple-300 text-sm">
                {translations.finances?.tradingRevenue || "Rendimentos obtidos pela nossa equipa de Trading"}
              </span>
              <span className="text-purple-300 font-medium">${financialData.tradingRevenue}</span>
            </div>
          </div>

          {/* Project Expenses */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="flex justify-between items-center">
              <span className="text-red-300 text-sm">
                {translations.finances?.projectExpenses || "Gastos no projeto"}
              </span>
              <span className="text-red-300 font-medium">-${Math.abs(financialData.projectExpenses)}</span>
            </div>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          className="flex items-center justify-center text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          <span>{translations.finances?.lastUpdated || "Última atualização"}: 30/05/2025</span>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
