// Serviço APENAS para TPF definido manualmente pelo usuário
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
      console.log(`🔄 User manually setting TPF balance: ${balance.toLocaleString()} TPF`)

      const balanceStr = balance.toString()
      localStorage.setItem(`tpf_balance_${walletAddress}`, balanceStr)
      localStorage.setItem("current_tpf_balance", balanceStr)
      localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

      // Dispatch events
      const event = new CustomEvent("tpf_balance_updated", {
        detail: { walletAddress, tpfBalance: balance, timestamp: Date.now(), userSet: true },
      })
      window.dispatchEvent(event)

      console.log(`✅ TPF Balance manually set: ${balance.toLocaleString()} TPF`)
    } catch (error) {
      console.error("Error updating TPF balance:", error)
    }
  }

  getCurrentTPFBalance(walletAddress: string): number {
    try {
      // Só retornar se foi definido pelo usuário (tem timestamp)
      const timestamp = localStorage.getItem("tpf_balance_timestamp")
      if (!timestamp) {
        console.log("📊 No user-set TPF balance found")
        return 0
      }

      const balance =
        localStorage.getItem(`tpf_balance_${walletAddress}`) || localStorage.getItem("current_tpf_balance")

      if (balance && balance !== "0" && balance !== "null") {
        const numBalance = Number.parseFloat(balance)
        if (!isNaN(numBalance) && numBalance > 0) {
          console.log(`✅ Found user-set TPF balance: ${numBalance}`)
          return numBalance
        }
      }

      console.log("📊 No valid user-set TPF balance")
      return 0
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 0
    }
  }

  async forceBalanceUpdate(walletAddress: string): Promise<number> {
    try {
      console.log("🔄 Force balance update - checking for REAL balance...")

      // Tentar obter saldo real da blockchain primeiro
      const realBalance = await this.getRealTPFBalance(walletAddress)
      if (realBalance > 0) {
        console.log(`✅ Found real TPF balance: ${realBalance}`)
        this.updateTPFBalance(walletAddress, realBalance)
        return realBalance
      }

      // Se não tem saldo real, verificar se usuário definiu manualmente
      const userSetBalance = this.getCurrentTPFBalance(walletAddress)
      if (userSetBalance > 0) {
        console.log(`✅ Using user-set TPF balance: ${userSetBalance}`)
        return userSetBalance
      }

      console.log("📊 No TPF balance found (real or user-set)")
      return 0
    } catch (error) {
      console.error("Error forcing balance update:", error)
      return 0
    }
  }

  private async getRealTPFBalance(walletAddress: string): Promise<number> {
    try {
      console.log("🔍 Checking for REAL TPF balance...")

      // Tentar MiniKit primeiro
      if (typeof window !== "undefined" && window.MiniKit?.getTokenBalance) {
        try {
          const result = await window.MiniKit.getTokenBalance({
            tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPF
            walletAddress: walletAddress,
          })

          if (result?.balance) {
            const balance = Number(result.balance) / 1e18
            console.log(`✅ Real TPF balance from MiniKit: ${balance}`)
            return balance
          }
        } catch (miniKitError) {
          console.log("⚠️ MiniKit TPF balance failed:", miniKitError.message)
        }
      }

      console.log("📊 No real TPF balance found")
      return 0
    } catch (error) {
      console.error("Error getting real TPF balance:", error)
      return 0
    }
  }

  onBalanceChange(callback: (balance: number) => void): () => void {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail?.tpfBalance !== undefined) {
        callback(event.detail.tpfBalance)
      }
    }

    window.addEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)

    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)
    }
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
