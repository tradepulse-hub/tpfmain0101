import { holdstationService } from "./holdstation-service"
import type { Transaction } from "./types"

class HoldstationHistoryService {
  private watchers: Map<string, { start: () => Promise<void>; stop: () => Promise<void> }> = new Map()

  async watchTransactions(
    walletAddress: string,
    callback?: (transactions: Transaction[]) => void,
  ): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
    try {
      console.log(`🔍 Setting up transaction watcher for: ${walletAddress}`)

      const manager = holdstationService.getManager()
      if (!manager) {
        throw new Error("Manager not available")
      }

      // Stop existing watcher if any
      if (this.watchers.has(walletAddress)) {
        await this.watchers.get(walletAddress)?.stop()
        this.watchers.delete(walletAddress)
      }

      // Get current block for starting point
      const currentBlock = await manager.client.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 100000) // Last 100k blocks
      const toBlock = currentBlock

      console.log(`📊 Watching blocks ${fromBlock} to ${toBlock}`)

      // Setup watcher
      const watcher = await manager.watch(walletAddress, fromBlock, toBlock)

      // Store watcher
      this.watchers.set(walletAddress, watcher)

      return watcher
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
      throw error
    }
  }

  async getTransactions(walletAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting transactions for: ${walletAddress}`)

      const manager = holdstationService.getManager()
      if (!manager) {
        throw new Error("Manager not available")
      }

      // Get transactions from storage
      const transactions = await manager.transactionStorage.find(0, limit)

      // Convert to our Transaction format
      const formattedTransactions: Transaction[] = transactions.map((tx) => ({
        id: tx.hash,
        hash: tx.hash,
        type: this.determineTransactionType(tx, walletAddress),
        amount: this.extractAmount(tx, walletAddress),
        tokenSymbol: this.extractTokenSymbol(tx),
        tokenAddress: this.extractTokenAddress(tx),
        from: this.extractFrom(tx, walletAddress),
        to: this.extractTo(tx, walletAddress),
        timestamp: tx.date || new Date(tx.block * 1000),
        status: tx.success === 2 ? "completed" : tx.success === 1 ? "failed" : "pending",
        blockNumber: tx.block,
      }))

      console.log(`Found ${formattedTransactions.length} transactions`)
      return formattedTransactions
    } catch (error) {
      console.error("Error getting transactions:", error)
      return []
    }
  }

  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    if (tx.transfers && tx.transfers.length > 1) {
      return "swap"
    }

    if (tx.transfers && tx.transfers.length === 1) {
      const transfer = tx.transfers[0]
      const isReceiving = transfer.to.toLowerCase().includes(walletAddress.toLowerCase())
      return isReceiving ? "receive" : "send"
    }

    return "send"
  }

  private extractAmount(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const transfer = tx.transfers[0]
      return (Number.parseFloat(transfer.amount) / Math.pow(10, 18)).toFixed(6)
    }
    return "0"
  }

  private extractTokenSymbol(tx: any): string {
    // Map known token addresses to symbols
    const tokenMap: Record<string, string> = {
      "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45": "TPF",
      "0x2cFc85d8E48F8EAB294be644d9E25C3030863003": "WLD",
      "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113": "DNA",
      "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B": "WDD",
    }

    if (tx.transfers && tx.transfers.length > 0) {
      const tokenAddress = tx.transfers[0].tokenAddress.toLowerCase()
      return tokenMap[tokenAddress] || "UNKNOWN"
    }
    return "ETH"
  }

  private extractTokenAddress(tx: any): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].tokenAddress
    }
    return "0x0000000000000000000000000000000000000000"
  }

  private extractFrom(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].from
    }
    return tx.from || ""
  }

  private extractTo(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].to
    }
    return tx.to || ""
  }

  async stopWatching(walletAddress: string): Promise<void> {
    try {
      const watcher = this.watchers.get(walletAddress)
      if (watcher) {
        await watcher.stop()
        this.watchers.delete(walletAddress)
        console.log(`🛑 Stopped watching transactions for: ${walletAddress}`)
      }
    } catch (error) {
      console.error("Error stopping transaction watcher:", error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      for (const [address, watcher] of this.watchers) {
        await watcher.stop()
      }
      this.watchers.clear()
      console.log("🧹 Cleaned up all transaction watchers")
    } catch (error) {
      console.error("Error during cleanup:", error)
    }
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
