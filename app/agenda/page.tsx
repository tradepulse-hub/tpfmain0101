"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Tipos para os eventos
interface Event {
  id: string
  type: "airdrop" | "community" | "competition" | "education"
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

  // Dados simulados de eventos
  const mockEvents: Event[] = [
    {
      id: "1",
      type: "airdrop",
      date: "2025-05-09",
      time: "00:00",
      location: t.agenda?.online || "Online",
      participants: 500,
      endDate: "2025-06-09", // Adicionando data de término para o evento
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
    const typeColors = {
      airdrop: "bg-green-500",
      community: "bg-blue-500",
      competition: "bg-purple-500",
      education: "bg-yellow-500",
    }

    return <div className={`w-3 h-3 rounded-full ${typeColors[type]}`}></div>
  }

  // Obter o nome do mês
  const getMonthName = (month: number) => {
    return t.agenda?.months?.[month] || ""
  }

  // Renderizar o conteúdo do evento
  const renderEventContent = (event: Event) => {
    // Baseado no tipo do evento, retornar o conteúdo apropriado
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

    // Para outros tipos de eventos, podemos adicionar mais casos aqui
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
