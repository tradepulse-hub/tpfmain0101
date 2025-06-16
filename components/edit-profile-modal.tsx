"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { nickname?: string; profileImage?: string }) => void
  currentData: {
    nickname: string
    profileImage: string
  }
}

export function EditProfileModal({ isOpen, onClose, onSave, currentData }: EditProfileModalProps) {
  const [nickname, setNickname] = useState(currentData.nickname)
  const [profileImage, setProfileImage] = useState(currentData.profileImage)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onSave({
      nickname,
      profileImage: previewImage || profileImage,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Edit Profile</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Profile Image */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
                      <Image
                        src={previewImage || profileImage || ""}
                        alt=""
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-1.5 border border-gray-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
