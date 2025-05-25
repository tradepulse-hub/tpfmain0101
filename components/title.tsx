"use client"

import { motion } from "framer-motion"

export function Title() {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center mb-2"
    >
      <h1 className="text-5xl font-bold tracking-tighter">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
          TPulse
        </span>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Fi</span>
      </h1>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent mt-2"
      />
    </motion.div>
  )
}
