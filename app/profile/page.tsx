"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

// Dados das parcerias
const partnerships = [
  {
    id: 1,
    name: "Drop Wallet",
    description: "Claim crypto airdrops & earn by swapping - Up to 10 HUB",
    image: "/HUB.png",
    gradient: "from-yellow-600 to-orange-600",
    url: "https://worldcoin.org/mini-app?app_id=app_459cd0d0d3125864ea42bd4c19d1986c&app_mode=mini-app",
  },
  {
    id: 2,
    name: "Human Tap",
    description: "Invite friends - For real humans only",
    image: "/human-tap.jpg",
    gradient: "from-cyan-600 to-blue-600",
    url: "https://worldcoin.org/mini-app?app_id=app_40cf4a75c0ac4d247999bccb1ce8f857&app_mode=mini-app",
  },
  {
    id: 3,
    name: "HoldStation",
    description: "Advanced trading and swap platform for WorldChain",
    image: "/holdstation-logo.jpg",
    gradient: "from-purple-600 to-blue-600",
    url: "https://worldcoin.org/mini-app?app_id=app_0d4b759921490adc1f2bd569fda9b53a&app_mode=mini-app",
  },
  {
    id: 4,
    name: "AstraCoin",
    description: "Decentralized finance platform with advanced trading",
    image: "/astracoin-logo.jpg",
    gradient: "from-orange-600 to-purple-600",
    url: "https://worldcoin.org/mini-app?app_id=app_f50d7c645d30623eb495a81d58b838e6&app_mode=mini-app",
  },
]

const ProfilePage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPartnershipIndex, setCurrentPartnershipIndex] = useState(0)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Carrossel de parcerias
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPartnershipIndex((prev) => (prev + 1) % partnerships.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (status === "authenticated") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto py-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Name:</strong> {session?.user?.name}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {session?.user?.email}
              </p>
              <p className="text-gray-600">
                <strong>Wallet:</strong> {session?.user?.id}
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Delete Profile
              </button>
            </div>
          </motion.div>

          {/* Actions Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">Actions</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Create Something
            </button>
          </motion.div>
        </div>

        {/* Carrossel de Parcerias */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full mt-6"
        >
          <motion.div
            key={currentPartnershipIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden bg-gradient-to-r ${partnerships[currentPartnershipIndex].gradient} rounded-lg p-3 shadow-lg cursor-pointer`}
            onClick={() => window.open(partnerships[currentPartnershipIndex].url, "_blank")}
          >
            <div className="absolute inset-0 bg-black/10" />

            {/* Efeito de brilho animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2.5,
                ease: "linear",
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                  <Image
                    src={partnerships[currentPartnershipIndex].image || "/placeholder.svg"}
                    alt={partnerships[currentPartnershipIndex].name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {partnerships[currentPartnershipIndex].name}
                  </p>
                  <p className="text-white/80 text-xs truncate">{partnerships[currentPartnershipIndex].description}</p>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center">
                <ExternalLink className="w-3 h-3 mr-1" />
                Visit
              </div>
            </div>

            {/* Indicadores de progresso */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {partnerships.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentPartnershipIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create Something</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">Are you sure you want to create something?</p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Create
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Profile</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">Are you sure you want to edit your profile?</p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Profile</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete your profile? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Delete
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }
}

export default ProfilePage
