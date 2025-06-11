"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Calendar, Users, Copy, Trophy, Gamepad2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Tipos para os eventos
interface Event {
  id: string
  type: "airdrop" | "community" | "competition" | "education" | "tournament_registration" | "tournament_game"
  date: string
  time: string
  location: string
  participants: number
  endDate?: string
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const router = useRouter()
  const t = getTranslations(language)

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

    if (language === "pt") {
      return date.toLocaleDateString("pt-BR", options)
    } else {
      return date.toLocaleDateString("en-US", options)
    }
  }

  // Função para copiar endereço
  const copyAddress = (address: string) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        alert(language === "pt" ? "Endereço copiado!" : "Address copied!")
      })
      .catch(() => {
        alert(language === "pt" ? "Erro ao copiar" : "Failed to copy")
      })
  }

  // Função para abrir endereço no explorer
  const openAddressInExplorer = (address: string) => {
    window.open(`https://worldscan.org/address/${address}`, "_blank")
  }

  // Dados dos eventos - DATAS CORRETAS
  const mockEvents: Event[] = [
    // Top Holders Event - Verde (9 Maio - 9 Junho 2025)
    {
      id: "top-holders",
      type: "airdrop",
      date: "2025-05-09",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 500,
      endDate: "2025-06-09",
    },
    // Tournament Registration - Azul (10 Junho - 15 Junho 2025)
    {
      id: "tournament-registration",
      type: "tournament_registration",
      date: "2025-06-10",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 0,
      endDate: "2025-06-15",
    },
    // Snake Game Tournament - Roxo (16 Junho - 9 Julho 2025)
    {
      id: "tournament-game",
      type: "tournament_game",
      date: "2025-06-16",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 0,
      endDate: "2025-07-09",
    },
  ]

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      const savedAddress = localStorage.getItem("walletAddress")
      if (!savedAddress) {
        router.push("/")
        return
      }

      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)

      setTimeout(() => {
        setEvents(mockEvents)
        setIsLoading(false)
        console.log("📅 Eventos carregados com datas corretas:", mockEvents)
      }, 1000)
    }

    checkAuth()

    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [router])

  // Navegar para o mês anterior
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  // Navegar para o próximo mês
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  // Selecionar uma data
  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
  }

  // Verificar qual evento está ativo em uma data específica
  const getActiveEventForDate = (dateString: string) => {
    const checkDate = new Date(dateString)

    for (const event of events) {
      const startDate = new Date(event.date)
      const endDate = event.endDate ? new Date(event.endDate) : startDate

      if (checkDate >= startDate && checkDate <= endDate) {
        console.log(`🎯 Evento ativo em ${dateString}: ${event.type}`)
        return event
      }
    }

    return null
  }

  // Obter cor do evento baseado no tipo
  const getEventColor = (eventType: Event["type"]) => {
    switch (eventType) {
      case "airdrop":
        return "bg-emerald-600/60" // Verde para Top Holders
      case "tournament_registration":
        return "bg-blue-600/60" // Azul para Registration
      case "tournament_game":
        return "bg-purple-600/60" // Roxo para Tournament
      default:
        return ""
    }
  }

  // Verificar se uma data tem eventos
  const hasEvents = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const activeEvent = getActiveEventForDate(dateString)
    return activeEvent !== null
  }

  // Obter cor do dia baseado nos eventos ativos
  const getDayColor = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const activeEvent = getActiveEventForDate(dateString)

    if (activeEvent) {
      return getEventColor(activeEvent.type)
    }

    return ""
  }

  // Obter eventos para a data selecionada
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return []

    const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    const activeEvent = getActiveEventForDate(dateString)

    return activeEvent ? [activeEvent] : []
  }

  // Renderizar o calendário
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const days = []

    // Adicionar dias vazios para o início do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>)
    }

    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

      const isSelected =
        selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year

      const dayColor = getDayColor(day)
      const hasEventToday = hasEvents(day)

      days.push(
        <motion.div
          key={`day-${day}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDateClick(day)}
          className={`
            h-10 w-10 rounded-full flex items-center justify-center cursor-pointer relative
            ${isToday ? "bg-blue-600 text-white border-2 border-blue-400" : ""}
            ${isSelected ? "bg-gray-700 text-white border-2 border-gray-500" : ""}
            ${dayColor && !isToday && !isSelected ? `${dayColor} text-white` : ""}
            ${!isToday && !isSelected && !dayColor ? "hover:bg-gray-800" : ""}
          `}
        >
          {day}
          {hasEventToday && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-gray-900 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-gray-900"></div>
            </div>
          )}
        </motion.div>,
      )
    }

    return days
  }

  // Renderizar o cabeçalho do calendário (dias da semana)
  const renderDaysOfWeek = () => {
    const daysOfWeek = t.agenda?.days || ["D", "S", "T", "Q", "Q", "S", "S"]

    return daysOfWeek.map((day, index) => (
      <div key={`weekday-${index}`} className="h-10 w-10 flex items-center justify-center text-gray-400 text-sm">
        {day.charAt(0)}
      </div>
    ))
  }

  // Renderizar o indicador de tipo de evento
  const renderEventTypeIndicator = (type: Event["type"]) => {
    const typeConfig = {
      airdrop: { color: "bg-emerald-500", icon: Trophy, borderColor: "border-emerald-400" },
      tournament_registration: { color: "bg-blue-500", icon: Gamepad2, borderColor: "border-blue-400" },
      tournament_game: { color: "bg-purple-500", icon: Gamepad2, borderColor: "border-purple-400" },
      community: { color: "bg-blue-500", icon: Users, borderColor: "border-blue-400" },
      competition: { color: "bg-purple-500", icon: Trophy, borderColor: "border-purple-400" },
      education: { color: "bg-yellow-500", icon: Users, borderColor: "border-yellow-400" },
    }

    const config = typeConfig[type]
    const IconComponent = config.icon

    return (
      <div className="flex items-center">
        <div className={`w-4 h-4 rounded-full ${config.color} mr-3 border-2 ${config.borderColor} shadow-lg`}></div>
        <IconComponent className="w-5 h-5 text-gray-300" />
      </div>
    )
  }

  // Obter o nome do mês
  const getMonthName = (month: number) => {
    return t.agenda?.months?.[month] || ""
  }

  // Renderizar o conteúdo do evento
  const renderEventContent = (event: Event) => {
    const getEventCardStyle = (eventType: Event["type"]) => {
      switch (eventType) {
        case "airdrop":
          return "bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-600/30"
        case "tournament_registration":
          return "bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-600/30"
        case "tournament_game":
          return "bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-600/30"
        default:
          return "bg-gray-800/50 border-gray-700/50"
      }
    }

    const cardStyle = getEventCardStyle(event.type)

    if (event.type === "airdrop") {
      return (
        <div className={`p-4 rounded-lg border ${cardStyle}`}>
          <h4 className="text-emerald-300 font-medium text-lg">
            {language === "pt" ? "Evento Top 10 Holders" : "Top 10 Holders Event"}
          </h4>
          <p className="text-gray-300 text-sm mt-1">
            {language === "pt"
              ? "Bônus de 10% para os 10 maiores detentores de TPF"
              : "10% bonus for the top 10 TPF holders"}
          </p>

          <div className="mt-3 text-xs text-emerald-400 font-medium">
            <span className="bg-emerald-500/20 px-2 py-1 rounded text-emerald-300 border border-emerald-500/30">
              🏆 {language === "pt" ? "Evento Top Holders" : "Top Holders Event"}
            </span>
            <span className="ml-2">{language === "pt" ? "9 de Maio - 9 de Junho 2025" : "May 9 - June 9, 2025"}</span>
          </div>

          <div className="mt-4 text-xs text-gray-200 border-t border-emerald-700/30 pt-3">
            <p className="font-medium mb-2 text-emerald-300">
              {language === "pt" ? "Como Participar:" : "How to Participate:"}
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>{language === "pt" ? "Mantenha TPF em sua carteira" : "Hold TPF in your wallet"}</li>
              <li>{language === "pt" ? "Seja um dos 10 maiores detentores" : "Be one of the top 10 holders"}</li>
              <li>{language === "pt" ? "Receba 10% de bônus automaticamente" : "Receive 10% bonus automatically"}</li>
            </ol>
          </div>
        </div>
      )
    }

    if (event.type === "tournament_registration") {
      return (
        <div className={`p-4 rounded-lg border ${cardStyle}`}>
          <h4 className="text-blue-300 font-medium text-lg">
            {language === "pt" ? "Registro para o Torneio" : "Tournament Registration"}
          </h4>
          <p className="text-gray-300 text-sm mt-1">
            {language === "pt"
              ? "Período de inscrição para o Torneio Jogo da Cobra. Envie 200000 TPF para se registrar."
              : "Registration period for Snake Game Tournament. Send 200000 TPF to register."}
          </p>

          <div className="mt-3 text-xs text-blue-400 font-medium">
            <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-300 border border-blue-500/30">
              📝 {language === "pt" ? "Fase: Registro" : "Phase: Registration"}
            </span>
            <span className="ml-2">{language === "pt" ? "10 - 15 de Junho 2025" : "June 10-15, 2025"}</span>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-600/20">
            <p className="text-blue-300 text-sm font-medium mb-3">
              {language === "pt" ? "📋 Informações do Registro:" : "📋 Registration Information:"}
            </p>

            <div className="space-y-3 text-xs text-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">💰</span>
                <div>
                  <span className="font-medium text-blue-300">
                    {language === "pt" ? "Taxa de Registro:" : "Registration Fee:"}
                  </span>
                  <span className="ml-1">200.000 TPF</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">⏰</span>
                <div>
                  <span className="font-medium text-blue-300">{language === "pt" ? "Prazo:" : "Deadline:"}</span>
                  <span className="ml-1">{language === "pt" ? "15 de Junho 2025" : "June 15, 2025"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-600/20">
              <p className="text-blue-300 text-xs font-medium mb-2">
                {language === "pt" ? "Endereço para Registro:" : "Registration Address:"}
              </p>
              <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded border border-blue-600/20">
                <code className="text-xs text-green-400 flex-1 break-all">
                  0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677
                </code>
                <button
                  onClick={() => copyAddress("0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677")}
                  className="p-1 hover:bg-blue-600/20 rounded transition-colors"
                  title={language === "pt" ? "Copiar endereço" : "Copy address"}
                >
                  <Copy className="w-3 h-3 text-blue-400" />
                </button>
                <button
                  onClick={() => openAddressInExplorer("0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677")}
                  className="p-1 hover:bg-blue-600/20 rounded transition-colors"
                  title={language === "pt" ? "Ver no explorer" : "View in explorer"}
                >
                  <ExternalLink className="w-3 h-3 text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (event.type === "tournament_game") {
      return (
        <div className={`p-4 rounded-lg border ${cardStyle}`}>
          <h4 className="text-purple-300 font-medium text-lg">
            {language === "pt" ? "Torneio Jogo da Cobra" : "Snake Game Tournament"}
          </h4>
          <p className="text-gray-300 text-sm mt-1">
            {language === "pt"
              ? "Competição ativa! Consiga a maior pontuação no jogo da cobra para ganhar o grande prêmio."
              : "Active competition! Get the highest score in the snake game to win the grand prize."}
          </p>

          <div className="mt-3 text-xs text-purple-400 font-medium">
            <span className="bg-purple-500/20 px-2 py-1 rounded text-purple-300 border border-purple-500/30">
              🎮 {language === "pt" ? "Fase: Torneio Ativo" : "Phase: Active Tournament"}
            </span>
            <span className="ml-2">
              {language === "pt" ? "16 de Junho - 9 de Julho 2025" : "June 16 - July 9, 2025"}
            </span>
          </div>

          <div className="mt-4 text-xs text-gray-200 border-t border-purple-700/30 pt-3">
            <p className="font-medium mb-2 text-purple-300">{language === "pt" ? "Instruções:" : "Instructions:"}</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                {language === "pt"
                  ? "Consiga a maior pontuação possível no jogo da cobra"
                  : "Achieve the highest possible score in the snake game"}
              </li>
              <li>{language === "pt" ? "Tire um screenshot da sua pontuação" : "Take a screenshot of your score"}</li>
              <li>
                {language === "pt"
                  ? "Envie para support@tradepulsetoken.com até 9 de julho"
                  : "Send to support@tradepulsetoken.com by July 9"}
              </li>
              <li>
                {language === "pt"
                  ? "Em caso de empate, o prêmio será dividido"
                  : "In case of a tie, the prize will be shared"}
              </li>
            </ol>

            <div className="mt-3 p-2 bg-purple-900/20 rounded border border-purple-600/20">
              <p className="text-purple-300 text-xs font-medium mb-1">
                {language === "pt" ? "Email para Envio:" : "Email for Submission:"}
              </p>
              <code className="text-xs text-purple-400">support@tradepulsetoken.com</code>
            </div>

            <div className="mt-3">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border border-purple-500/30"
                onClick={() => router.push("/games")}
              >
                {language === "pt" ? "🎮 Jogar Agora" : "🎮 Play Now"}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      <BackgroundEffect />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 relative z-10"
      >
        <h1 className="text-3xl font-bold tracking-tighter flex items-center justify-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {language === "pt" ? "Eventos e Atividades" : "Events and Activities"}
          </span>
        </h1>
      </motion.div>

      <div className="w-full max-w-md px-4 relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="grid grid-cols-7 gap-2">
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded"></div>
                  ))}
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {Array(35)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded-full"></div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 mb-4">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="text-gray-400 hover:text-white">
                  &lt;
                </Button>
                <h2 className="text-lg font-medium text-white">
                  {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
                </h2>
                <Button variant="ghost" size="sm" onClick={nextMonth} className="text-gray-400 hover:text-white">
                  &gt;
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">{renderDaysOfWeek()}</div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-1 border border-blue-400"></div>
                  <span>{language === "pt" ? "Hoje" : "Today"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 mr-1 border border-emerald-400"></div>
                  <span>{language === "pt" ? "Top Holders (Mai 9-Jun 9)" : "Top Holders (May 9-Jun 9)"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-1 border border-blue-400"></div>
                  <span>{language === "pt" ? "Registro (Jun 10-15)" : "Registration (Jun 10-15)"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-600 mr-1 border border-purple-400"></div>
                  <span>{language === "pt" ? "Torneio (Jun 16-Jul 9)" : "Tournament (Jun 16-Jul 9)"}</span>
                </div>
              </div>
            </Card>

            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-white mb-3">
                  {language === "pt" ? "Eventos para " : "Events for "}
                  {formatDate(selectedDate.toISOString())}
                </h3>

                {getEventsForSelectedDate().length > 0 ? (
                  <div className="space-y-4">
                    {getEventsForSelectedDate().map((event) => (
                      <Card
                        key={event.id}
                        className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 overflow-hidden"
                      >
                        <div className="flex items-start p-1">
                          <div className="flex-shrink-0 mr-3 mt-3 ml-3">{renderEventTypeIndicator(event.type)}</div>
                          <div className="flex-1 pr-3">{renderEventContent(event)}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30 text-center">
                    <p className="text-gray-400">
                      {language === "pt" ? "Nenhum evento nesta data" : "No events on this date"}
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav activeTab="agenda" />
    </main>
  )
}
