import type { Transaction } from "./types"

class AlchemyExplorerService {
  private baseUrl = "https://worldchain-mainnet.explorer.alchemy.com/api"
  private rpcUrl = "https://worldchain-mainnet.g.alchemy.com/public"
  private debugLogs: string[] = []
  private timeout = 8000 // 8 segundos timeout

  private addDebugLog(message: string) {
    console.log(`🔍 ALCHEMY: ${message}`)
    this.debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50)
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "TPulseFi-Wallet/1.0",
          ...options.headers,
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    try {
      this.addDebugLog(`=== BUSCA REAL ALCHEMY EXPLORER ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Timeout: ${this.timeout}ms`)
      this.addDebugLog(`SEM FALLBACKS - APENAS DADOS REAIS`)

      // Endpoints otimizados - mais diretos e rápidos
      const fastEndpoints = [
        // Endpoint mais simples e rápido
        `${this.baseUrl}?module=account&action=txlist&address=${walletAddress}&page=1&offset=${limit}&sort=desc`,

        // Endpoint para tokens ERC20 (mais provável de ter dados)
        `${this.baseUrl}?module=account&action=tokentx&address=${walletAddress}&page=1&offset=${limit}&sort=desc`,
      ]

      // Tentar endpoints em paralelo para ser mais rápido
      this.addDebugLog(`🚀 Tentando ${fastEndpoints.length} endpoints em paralelo...`)

      const promises = fastEndpoints.map(async (endpoint, index) => {
        try {
          this.addDebugLog(`📡 Endpoint ${index + 1}: Iniciando...`)
          const response = await this.fetchWithTimeout(endpoint)

          if (!response.ok) {
            this.addDebugLog(`❌ Endpoint ${index + 1}: ${response.status}`)
            return null
          }

          const data = await response.json()
          this.addDebugLog(`✅ Endpoint ${index + 1}: Dados recebidos`)

          return { data, endpoint: index + 1 }
        } catch (error) {
          this.addDebugLog(`❌ Endpoint ${index + 1}: ${error.message}`)
          return null
        }
      })

      // Aguardar o primeiro que responder com sucesso
      const results = await Promise.allSettled(promises)

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const { data, endpoint } = result.value
          this.addDebugLog(`🎯 Usando resposta do endpoint ${endpoint}`)

          let transactions = []
          if (data.result && Array.isArray(data.result)) {
            transactions = data.result
          } else if (data.data && Array.isArray(data.data)) {
            transactions = data.data
          } else if (Array.isArray(data)) {
            transactions = data
          }

          if (transactions.length > 0) {
            const formatted = this.formatAlchemyTransactions(transactions, walletAddress)
            this.addDebugLog(`✅ ${formatted.length} transações REAIS formatadas`)
            return formatted
          }
        }
      }

      // Se APIs falharam, tentar RPC rápido
      this.addDebugLog(`⚡ APIs falharam, tentando RPC REAL...`)
      const rpcTransactions = await this.getTransactionsViaFastRPC(walletAddress, Math.min(limit, 10))

      if (rpcTransactions.length > 0) {
        this.addDebugLog(`✅ ${rpcTransactions.length} transações REAIS do RPC`)
        return rpcTransactions
      }

      // SEM FALLBACK - Se não tem dados reais, retorna vazio
      this.addDebugLog(`❌ NENHUMA TRANSAÇÃO REAL ENCONTRADA`)
      this.addDebugLog(`📊 Retornando array vazio - SEM MOCKS`)
      return []
    } catch (error) {
      this.addDebugLog(`❌ Erro geral: ${error.message}`)
      this.addDebugLog(`📊 Retornando array vazio - SEM FALLBACKS`)

      // SEM FALLBACK - apenas array vazio
      return []
    }
  }

  private async getTransactionsViaFastRPC(walletAddress: string, limit: number): Promise<Transaction[]> {
    try {
      this.addDebugLog(`⚡ RPC REAL: máximo ${limit} transações`)

      // Buscar apenas os últimos 20 blocos para ser rápido
      const latestBlockResponse = await this.fetchWithTimeout(this.rpcUrl, {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      })

      const latestBlockData = await latestBlockResponse.json()
      const latestBlock = Number.parseInt(latestBlockData.result, 16)
      this.addDebugLog(`📊 Bloco atual: ${latestBlock}`)

      const transactions: Transaction[] = []
      const blocksToCheck = 20 // Apenas 20 blocos para ser rápido

      // Verificar blocos em paralelo
      const blockPromises = []
      for (let i = 0; i < blocksToCheck && transactions.length < limit; i++) {
        const blockNumber = latestBlock - i
        blockPromises.push(this.getBlockTransactions(blockNumber, walletAddress))
      }

      const blockResults = await Promise.allSettled(blockPromises)

      for (const result of blockResults) {
        if (result.status === "fulfilled" && result.value.length > 0) {
          transactions.push(...result.value)
          if (transactions.length >= limit) break
        }
      }

      this.addDebugLog(`⚡ RPC REAL: ${transactions.length} transações encontradas`)
      return transactions.slice(0, limit)
    } catch (error) {
      this.addDebugLog(`❌ RPC REAL falhou: ${error.message}`)
      return []
    }
  }

  private async getBlockTransactions(blockNumber: number, walletAddress: string): Promise<Transaction[]> {
    try {
      const response = await this.fetchWithTimeout(this.rpcUrl, {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: [`0x${blockNumber.toString(16)}`, true],
          id: 1,
        }),
      })

      const blockData = await response.json()
      const transactions: Transaction[] = []

      if (blockData.result?.transactions) {
        const relevantTxs = blockData.result.transactions.filter(
          (tx: any) =>
            tx.from?.toLowerCase() === walletAddress.toLowerCase() ||
            tx.to?.toLowerCase() === walletAddress.toLowerCase(),
        )

        for (const tx of relevantTxs) {
          transactions.push({
            id: tx.hash,
            hash: tx.hash,
            type: tx.from?.toLowerCase() === walletAddress.toLowerCase() ? "send" : "receive",
            amount: (Number.parseInt(tx.value || "0", 16) / 1e18).toString(),
            tokenSymbol: "ETH",
            tokenAddress: "",
            from: tx.from,
            to: tx.to,
            timestamp: new Date(Number.parseInt(blockData.result.timestamp, 16) * 1000),
            status: "completed",
            blockNumber: blockNumber,
          })
        }
      }

      return transactions
    } catch (error) {
      return []
    }
  }

  private formatAlchemyTransactions(transactions: any[], walletAddress: string): Transaction[] {
    return transactions.slice(0, 20).map((tx, index) => {
      // Limitar a 20 para ser rápido
      // Determinar tipo de transação
      const from = tx.from || tx.fromAddress || ""
      const to = tx.to || tx.toAddress || ""
      const isReceive = to.toLowerCase() === walletAddress.toLowerCase()

      // Extrair valor rapidamente
      let amount = "0"
      if (tx.value) {
        try {
          amount = (Number.parseInt(tx.value, 16) / 1e18).toString()
        } catch {
          amount = tx.value
        }
      } else if (tx.tokenValue) {
        try {
          amount = (
            Number.parseInt(tx.tokenValue, 16) / Math.pow(10, Number.parseInt(tx.tokenDecimal || "18"))
          ).toString()
        } catch {
          amount = tx.tokenValue
        }
      }

      // Mapear tokens conhecidos rapidamente
      let tokenSymbol = tx.tokenSymbol || "ETH"
      if (tx.contractAddress) {
        const knownTokens: Record<string, string> = {
          "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45": "TPF",
          "0x2cFc85d8E48F8EAB294be644d9E25C3030863003": "WLD",
          "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113": "DNA",
          "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B": "WDD",
        }
        tokenSymbol = knownTokens[tx.contractAddress] || tokenSymbol
      }

      // Timestamp rápido
      let timestamp = new Date()
      if (tx.timeStamp) {
        timestamp = new Date(Number.parseInt(tx.timeStamp) * 1000)
      }

      return {
        id: tx.hash || tx.transactionHash || `tx_${index}`,
        hash: tx.hash || tx.transactionHash || "",
        type: isReceive ? "receive" : "send",
        amount: amount,
        tokenSymbol: tokenSymbol,
        tokenAddress: tx.contractAddress || "",
        from: from,
        to: to,
        timestamp: timestamp,
        status: "completed",
        blockNumber: Number.parseInt(tx.blockNumber, 16) || 0,
      }
    })
  }
}

export const alchemyExplorerService = new AlchemyExplorerService()
