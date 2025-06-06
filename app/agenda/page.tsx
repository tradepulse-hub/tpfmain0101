"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Calendar, Clock, MapPin, Users, Copy, Trophy, Gamepad2, ExternalLink } from "lucide-react"
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
  endDate?: string // Data de término opcional
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

  // Dados dos eventos
  const mockEvents: Event[] = [
    {
      id: "1",
      type: "airdrop",
      date: "2025-05-09",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 500,
      endDate: "2025-06-09", // Mantendo a data de término original
    },
    {
      id: "2",
      type: "tournament_registration",
      date: "2025-01-10",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 0,
      endDate: "2025-01-15",
    },
    {
      id: "3",
      type: "tournament_game",
      date: "2025-01-16",
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
        // Redirecionar para a página inicial se não estiver autenticado
        router.push("/")
        return
      }

      // Obter o idioma atual
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)

      // Simular carregamento de eventos
      setTimeout(() => {
        setEvents(mockEvents)
        setIsLoading(false)
      }, 1000)
    }

    checkAuth()

    // Adicionar listener para mudanças de idioma
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

  // Verificar se uma data tem eventos ou está no intervalo de um evento
  const hasEvents = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Verificar eventos que começam nesta data
    const hasStartEvent = events.some((event) => event.date === dateString)

    // Verificar se a data está no intervalo de algum evento
    const isInEventRange = events.some((event) => {
      if (!event.endDate) return false

      const eventStartDate = new Date(event.date)
      const eventEndDate = new Date(event.endDate)
      const currentDateCheck = new Date(dateString)

      return currentDateCheck >= eventStartDate && currentDateCheck <= eventEndDate
    })

    return hasStartEvent || isInEventRange
  }

  // Obter eventos para a data selecionada
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return []

    const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`

    // Verificar eventos que começam nesta data
    const startEvents = events.filter((event) => event.date === dateString)

    // Verificar se a data está no intervalo de algum evento
    const rangeEvents = events.filter((event) => {
      if (!event.endDate) return false

      const eventStartDate = new Date(event.date)
      const eventEndDate = new Date(event.endDate)
      const currentDateCheck = new Date(dateString)

      return currentDateCheck >= eventStartDate && currentDateCheck <= eventEndDate
    })

    // Combinar os resultados sem duplicatas
    return [...new Set([...startEvents, ...rangeEvents])]
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

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

      // Verificar se a data está no intervalo do evento especial
      const isInEventRange = events.some((event) => {
        if (!event.endDate) return false

        const eventStartDate = new Date(event.date)
        const eventEndDate = new Date(event.endDate)
        const currentDateCheck = new Date(dateString)

        return currentDateCheck >= eventStartDate && currentDateCheck <= eventEndDate
      })

      const hasEventToday = hasEvents(day)

      days.push(
        <motion.div
          key={`day-${day}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDateClick(day)}
          className={`
            h-10 w-10 rounded-full flex items-center justify-center cursor-pointer relative
            ${isToday ? "bg-blue-600 text-white" : ""}
            ${isSelected ? "bg-gray-700 text-white" : ""}
            ${isInEventRange && !isToday && !isSelected ? "bg-purple-600/40 text-white" : ""}
            ${!isToday && !isSelected && !isInEventRange ? "hover:bg-gray-800" : ""}
          `}
        >
          {day}
          {hasEventToday && <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-green-500"></div>}
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
      airdrop: { color: "bg-green-500", icon: Trophy },
      tournament_registration: { color: "bg-blue-500", icon: Gamepad2 },
      tournament_game: { color: "bg-purple-500", icon: Gamepad2 },
      community: { color: "bg-blue-500", icon: Users },
      competition: { color: "bg-purple-500", icon: Trophy },
      education: { color: "bg-yellow-500", icon: Users },
    }

    const config = typeConfig[type]
    const IconComponent = config.icon

    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${config.color} mr-2`}></div>
        <IconComponent className="w-4 h-4 text-gray-400" />
      </div>
    )
  }

  // Obter o nome do mês
  const getMonthName = (month: number) => {
    return t.agenda?.months?.[month] || ""
  }

  // Renderizar o conteúdo do evento
  const renderEventContent = (event: Event) => {
    if (event.type === "airdrop") {
      return (
        <>
          <h4 className="text-white font-medium">{t.agenda?.events?.topHoldersIncentive?.title}</h4>
          <p className="text-gray-400 text-sm mt-1">{t.agenda?.events?.topHoldersIncentive?.description}</p>

          {event.endDate && (
            <div className="mt-2 text-xs text-purple-400 font-medium">
              {formatDate(event.date)} - {formatDate(event.endDate)}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>
                {event.participants} {t.agenda?.participants}
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-300 border-t border-gray-700/50 pt-2">
            <p className="font-medium mb-1">{t.agenda?.howToParticipate}</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              {t.agenda?.events?.topHoldersIncentive?.howToParticipate?.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </>
      )
    }

    if (event.type === "tournament_registration") {
      return (
        <>
          <h4 className="text-white font-medium">
            {language === "pt" ? "Inscrição para o Torneio" : "Tournament Registration"}
          </h4>
          <p className="text-gray-400 text-sm mt-1">
            {language === "pt"
              ? "Período de inscrição para o Torneio Jogo da Cobra"
              : "Registration period for Snake Game Tournament"}
          </p>

          {event.endDate && (
            <div className="mt-2 text-xs text-blue-400 font-medium">
              {formatDate(event.date)} - {formatDate(event.endDate)}
            </div>
          )}

          <div className="mt-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <p className="text-white text-sm font-medium mb-2">
              {language === "pt" ? "Como se inscrever:" : "How to register:"}
            </p>
            <p className="text-gray-300 text-xs mb-2">
              {language === "pt"
                ? "Envie 200.000 TPF para o endereço abaixo:"
                : "Send 200,000 TPF to the address below:"}
            </p>
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded border">
              <code className="text-xs text-green-400 flex-1 break-all">
                0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677
              </code>
              <button
                onClick={() => copyAddress("0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677")}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title={language === "pt" ? "Copiar endereço" : "Copy address"}
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={() => openAddressInExplorer("0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677")}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title={language === "pt" ? "Ver no explorer" : "View in explorer"}
              >
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        </>
      )
    }

    if (event.type === "tournament_game") {
      return (
        <>
          <h4 className="text-white font-medium">
            {language === "pt" ? "Torneio Jogo da Cobra" : "Snake Game Tournament"}
          </h4>
          <p className="text-gray-400 text-sm mt-1">
            {language === "pt"
              ? "Competição para conseguir a maior pontuação no jogo da cobra"
              : "Competition to achieve the highest score in the snake game"}
          </p>

          {event.endDate && (
            <div className="mt-2 text-xs text-purple-400 font-medium">
              {formatDate(event.date)} - {formatDate(event.endDate)}
            </div>
          )}

          <div className="mt-3 text-xs text-gray-300 border-t border-gray-700/50 pt-2">
            <p className="font-medium mb-1">{language === "pt" ? "Instruções:" : "Instructions:"}</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                {language === "pt"
                  ? "O jogador com mais pontos ganha o grande prêmio"
                  : "The player with the highest score wins the grand prize"}
              </li>
              <li>
                {language === "pt"
                  ? "Envie o print do seu score para support@tradepulsetoken.com"
                  : "Send your score screenshot to support@tradepulsetoken.com"}
              </li>
              <li>
                {language === "pt"
                  ? "Apenas um envio por jogador será considerado"
                  : "Only one submission per player will be considered"}
              </li>
              <li>
                {language === "pt"
                  ? "Em caso de empate, o prêmio será dividido"
                  : "In case of a tie, the prize will be shared"}
              </li>
            </ul>
            <p className="mt-2 text-yellow-400 text-xs">
              {language === "pt"
                ? "O prêmio será anunciado na última semana do evento"
                : "The prize will be announced in the last week of the event"}
            </p>
          </div>
        </>
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
            {t.agenda?.eventsAndActivities}
          </span>
        </h1>
      </motion.div>

      <div className="w-full max-w-md px-4 relative z-10">
        {isLoading ? (
          // Esqueleto de carregamento
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
            {/* Calendário */}
            <Card className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 mb-4">
              {/* Cabeçalho do mês */}
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

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">{renderDaysOfWeek()}</div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

              {/* Legenda */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                  <span>{t.agenda?.today}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>{t.agenda?.event}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-600/40 mr-1"></div>
                  <span>{t.agenda?.incentivePeriod}</span>
                </div>
              </div>
            </Card>

            {/* Eventos do dia selecionado */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-white mb-2">
                  {language === "pt" ? "Eventos para " : "Events for "}
                  {formatDate(selectedDate.toISOString())}
                </h3>

                {getEventsForSelectedDate().length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForSelectedDate().map((event) => (
                      <Card
                        key={event.id}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-1">{renderEventTypeIndicator(event.type)}</div>
                          <div className="flex-1">{renderEventContent(event)}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30 text-center">
                    <p className="text-gray-400">{t.agenda?.noEvents}</p>
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
