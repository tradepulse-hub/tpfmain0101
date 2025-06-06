"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { LanguageSelector } from "@/components/language-selector"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar } from "lucide-react"

export default function FinancesPage() {
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))

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

  // Dados financeiros (todos em 0$ conforme solicitado)
  const financialData = {
    incentivesReceived: 0,
    transactionFees: 0,
    tradingRevenue: 0,
    projectExpenses: 0,
  }

  const totalRevenue = financialData.incentivesReceived + financialData.transactionFees + financialData.tradingRevenue
  const netBalance = totalRevenue - Math.abs(financialData.projectExpenses)

  // Dados para gráficos
  const revenueData = [
    {
      name: translations.finances?.incentivesReceived || "Incentives",
      value: financialData.incentivesReceived,
      color: "#3B82F6",
    },
    {
      name: translations.finances?.transactionFees || "Transaction Fees",
      value: financialData.transactionFees,
      color: "#10B981",
    },
    {
      name: translations.finances?.tradingRevenue || "Trading Revenue",
      value: financialData.tradingRevenue,
      color: "#8B5CF6",
    },
  ]

  const expenseData = [
    {
      name: translations.finances?.projectExpenses || "Project Expenses",
      value: Math.abs(financialData.projectExpenses),
      color: "#EF4444",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-md mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {translations.finances?.title || "Finanças"}
            </motion.h1>
            <LanguageSelector />
          </div>

          <motion.p
            className="text-gray-300 text-sm mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {translations.finances?.subtitle || "Transparência financeira do projeto"}
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-20">
        {/* Transparency Message */}
        <motion.div
          className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-xl p-4 mb-6 border border-blue-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-gray-200 text-sm leading-relaxed">
            {translations.finances?.transparencyMessage ||
              "Como a nossa prioridade é a transparência, procuramos alinhar esse princípio com os nossos usuários e investidores"}
          </p>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-green-800/30 to-green-900/30 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-lg font-bold">${totalRevenue}</span>
            </div>
            <p className="text-gray-300 text-xs">{translations.finances?.totalRevenue || "Total de Receitas"}</p>
          </div>

          <div className="bg-gradient-to-br from-red-800/30 to-red-900/30 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-lg font-bold">-${Math.abs(financialData.projectExpenses)}</span>
            </div>
            <p className="text-gray-300 text-xs">{translations.finances?.totalExpenses || "Total de Despesas"}</p>
          </div>
        </motion.div>

        {/* Net Balance */}
        <motion.div
          className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-xl p-4 mb-6 border border-blue-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm">{translations.finances?.netBalance || "Saldo Líquido"}</span>
            </div>
            <span className={`text-lg font-bold ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${netBalance}
            </span>
          </div>
        </motion.div>

        {/* Financial Details */}
        <motion.div
          className="space-y-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Incentives */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  {translations.finances?.incentivesReceived || "Incentivos conseguidos para progressão do projeto"}
                </span>
              </div>
            </div>
            <span className="text-blue-400 text-lg font-bold">${financialData.incentivesReceived}</span>
          </div>

          {/* Transaction Fees */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  {translations.finances?.transactionFees || "Rendimentos obtidos por taxas de transação"}
                </span>
              </div>
            </div>
            <span className="text-green-400 text-lg font-bold">${financialData.transactionFees}</span>
          </div>

          {/* Trading Revenue */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  {translations.finances?.tradingRevenue || "Rendimentos obtidos pela nossa equipa de Trading"}
                </span>
              </div>
            </div>
            <span className="text-purple-400 text-lg font-bold">${financialData.tradingRevenue}</span>
          </div>

          {/* Project Expenses */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  {translations.finances?.projectExpenses || "Gastos no projeto"}
                </span>
              </div>
            </div>
            <span className="text-red-400 text-lg font-bold">-${Math.abs(financialData.projectExpenses)}</span>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">
              {translations.finances?.financialChart || "Gráfico Financeiro"}
            </h3>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {revenueData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-gray-300">${item.value}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: item.value > 0 ? "20%" : "0%" }}
                    transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}

            {expenseData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-gray-300">-${item.value}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: item.value > 0 ? "20%" : "0%" }}
                    transition={{ duration: 1, delay: 1 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs">{translations.finances?.noData || "Sem dados disponíveis"}</span>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          className="flex items-center justify-center space-x-2 text-gray-400 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Calendar className="w-4 h-4" />
          <span>{translations.finances?.lastUpdated || "Última atualização"}: 30/05/2025</span>
        </motion.div>
      </div>

      <BottomNav activeTab="finances" />
    </div>
  )
}
