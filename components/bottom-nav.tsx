"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Trophy } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Atualizar a interface BottomNavProps para incluir "partnerships"
interface BottomNavProps {
  activeTab?:
    | "agenda"
    | "profile"
    | "about"
    | "airdrop"
    | "fipay"
    | "furnace"
    | "games"
    | "wallet"
    | "winners"
    | "news"
    | "learn"
    | "partnerships"
}

export function BottomNav({ activeTab = "agenda" }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <>
      {/* Menu Panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed top-0 left-0 right-0 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-md border-b border-gray-700/30 z-40 overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="max-w-md mx-auto p-6 h-full">
              {/* Menu header */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-400 text-sm font-medium">{translations.nav?.menu || "Menu"}</div>
                <motion.button
                  onClick={toggleMenu}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800/50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-gray-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 01-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Menu grid */}
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[
                  { name: translations.nav?.airdrop || "Airdrop", icon: "gift", path: "/airdrop" },
                  { name: translations.furnace?.title || "Fornalha", icon: "fire", path: "/furnace" },
                  { name: translations.nav?.news || "News", icon: "megaphone", path: "/news" },
                  { name: translations.nav?.learn || "Aprende", icon: "book", path: "/learn" },
                  { name: translations.nav?.games || "Fi Games", icon: "gamepad", path: "/games" },
                  { name: translations.nav?.storm || "Storm", icon: "zap", path: "/storm" },
                  { name: "Membership", icon: "crown", path: "/membership" },
                  { name: translations.nav?.partnerships || "Parcerias", icon: "handshake", path: "/partnerships" },
                  { name: translations.nav?.about || "Sobre", icon: "info", path: "/about" },
                ].map((item) => (
                  <Link href={item.path} key={item.name}>
                    <motion.div
                      className="flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer relative overflow-hidden group"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * Math.random() }}
                    >
                      {/* Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700/30 group-hover:border-gray-600/50 transition-all duration-300" />

                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />

                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl transition-all duration-300" />

                      {/* Icon container */}
                      <div className="relative w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mb-2 border border-gray-600/20 z-10 group-hover:from-gray-600 group-hover:to-gray-700 transition-all duration-300">
                        <div className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors duration-300">
                          {item.icon === "gift" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                            </svg>
                          )}
                          {item.icon === "fire" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {item.icon === "megaphone" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.881 4.346A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.592.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.413-.393-4.735-1.119-6.904zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.483z" />
                            </svg>
                          )}
                          {item.icon === "book" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                            </svg>
                          )}
                          {item.icon === "gamepad" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.283.215.604.401.959.401a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
                            </svg>
                          )}
                          {item.icon === "zap" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71L10.018 14.25H2.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {item.icon === "handshake" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.25 4.5c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                            </svg>
                          )}
                          {item.icon === "info" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {item.icon === "crown" && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-4.914 0L4.456 1.82A1.875 1.875 0 001.5 3.111v.44c0 15.76 4.258 20.296 9.695 20.325.37.002.74.002 1.11 0 5.437-.029 9.695-4.566 9.695-20.325v-.44c0-.65-.421-1.223-1.055-1.291zM10.5 6.75a.75.75 0 00-.75.75v.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-.5a.75.75 0 00-.75-.75h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="relative z-10 text-xs text-gray-300 group-hover:text-white transition-colors duration-300 text-[10px]">
                        {item.name}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-16 z-50 px-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
      >
        {/* Metallic bar */}
        <div className="relative h-full max-w-md mx-auto">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-xl shadow-lg border border-gray-200/30 overflow-hidden">
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
                repeatDelay: 2,
              }}
            />

            {/* Top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50" />

            {/* Bottom shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-transparent to-gray-500/30" />
          </div>

          {/* Menu Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-10">
            <motion.button
              onClick={toggleMenu}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-gray-200 to-gray-400 flex items-center justify-center shadow-lg border border-gray-300/50 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  ease: "easeInOut",
                  repeatDelay: 1,
                }}
              />

              {/* Logo */}
              <motion.div
                className="w-8 h-8 relative"
                animate={{ rotate: menuOpen ? 360 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Image src="/logo-tpf.png" alt="TPulseFi Menu" width={32} height={32} className="w-full h-full" />
              </motion.div>
            </motion.button>
          </div>

          {/* Navigation Items */}
          <div className="relative h-full flex items-center justify-between px-4">
            {/* Left side items */}
            <div className="flex items-center space-x-8">
              {/* Agenda Link */}
              <Link href="/agenda" className="relative">
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    activeTab === "agenda" ? "bg-gray-700/20" : "bg-transparent"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-gray-700"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              </Link>

              {/* Winners Link (Taça) */}
              <Link href="/winners" className="relative">
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    activeTab === "winners" ? "bg-gray-700/20" : "bg-transparent"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-gray-100" />
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* Empty center space for the menu button */}
            <div className="w-14"></div>

            {/* Right side items */}
            <div className="flex items-center space-x-8">
              {/* Wallet Link */}
              <Link href="/wallet" className="relative">
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    activeTab === "wallet" ? "bg-gray-700/20" : "bg-transparent"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3 text-gray-100"
                    >
                      <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
                    </svg>
                  </div>
                </motion.div>
              </Link>

              {/* Profile Link */}
              <Link href="/profile" className="relative">
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    activeTab === "profile" ? "bg-gray-700/20" : "bg-transparent"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3 text-gray-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
