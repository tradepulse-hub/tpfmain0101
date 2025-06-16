"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { User, Mail } from "react-feather"
import { useRouter } from "next/router"
import LevelInfoModal from "@/components/LevelInfoModal"
import { useUserLevel } from "@/hooks/useUserLevel"
import { useTPFBalance } from "@/hooks/useTPFBalance"
import { formatDate } from "@/utils/formatDate"
import { toast } from "react-hot-toast"

const ProfilePage = () => {
  const { data: session } = useSession()
  const translations = useTranslations("ProfilePage")
  const router = useRouter()

  const [showLevelInfo, setShowLevelInfo] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // User data from session
  const user = session?.user

  // User Level Hook
  const { level: userLevel, refreshLevel } = useUserLevel()

  // TPF Balance Hook
  const { balance: tpfBalance, lastUpdateTime, isAutoUpdating } = useTPFBalance()

  // Format last update time
  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return null
    const now = new Date()
    const diff = now.getTime() - lastUpdateTime.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return "just now"
    } else if (minutes === 1) {
      return "1 minute ago"
    } else {
      return `${minutes} minutes ago`
    }
  }

  // Refresh Level Handler
  const handleRefreshLevel = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshLevel()
      toast.success(translations.level?.refreshSuccess || "Level successfully updated!")
    } catch (error) {
      toast.error(translations.level?.refreshError || "Failed to update level.")
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshLevel, translations.level?.refreshSuccess, translations.level?.refreshError])

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, router])

  if (!session) {
    return <div className="text-center mt-4">{translations.loading || "Loading..."}</div>
  }

  return (
    <div className="container mx-auto p-4">
      {/* Level Info Modal */}
      <LevelInfoModal show={showLevelInfo} onClose={() => setShowLevelInfo(false)} />

      {/* Profile Card */}
      <div className="bg-gray-900 rounded-lg shadow-xl p-6">
        {/* Profile Picture and Details */}
        <div className="flex items-center gap-6 border-b border-gray-800 pb-4">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500">
              <img
                src={user?.image || "/images/default-user.png"}
                alt={user?.name || "Profile"}
                className="object-cover w-full h-full"
              />
              {/* Level Badge - posicionado no canto superior direito */}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-white">{user?.name || "Unknown User"}</h1>
            <p className="text-blue-300">{user?.email || "No email provided"}</p>
            {/* TPF Balance Display com indicador de atualização automática */}
            {/* Level Info Button with Refresh */}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            {translations.contactInformation || "Contact Information"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.email && (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="text-blue-500" size={16} />
                <span>{user.email}</span>
              </div>
            )}
            {/* You can add more contact information fields here */}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            {translations.additionalInformation || "Additional Information"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="text-blue-500" size={16} />
              <span>
                {translations.memberSince || "Member Since"}: {formatDate(session?.createdAt) || "N/A"}
              </span>
            </div>
            {/* You can add more additional information fields here */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
