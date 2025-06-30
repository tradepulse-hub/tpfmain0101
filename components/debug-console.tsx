"use client"

import { useState } from "react"
import { Copy, ChevronDown, ChevronUp, Bug, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DebugLog {
  timestamp: string
  level: "info" | "error" | "warn" | "success"
  message: string
  data?: any
}

interface DebugConsoleProps {
  logs: DebugLog[]
  onClear: () => void
}

export function DebugConsole({ logs, onClear }: DebugConsoleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyLogs = async () => {
    const logText = logs
      .map((log) => {
        const dataStr = log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ""
        return `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${dataStr}`
      })
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(logText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy logs:", error)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400"
      case "warn":
        return "text-yellow-400"
      case "success":
        return "text-green-400"
      default:
        return "text-blue-400"
    }
  }

  const getLevelBg = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-900/20"
      case "warn":
        return "bg-yellow-900/20"
      case "success":
        return "bg-green-900/20"
      default:
        return "bg-blue-900/20"
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-md">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-gray-700/50 hover:bg-gray-700/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bug className="w-4 h-4" />
        <span className="text-sm">Debug ({logs.length})</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl max-h-96 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
              <h3 className="text-white font-medium text-sm">Debug Console</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLogs}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy all logs"
                >
                  {copied ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <span className="text-xs">Copied!</span>
                    </div>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onClear}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Clear logs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">No logs yet</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`p-2 rounded text-xs ${getLevelBg(log.level)}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`font-medium ${getLevelColor(log.level)}`}>{log.level.toUpperCase()}</span>
                      <span className="text-gray-400 text-xs">{log.timestamp}</span>
                    </div>
                    <div className="text-gray-200 mb-1">{log.message}</div>
                    {log.data && (
                      <details className="mt-1">
                        <summary className="text-gray-400 cursor-pointer hover:text-gray-300">Show data</summary>
                        <pre className="mt-1 text-xs text-gray-300 bg-gray-800/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
