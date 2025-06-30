interface DebugLog {
  timestamp: string
  level: "info" | "error" | "warn" | "success"
  message: string
  data?: any
}

class DebugLogger {
  private logs: DebugLog[] = []
  private listeners: ((logs: DebugLog[]) => void)[] = []

  private addLog(level: DebugLog["level"], message: string, data?: any) {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data,
    }

    this.logs.push(log)

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]))

    // Also log to console
    const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log"
    console[consoleMethod](`[${log.timestamp}] ${message}`, data || "")
  }

  info(message: string, data?: any) {
    this.addLog("info", message, data)
  }

  error(message: string, data?: any) {
    this.addLog("error", message, data)
  }

  warn(message: string, data?: any) {
    this.addLog("warn", message, data)
  }

  success(message: string, data?: any) {
    this.addLog("success", message, data)
  }

  getLogs() {
    return [...this.logs]
  }

  clear() {
    this.logs = []
    this.listeners.forEach((listener) => listener([]))
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener)
    // Send current logs immediately
    listener([...this.logs])

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }
}

export const debugLogger = new DebugLogger()
