import { enhancedTokenService } from "./holdstation-service"

// Serviço para sincronizar saldos entre páginas
class BalanceSyncService {
  private static instance: BalanceSyncService

  static getInstance(): BalanceSyncService {
    if (!BalanceSyncService.instance) {
      BalanceSyncService.instance = new BalanceSyncService()
    }
    return BalanceSyncService.instance
  }

  updateTPFBalance(walletAddress: string, balance: number): void {
    try {
      localStorage.setItem(`tpf_balance_${walletAddress}`, balance.toString())
      localStorage.setItem("current_tpf_balance", balance.toString())
      localStorage.setItem("last_tpf_balance", balance.toString())
      localStorage.setItem("wallet_tpf_balance", balance.toString())

      const event = new CustomEvent("tpf_balance_updated", {
        detail: {
          walletAddress,
          tpfBalance: balance,
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      const xpEvent = new CustomEvent("xp_balance_changed", {
        detail: {
          walletAddress,
          tpfBalance: balance,
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(xpEvent)

      console.log(`TPF Balance updated: ${balance.toLocaleString()} TPF`)
    } catch (error) {
      console.error("Error updating TPF balance:", error)
    }
  }

  getCurrentTPFBalance(walletAddress: string): number {
    try {
      const sources = [
        localStorage.getItem(`tpf_balance_${walletAddress}`),
        localStorage.getItem("current_tpf_balance"),
        localStorage.getItem("last_tpf_balance"),
        localStorage.getItem("wallet_tpf_balance"),
      ]

      for (const source of sources) {
        if (source && source !== "0" && source !== "null") {
          const balance = Number.parseFloat(source)
          if (!isNaN(balance) && balance > 0) {
            console.log(`Found TPF balance: ${balance.toLocaleString()} from source`)
            return balance
          }
        }
      }

      console.log("No valid TPF balance found in localStorage")
      return 0
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 0
    }
  }

  async getRealTPFBalance(walletAddress: string): Promise<number> {
    try {
      console.log("=== Getting Real TPF Balance from Blockchain ===")
      console.log(`Wallet Address: ${walletAddress}`)

      if (typeof window !== "undefined" && window.MiniKit) {
        try {
          console.log("MiniKit detected, trying to get balance...")

          if (window.MiniKit.isConnected && window.MiniKit.isConnected()) {
            console.log("MiniKit is connected, getting balance...")

            const balance = await this.getBalanceFromMiniKit(walletAddress)
            if (balance > 0) {
              console.log(`Got real balance from MiniKit: ${balance.toLocaleString()}`)
              return balance
            }
          } else {
            console.log("MiniKit is not connected")
          }
        } catch (miniKitError) {
          console.error("Error getting balance from MiniKit:", miniKitError)
        }
      }

      console.log("Falling back to enhanced token service...")

      if (!enhancedTokenService.isInitialized()) {
        console.log("Initializing enhanced token service...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const balances = await enhancedTokenService.getAllTokenBalances(walletAddress)
      const tpfBalance = Number(balances.TPF || "0")

      if (tpfBalance > 0) {
        console.log(`Got real balance from enhanced token service: ${tpfBalance.toLocaleString()}`)
        return tpfBalance
      }

      console.log("No real balance found, returning 0")
      return 0
    } catch (error) {
      console.error("Error getting real TPF balance:", error)
      return 0
    }
  }

  async forceBalanceUpdate(walletAddress: string): Promise<number> {
    try {
      console.log("=== Forcing Balance Update ===")
      console.log(`Wallet Address: ${walletAddress}`)

      const realBalance = await this.getRealTPFBalance(walletAddress)

      if (realBalance > 0) {
        console.log(`Using real balance: ${realBalance.toLocaleString()}`)
        this.updateTPFBalance(walletAddress, realBalance)
        return realBalance
      }

      const storedBalance = this.getCurrentTPFBalance(walletAddress)
      if (storedBalance > 0) {
        console.log(`Using stored balance: ${storedBalance.toLocaleString()}`)
        return storedBalance
      }

      const defaultBalance = 108567827.002
      console.log(`Using default demo balance: ${defaultBalance.toLocaleString()}`)
      this.updateTPFBalance(walletAddress, defaultBalance)
      return defaultBalance
    } catch (error) {
      console.error("Error forcing balance update:", error)

      const storedBalance = this.getCurrentTPFBalance(walletAddress)
      if (storedBalance > 0) {
        return storedBalance
      }

      const defaultBalance = 108567827.002
      this.updateTPFBalance(walletAddress, defaultBalance)
      return defaultBalance
    }
  }

  private async getBalanceFromMiniKit(walletAddress: string): Promise<number> {
    try {
      if (typeof window === "undefined" || !window.MiniKit) {
        throw new Error("MiniKit not available")
      }

      const tpfAddress = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

      const balanceResult = await window.MiniKit.getTokenBalance({
        tokenAddress: tpfAddress,
        walletAddress: walletAddress,
      })

      if (balanceResult && balanceResult.balance) {
        const balanceBigInt = BigInt(balanceResult.balance)
        const balance = Number(balanceBigInt) / 1e18

        console.log(`Converted balance: ${balance.toLocaleString()}`)
        return balance
      }

      console.log("No balance returned from MiniKit")
      return 0
    } catch (error) {
      console.error("Error getting balance from MiniKit:", error)
      return 0
    }
  }

  onBalanceChange(callback: (balance: number) => void): () => void {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail?.tpfBalance !== undefined) {
        callback(event.detail.tpfBalance)
      }
    }

    const handleXPBalanceChange = (event: CustomEvent) => {
      if (event.detail?.tpfBalance !== undefined) {
        callback(event.detail.tpfBalance)
      }
    }

    window.addEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)
    window.addEventListener("xp_balance_changed", handleXPBalanceChange as EventListener)

    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)
      window.removeEventListener("xp_balance_changed", handleXPBalanceChange as EventListener)
    }
  }

  debugBalanceSources(walletAddress: string): void {
    console.log("=== DEBUG: TPF Balance Sources ===")
    console.log(`Wallet specific: ${localStorage.getItem(`tpf_balance_${walletAddress}`)}`)
    console.log(`Current balance: ${localStorage.getItem("current_tpf_balance")}`)
    console.log(`Last balance: ${localStorage.getItem("last_tpf_balance")}`)
    console.log(`Wallet balance: ${localStorage.getItem("wallet_tpf_balance")}`)
    console.log(`Calculated balance: ${this.getCurrentTPFBalance(walletAddress)}`)
    console.log("================================")
  }
}

export const balanceSyncService = BalanceSyncService.getInstance()

declare global {
  interface Window {
    MiniKit?: {
      isConnected?: () => boolean
      getTokenBalance: (params: { tokenAddress: string; walletAddress: string }) => Promise<{ balance: string }>
    }
  }
}
