"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { getCurrentLanguage, getTranslations, type Language, type Translations } from "@/lib/i18n"

export default function AnnouncementsPage() {
  const [language, setLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState<Translations>(getTranslations("en"))
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    setTranslations(getTranslations(currentLang))

    // Adicionar listener para mudanças de idioma
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Função para traduzir o conteúdo dos anúncios
  const getLocalizedContent = (key: string) => {
    const content = {
      worldRepublicPartyTitle: {
        en: "TPulseFi Party on WorldRepublic",
        pt: "Partido TPulseFi no WorldRepublic",
        es: "Partido TPulseFi en WorldRepublic",
        zh: "TPulseFi 在 WorldRepublic 上的派对",
        fr: "Parti TPulseFi sur WorldRepublic",
        it: "Partito TPulseFi su WorldRepublic",
        ko: "WorldRepublic의 TPulseFi 파티",
        de: "TPulseFi-Partei auf WorldRepublic",
      },
      worldRepublicPartyDate: {
        en: "Date: May 15, 2025",
        pt: "Data: 15 de Maio de 2025",
        es: "Fecha: 15 de Mayo de 2025",
        zh: "日期: 2025年5月15日",
        fr: "Date: 15 mai 2025",
        it: "Data: 15 maggio 2025",
        ko: "날짜: 2025년 5월 15일",
        de: "Datum: 15. Mai 2025",
      },
      worldRepublicPartyDescription: {
        en: "TPulseFi has a party on WorldRepublic, join us! What for? To ensure the appreciation of the TPF token, the subsidies obtained will be staked to earn interest, the interest in turn is exchanged for TPF and burned, adding more value to our token.",
        pt: "TPulseFi tem um partido no WorldRepublic junta-te a nós, e para que? Para garantires a valorização do token TPF, os subsidios obtidos ficaram em staking para render juros, os juros por sua vez, são trocados por TPF e queimados, adicionando mais valor ao nosso token.",
        es: "TPulseFi tiene un partido en WorldRepublic, ¡únete a nosotros! ¿Para qué? Para garantizar la apreciación del token TPF, los subsidios obtenidos se pondrán en staking para generar intereses, los intereses a su vez se intercambian por TPF y se queman, añadiendo más valor a nuestro token.",
        zh: "TPulseFi 在 WorldRepublic 上有一个派对，加入我们！为了什么？为了确保 TPF 代币的增值，获得的补贴将被质押以赚取利息，而利息将被兑换成 TPF 并被销毁，为我们的代币增加更多价值。",
        fr: "TPulseFi a un parti sur WorldRepublic, rejoignez-nous ! Pour quoi faire ? Pour assurer l'appréciation du jeton TPF, les subventions obtenues seront mises en staking pour générer des intérêts, les intérêts à leur tour sont échangés contre des TPF et brûlés, ajoutant plus de valeur à notre jeton.",
        it: "TPulseFi ha un partito su WorldRepublic, unisciti a noi! Per cosa? Per garantire l'apprezzamento del token TPF, i sussidi ottenuti saranno messi in staking per guadagnare interessi, gli interessi a loro volta vengono scambiati con TPF e bruciati, aggiungendo più valore al nostro token.",
        ko: "TPulseFi는 WorldRepublic에 파티가 있습니다. 우리와 함께하세요! 무엇을 위해? TPF 토큰의 가치 상승을 보장하기 위해 획득한 보조금은 이자를 얻기 위해 스테이킹되며, 이자는 TPF로 교환되어 소각되어 토큰에 더 많은 가치를 더합니다.",
        de: "TPulseFi hat eine Partei auf WorldRepublic, mach mit! Wofür? Um die Wertsteigerung des TPF-Tokens zu gewährleisten, werden die erhaltenen Subventionen gestaked, um Zinsen zu verdienen, die Zinsen wiederum werden gegen TPF getauscht und verbrannt, was unserem Token mehr Wert verleiht.",
      },
      worldRepublicPartyEnterNow: {
        en: "Enter Now",
        pt: "Entrar Agora",
        es: "Entrar Ahora",
        zh: "立即进入",
        fr: "Entrer Maintenant",
        it: "Entra Ora",
        ko: "지금 입장",
        de: "Jetzt Eintreten",
      },
      stayTuned: {
        en: "Stay Tuned",
        pt: "Fique Ligado",
        es: "Mantente Atento",
        zh: "敬请期待",
        fr: "Restez à l'écoute",
        it: "Resta Sintonizzato",
        ko: "계속 지켜봐 주세요",
        de: "Bleiben Sie dran",
      },
      moreAnnouncements: {
        en: "More announcements coming soon. Check back regularly for updates!",
        pt: "Mais anúncios em breve. Volte regularmente para atualizações!",
        es: "Más anuncios próximamente. ¡Vuelve regularmente para ver actualizaciones!",
        zh: "更多公告即将发布。定期查看更新！",
        fr: "Plus d'annonces à venir bientôt. Revenez régulièrement pour les mises à jour !",
        it: "Altri annunci in arrivo presto. Torna regolarmente per gli aggiornamenti!",
        ko: "곧 더 많은 공지사항이 제공됩니다. 업데이트를 위해 정기적으로 확인하세요!",
        de: "Weitere Ankündigungen folgen in Kürze. Schauen Sie regelmäßig vorbei, um Updates zu erhalten!",
      },
    }

    return (
      content[key as keyof typeof content][language as keyof (typeof content)[keyof typeof content]] ||
      content[key as keyof typeof content]["en"]
    )
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
          <Bell className="w-6 h-6 mr-2 text-blue-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {language === "en" ? "News" : language === "pt" ? "Notícias" : "Noticias"}
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {language === "en"
            ? "Latest news and updates"
            : language === "pt"
              ? "Últimas notícias e atualizações"
              : "Últimas noticias y actualizaciones"}
        </p>
      </motion.div>

      <div className="w-full max-w-md px-4 relative z-10 space-y-4">
        {/* WorldRepublic Party Announcement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <div className="bg-blue-600 p-2 rounded-lg mr-3 flex-shrink-0">
              <Bell size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{getLocalizedContent("worldRepublicPartyTitle")}</h2>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <Calendar size={14} className="mr-1" />
                <span>{getLocalizedContent("worldRepublicPartyDate")}</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">{getLocalizedContent("worldRepublicPartyDescription")}</p>
              <div className="mt-3 flex justify-end">
                <a
                  href="https://world.org/mini-app?app_id=app_66c83ab8c851fb1e54b1b1b62c6ce39d&path=%2Fgovern%2Fparty%2F1304"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                >
                  <span>{getLocalizedContent("worldRepublicPartyEnterNow")}</span>
                  <ChevronRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stay Tuned Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-4 rounded-lg text-center"
        >
          <h3 className="text-lg font-bold text-white">{getLocalizedContent("stayTuned")}</h3>
          <p className="text-sm text-gray-300 mt-2">{getLocalizedContent("moreAnnouncements")}</p>
        </motion.div>
      </div>

      <BottomNav activeTab="announcements" />
    </main>
  )
}
