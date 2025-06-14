import type { Transaction } from "./types"

class AlchemyExplorerService {
  private baseUrl = "https://worldchain-mainnet.explorer.alchemy.com/api"
  private debugLogs: string[] = []

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

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    try {
      this.addDebugLog(`=== BUSCANDO HISTÓRICO NO ALCHEMY EXPLORER ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // Tentar diferentes endpoints da API do Alchemy Explorer
      const endpoints = [
        // Endpoint padrão para transações
        `${this.baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=${Math.floor(offset / limit) + 1}&offset=${limit}&sort=desc`,

        // Endpoint para transações internas
        `${this.baseUrl}?module=account&action=txlistinternal&address=${walletAddress}&startblock=0&endblock=99999999&page=${Math.floor(offset / limit) + 1}&offset=${limit}&sort=desc`,

        // Endpoint para transações de tokens ERC20
        `${this.baseUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&page=${Math.floor(offset / limit) + 1}&offset=${limit}&sort=desc`,

        // Endpoint alternativo
        `${this.baseUrl}/v1/addresses/${walletAddress}/transactions?limit=${limit}&offset=${offset}`,
      ]

      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i]
        this.addDebugLog(`🔄 Tentando endpoint ${i + 1}/${endpoints.length}...`)
        this.addDebugLog(`URL: ${endpoint}`)

        try {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "User-Agent": "TPulseFi-Wallet/1.0",
            },
          })

          this.addDebugLog(`📡 Response status: ${response.status}`)
          this.addDebugLog(`📡 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

          if (!response.ok) {
            this.addDebugLog(`❌ Endpoint ${i + 1} falhou: ${response.status} ${response.statusText}`)
            continue
          }

          const data = await response.json()
          this.addDebugLog(`📊 Dados recebidos: ${JSON.stringify(data).substring(0, 500)}...`)

          // Processar diferentes formatos de resposta
          let transactions = []

          if (data.result && Array.isArray(data.result)) {
            // Formato Etherscan-like
            transactions = data.result
            this.addDebugLog(`✅ Formato Etherscan: ${transactions.length} transações`)
          } else if (data.data && Array.isArray(data.data)) {
            // Formato alternativo
            transactions = data.data
            this.addDebugLog(`✅ Formato alternativo: ${transactions.length} transações`)
          } else if (Array.isArray(data)) {
            // Array direto
            transactions = data
            this.addDebugLog(`✅ Array direto: ${transactions.length} transações`)
          } else {
            this.addDebugLog(`⚠️ Formato não reconhecido: ${typeof data}`)
            continue
          }

          if (transactions.length > 0) {
            const formattedTransactions = this.formatAlchemyTransactions(transactions, walletAddress)
            this.addDebugLog(`✅ ${formattedTransactions.length} transações formatadas com sucesso`)
            return formattedTransactions
          } else {
            this.addDebugLog(`⚠️ Endpoint ${i + 1} retornou array vazio`)
          }
        } catch (fetchError) {
          this.addDebugLog(`❌ Erro no fetch endpoint ${i + 1}: ${fetchError.message}`)
        }
      }

      // Se nenhum endpoint funcionou, tentar busca manual via RPC
      this.addDebugLog(`🔄 Tentando busca manual via RPC...`)
      return await this.getTransactionsViaRPC(walletAddress, limit)
    } catch (error) {
      this.addDebugLog(`❌ Erro geral: ${error.message}`)
      console.error("Error getting transaction history from Alchemy:", error)
      throw error
    }
  }

  private async getTransactionsViaRPC(walletAddress: string, limit: number): Promise<Transaction[]> {
    try {
      this.addDebugLog(`🔄 Buscando via RPC direto...`)

      const rpcUrl = "https://worldchain-mainnet.g.alchemy.com/public"

      // Buscar o bloco mais recente
      const latestBlockResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      })

      const latestBlockData = await latestBlockResponse.json()
      const latestBlock = Number.parseInt(latestBlockData.result, 16)
      this.addDebugLog(`📊 Bloco mais recente: ${latestBlock}`)

      // Buscar transações dos últimos blocos
      const transactions: Transaction[] = []
      const blocksToCheck = Math.min(100, latestBlock) // Verificar últimos 100 blocos

      for (let i = 0; i < blocksToCheck && transactions.length < limit; i++) {
        const blockNumber = latestBlock - i

        try {
          const blockResponse = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBlockByNumber",
              params: [`0x${blockNumber.toString(16)}`, true],
              id: 1,
            }),
          })

          const blockData = await blockResponse.json()

          if (blockData.result && blockData.result.transactions) {
            const blockTransactions = blockData.result.transactions.filter(
              (tx: any) =>
                tx.from?.toLowerCase() === walletAddress.toLowerCase() ||
                tx.to?.toLowerCase() === walletAddress.toLowerCase(),
            )

            for (const tx of blockTransactions) {
              if (transactions.length >= limit) break

              transactions.push({
                id: tx.hash,
                hash: tx.hash,
                type: tx.from?.toLowerCase() === walletAddress.toLowerCase() ? "send" : "receive",
                amount: (Number.parseInt(tx.value, 16) / 1e18).toString(),
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
        } catch (blockError) {
          this.addDebugLog(`⚠️ Erro no bloco ${blockNumber}: ${blockError.message}`)
        }
      }

      this.addDebugLog(`✅ Encontradas ${transactions.length} transações via RPC`)
      return transactions
    } catch (rpcError) {
      this.addDebugLog(`❌ Erro RPC: ${rpcError.message}`)
      return []
    }
  }

  private formatAlchemyTransactions(transactions: any[], walletAddress: string): Transaction[] {
    return transactions.map((tx, index) => {
      this.addDebugLog(`Formatando transação ${index + 1}: ${tx.hash || tx.transactionHash || "sem hash"}`)

      // Determinar tipo de transação
      const from = tx.from || tx.fromAddress || ""
      const to = tx.to || tx.toAddress || ""
      const isReceive = to.toLowerCase() === walletAddress.toLowerCase()
      const isSend = from.toLowerCase() === walletAddress.toLowerCase()

      // Extrair valor
      let amount = "0"
      if (tx.value) {
        amount = (Number.parseInt(tx.value, 16) / 1e18).toString()
      } else if (tx.amount) {
        amount = tx.amount
      } else if (tx.tokenValue) {
        amount = (
          Number.parseInt(tx.tokenValue, 16) / Math.pow(10, Number.parseInt(tx.tokenDecimal || "18"))
        ).toString()
      }

      // Extrair símbolo do token
      let tokenSymbol = "ETH"
      if (tx.tokenSymbol) {
        tokenSymbol = tx.tokenSymbol
      } else if (tx.contractAddress) {
        // Mapear endereços conhecidos
        const knownTokens: Record<string, string> = {
          "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45": "TPF",
          "0x2cFc85d8E48F8EAB294be644d9E25C3030863003": "WLD",
          "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113": "DNA",
          "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B": "WDD",
        }
        tokenSymbol = knownTokens[tx.contractAddress] || "UNKNOWN"
      }

      // Extrair timestamp
      let timestamp = new Date()
      if (tx.timeStamp) {
        timestamp = new Date(Number.parseInt(tx.timeStamp) * 1000)
      } else if (tx.timestamp) {
        timestamp = new Date(tx.timestamp)
      }

      return {
        id: tx.hash || tx.transactionHash || `tx_${index}`,
        hash: tx.hash || tx.transactionHash || "",
        type: isReceive ? "receive" : isSend ? "send" : "swap",
        amount: amount,
        tokenSymbol: tokenSymbol,
        tokenAddress: tx.contractAddress || tx.tokenAddress || "",
        from: from,
        to: to,
        timestamp: timestamp,
        status: "completed",
        blockNumber: Number.parseInt(tx.blockNumber, 16) || 0,
      }
    })
  }

  async getTokenTransactions(walletAddress: string, tokenAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      this.addDebugLog(`🔍 Buscando transações do token ${tokenAddress}...`)

      const endpoint = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${tokenAddress}&address=${walletAddress}&page=1&offset=${limit}&sort=desc`

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.result && Array.isArray(data.result)) {
        return this.formatAlchemyTransactions(data.result, walletAddress)
      }

      return []
    } catch (error) {
      this.addDebugLog(`❌ Erro ao buscar transações do token: ${error.message}`)
      return []
    }
  }
}

export const alchemyExplorerService = new AlchemyExplorerService()
