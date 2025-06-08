"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Wallet,
  BookOpen,
  User,
  Calendar,
  Trophy,
  Gamepad2,
  Cloud,
  Info,
  BarChart3,
  Handshake,
  Crown,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const navItems = [
    { href: "/", label: t.nav?.home || "Home", icon: Home },
    { href: "/wallet", label: t.nav?.wallet || "Wallet", icon: Wallet },
    { href: "/learn", label: t.nav?.learn || "Learn", icon: BookOpen },
    { href: "/agenda", label: t.nav?.agenda || "Agenda", icon: Calendar },
    { href: "/winners", label: t.nav?.winners || "Winners", icon: Trophy },
    { href: "/games", label: t.nav?.games || "Games", icon: Gamepad2 },
    { href: "/storm", label: t.nav?.storm || "Storm", icon: Cloud },
    { href: "/about", label: t.nav?.about || "About", icon: Info },
    { href: "/finances", label: t.nav?.finances || "Finances", icon: BarChart3 },
    { href: "/partnerships", label: t.nav?.partnerships || "Partnerships", icon: Handshake },
    { href: "/membership", label: t.nav?.membership || "Membership", icon: Crown },
    { href: "/profile", label: t.nav?.profile || "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-w-[4rem] ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <item.icon className={`h-5 w-5 ${item.href === "/membership" ? "animate-pulse" : ""}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
