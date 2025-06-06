// Serviço para sincronizar saldos entre páginas
class BalanceSyncService {
  private static instance: BalanceSyncService

  static getInstance(): BalanceSyncService {
    if (!BalanceSyncService.instance) {
      BalanceSyncService.instance = new BalanceSyncService()
    }
    return BalanceSyncService.instance
  }

  // Atualizar saldo TPF e notificar todas as páginas
  updateTPFBalance(walletAddress: string, balance: number): void {
    try {
      // Salvar no localStorage com múltiplas chaves para garantir persistência
      localStorage.setItem(`tpf_balance_${walletAddress}`, balance.toString())
      localStorage.setItem("current_tpf_balance", balance.toString())
      localStorage.setItem("last_tpf_balance", balance.toString())

      // Disparar evento para todas as páginas
      const event = new CustomEvent("tpf_balance_updated", {
        detail: {
          walletAddress,
          tpfBalance: balance,
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      // Disparar evento específico para atualização de XP
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

  // Obter saldo TPF atual com múltiplas fontes
  getCurrentTPFBalance(walletAddress: string): number {
    try {
      // Tentar múltiplas fontes de dados
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

      console.log("No valid TPF balance found, returning 0")
      return 0
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 0
    }
  }

  // Forçar atualização do saldo da carteira
  async forceBalanceUpdate(walletAddress: string): Promise<number> {
    try {
      // Tentar buscar do enhanced token service
      const { enhancedTokenService } = await import("@/services/enhanced-token-service")
      const balances = await enhancedTokenService.getAllTokenBalances(walletAddress)
      const tpfBalance = Number(balances.TPF || "0")

      if (tpfBalance > 0) {
        this.updateTPFBalance(walletAddress, tpfBalance)
        return tpfBalance
      }

      // Fallback: usar saldo salvo
      return this.getCurrentTPFBalance(walletAddress)
    } catch (error) {
      console.error("Error forcing balance update:", error)
      return this.getCurrentTPFBalance(walletAddress)
    }
  }

  // Escutar mudanças de saldo
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

    // Retornar função de cleanup
    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)
      window.removeEventListener("xp_balance_changed", handleXPBalanceChange as EventListener)
    }
  }

  // Debug: listar todas as fontes de saldo
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
