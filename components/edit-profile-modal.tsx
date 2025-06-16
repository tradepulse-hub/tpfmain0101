"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentData: {
    profileImage?: string
    name?: string
    bio?: string
  }
  onSave: (data: { profileImage?: string; name?: string; bio?: string }) => void
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentData, onSave }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [name, setName] = useState(currentData?.name || "")
  const [bio, setBio] = useState(currentData?.bio || "")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    setName(currentData?.name || "")
    setBio(currentData?.bio || "")
    setPreviewImage(null)
    setSelectedImage(null)
  }, [currentData])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    const newData: { profileImage?: string; name?: string; bio?: string } = {
      name,
      bio,
    }

    if (selectedImage) {
      // In a real application, you would upload the image to a server here
      // and get the URL of the uploaded image.
      // For this example, we'll just use the preview image as the profileImage.
      newData.profileImage = previewImage || currentData.profileImage
    } else {
      newData.profileImage = currentData.profileImage
    }

    onSave(newData)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>

        <div className="mb-4">
          <label htmlFor="profileImage" className="block text-gray-700 text-sm font-bold mb-2">
            Profile Image
          </label>
          <div className="flex items-center">
            <img
              src={
                previewImage ||
                (currentData.profileImage && currentData.profileImage !== "/placeholder.png"
                  ? currentData.profileImage
                  : "/default-avatar.jpg")
              }
              alt="Profile Preview"
              className="w-20 h-20 rounded-full object-cover mr-4"
            />
            <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} className="hidden" />
            <label
              htmlFor="profileImage"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
              Upload
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditProfileModal
