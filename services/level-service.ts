import { balanceSyncService } from "./balance-sync-service"

// Serviço para gerenciar sistema de níveis e XP
class LevelService {
  private static instance: LevelService

  static getInstance(): LevelService {
    if (!LevelService.instance) {
      LevelService.instance = new LevelService()
    }
    return LevelService.instance
  }

  // Calcular XP necessário para um nível específico
  getXPRequiredForLevel(level: number): number {
    if (level <= 1) return 0
    // Fórmula progressiva: cada nível requer mais XP
    // Nível 2: 100 XP, Nível 3: 250 XP, Nível 4: 450 XP, etc.
    return Math.floor(100 * Math.pow(level - 1, 1.5))
  }

  // Calcular nível baseado no XP total
  calculateLevel(totalXP: number): number {
    let level = 1
    while (this.getXPRequiredForLevel(level + 1) <= totalXP) {
      level++
    }
    return level
  }

  // Calcular XP atual no nível (para barra de progresso)
  getCurrentLevelXP(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP)
    const currentLevelRequiredXP = this.getXPRequiredForLevel(currentLevel)
    return totalXP - currentLevelRequiredXP
  }

  // Calcular XP necessário para o próximo nível
  getXPForNextLevel(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP)
    const nextLevelRequiredXP = this.getXPRequiredForLevel(currentLevel + 1)
    const currentLevelRequiredXP = this.getXPRequiredForLevel(currentLevel)
    return nextLevelRequiredXP - currentLevelRequiredXP
  }

  // Calcular multiplicador de recompensas baseado no nível
  getRewardMultiplier(level: number): number {
    if (level <= 1) return 1.01
    if (level <= 10) return 1 + level * 0.01 // 1.01 a 1.10
    if (level <= 50) return 1.1 + (level - 10) * 0.01 // 1.10 a 1.50
    if (level <= 100) return 1.5 + (level - 50) * 0.01 // 1.50 a 2.00
    // Acima do nível 100, crescimento mais lento
    return 2.0 + (level - 100) * 0.005 // 2.00+
  }

  // Calcular XP total baseado em check-ins e saldo TPF
  calculateTotalXP(checkInXP: number, tpfBalance: number): number {
    const tpfXP = Math.floor(tpfBalance * 0.001) // 1 TPF = 0.001 XP
    const totalXP = checkInXP + tpfXP
    console.log(
      `XP Calculation: CheckIn=${checkInXP}, TPF=${tpfBalance.toLocaleString()}, TPF_XP=${tpfXP}, Total=${totalXP}`,
    )
    return totalXP
  }

  // Adicionar XP de check-in
  addCheckInXP(): number {
    const currentCheckInXP = this.getCheckInXP()
    const newCheckInXP = currentCheckInXP + 10

    try {
      localStorage.setItem("tpf_checkin_xp", newCheckInXP.toString())

      // Disparar evento de atualização de XP
      const event = new CustomEvent("xp_updated", {
        detail: { checkInXP: newCheckInXP },
      })
      window.dispatchEvent(event)

      console.log(`Check-in XP updated: ${newCheckInXP}`)
      return newCheckInXP
    } catch (error) {
      console.error("Error saving check-in XP:", error)
      return currentCheckInXP
    }
  }

  // Obter XP de check-ins
  getCheckInXP(): number {
    try {
      const savedXP = localStorage.getItem("tpf_checkin_xp")
      const xp = savedXP ? Number.parseInt(savedXP) : 0
      console.log(`Check-in XP: ${xp}`)
      return xp
    } catch (error) {
      console.error("Error loading check-in XP:", error)
      return 0
    }
  }

  // Obter saldo TPF atual com fallback robusto
  getCurrentTPFBalance(walletAddress: string): number {
    const balance = balanceSyncService.getCurrentTPFBalance(walletAddress)
    console.log(`Current TPF Balance for ${walletAddress}: ${balance.toLocaleString()}`)
    return balance
  }

  // Obter informações completas do nível do usuário
  getUserLevelInfo(
    walletAddress: string,
    manualTPFBalance?: number,
  ): {
    level: number
    totalXP: number
    currentLevelXP: number
    nextLevelXP: number
    rewardMultiplier: number
    progressPercentage: number
    checkInXP: number
    tpfXP: number
    tpfBalance: number
  } {
    console.log("=== Getting User Level Info ===")
    console.log(`Wallet: ${walletAddress}`)
    console.log(`Manual TPF Balance: ${manualTPFBalance?.toLocaleString() || "Not provided"}`)

    const checkInXP = this.getCheckInXP()
    const tpfBalance = manualTPFBalance !== undefined ? manualTPFBalance : this.getCurrentTPFBalance(walletAddress)

    console.log(`Using TPF Balance: ${tpfBalance.toLocaleString()}`)
    console.log(`Check-in XP: ${checkInXP}`)

    const totalXP = this.calculateTotalXP(checkInXP, tpfBalance)
    const level = this.calculateLevel(totalXP)
    const currentLevelXP = this.getCurrentLevelXP(totalXP)
    const nextLevelXP = this.getXPForNextLevel(totalXP)
    const rewardMultiplier = this.getRewardMultiplier(level)
    const progressPercentage = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100
    const tpfXP = Math.floor(tpfBalance * 0.001)

    const result = {
      level,
      totalXP,
      currentLevelXP,
      nextLevelXP,
      rewardMultiplier,
      progressPercentage,
      checkInXP,
      tpfXP,
      tpfBalance,
    }

    console.log("=== Level Info Result ===")
    console.log(`TPF Balance: ${tpfBalance.toLocaleString()}`)
    console.log(`Check-in XP: ${checkInXP}`)
    console.log(`TPF XP: ${tpfXP}`)
    console.log(`Total XP: ${totalXP}`)
    console.log(`Level: ${level}`)
    console.log(`Multiplier: ${rewardMultiplier}x`)
    console.log("========================")

    return result
  }

  // Forçar recálculo do nível
  async forceRecalculateLevel(walletAddress: string): Promise<{
    level: number
    totalXP: number
    currentLevelXP: number
    nextLevelXP: number
    rewardMultiplier: number
    progressPercentage: number
    checkInXP: number
    tpfXP: number
    tpfBalance: number
  }> {
    console.log("=== Forcing Level Recalculation ===")

    // Forçar atualização do saldo
    const updatedBalance = await balanceSyncService.forceBalanceUpdate(walletAddress)
    console.log(`Forced balance update result: ${updatedBalance.toLocaleString()}`)

    // Recalcular com saldo atualizado
    const levelInfo = this.getUserLevelInfo(walletAddress, updatedBalance)

    // Disparar evento de atualização
    const event = new CustomEvent("level_updated", {
      detail: levelInfo,
    })
    window.dispatchEvent(event)

    console.log("=== Level Recalculation Complete ===")
    return levelInfo
  }

  // Obter cor do nível baseada no nível
  getLevelColor(level: number): string {
    if (level <= 5) return "#10B981" // Verde
    if (level <= 15) return "#3B82F6" // Azul
    if (level <= 30) return "#8B5CF6" // Roxo
    if (level <= 50) return "#F59E0B" // Amarelo/Dourado
    if (level <= 75) return "#EF4444" // Vermelho
    if (level <= 100) return "#EC4899" // Rosa
    return "#6366F1" // Índigo para níveis muito altos
  }

  // Obter ícone do nível baseado no nível
  getLevelIcon(level: number): string {
    if (level <= 5) return "🌱" // Iniciante
    if (level <= 15) return "⭐" // Estrela
    if (level <= 30) return "💎" // Diamante
    if (level <= 50) return "👑" // Coroa
    if (level <= 75) return "🔥" // Fogo
    if (level <= 100) return "⚡" // Raio
    return "🚀" // Foguete para níveis muito altos
  }

  // Debug: mostrar todas as informações de XP
  debugXPInfo(walletAddress: string): void {
    console.log("=== XP DEBUG INFO ===")
    balanceSyncService.debugBalanceSources(walletAddress)
    const levelInfo = this.getUserLevelInfo(walletAddress)
    console.log("Level Info:", levelInfo)
    console.log("====================")
  }
}

export const levelService = LevelService.getInstance()
