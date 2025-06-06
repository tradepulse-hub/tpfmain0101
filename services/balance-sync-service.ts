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
      // Salvar no localStorage
      localStorage.setItem(`tpf_balance_${walletAddress}`, balance.toString())
      localStorage.setItem("current_tpf_balance", balance.toString())

      // Disparar evento para todas as páginas
      const event = new CustomEvent("tpf_balance_updated", {
        detail: {
          walletAddress,
          tpfBalance: balance,
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      console.log(`TPF Balance updated: ${balance.toLocaleString()} TPF`)
    } catch (error) {
      console.error("Error updating TPF balance:", error)
    }
  }

  // Obter saldo TPF atual
  getCurrentTPFBalance(walletAddress: string): number {
    try {
      const savedBalance =
        localStorage.getItem(`tpf_balance_${walletAddress}`) || localStorage.getItem("current_tpf_balance") || "0"
      return Number.parseFloat(savedBalance)
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 0
    }
  }

  // Sincronizar saldo da página da carteira
  syncFromWallet(walletAddress: string): void {
    try {
      // Tentar obter do localStorage da carteira
      const walletBalance = localStorage.getItem("wallet_tpf_balance")
      if (walletBalance) {
        const balance = Number.parseFloat(walletBalance)
        this.updateTPFBalance(walletAddress, balance)
      }
    } catch (error) {
      console.error("Error syncing from wallet:", error)
    }
  }

  // Escutar mudanças de saldo
  onBalanceChange(callback: (balance: number) => void): () => void {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail?.tpfBalance !== undefined) {
        callback(event.detail.tpfBalance)
      }
    }

    window.addEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)

    // Retornar função de cleanup
    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate as EventListener)
    }
  }
}

export const balanceSyncService = BalanceSyncService.getInstance()
