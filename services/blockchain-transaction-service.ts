import { ethers } from "ethers"
import type { Transaction } from "./types"

// ABI simplificado para tokens ERC20
const ERC20_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
]

// Informações sobre tokens suportados
const TOKENS_INFO = {
  "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45": {
    symbol: "TPF",
    decimals: 18,
  },
  "0x2cFc85d8E48F8EAB294be644d9E25C3030863003": {
    symbol: "WLD",
    decimals: 18,
  },
  "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113": {
    symbol: "DNA",
    decimals: 18,
  },
  "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575": {
    symbol: "CASH",
    decimals: 18,
  },
  "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B": {
    symbol: "WDD",
    decimals: 18,
  },
}

class BlockchainTransactionService {
  private provider: ethers.JsonRpcProvider | null = null
  private tokenContracts: Record<string, ethers.Contract> = {}
  private initialized = false
  private debugLogs: string[] = []

  private addDebugLog(message: string) {
    console.log(`🔗 BLOCKCHAIN: ${message}`)
    this.debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50)
    }
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      this.addDebugLog("=== INICIALIZANDO BLOCKCHAIN SERVICE ===")

      // Inicializar provider
      this.provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")

      // Verificar se o provider está funcionando
      const blockNumber = await this.provider.getBlockNumber()
      this.addDebugLog(`✅ Conectado à Worldchain, bloco atual: ${blockNumber}`)

      // Inicializar contratos para todos os tokens suportados
      for (const [address, tokenInfo] of Object.entries(TOKENS_INFO)) {
        try {
          this.tokenContracts[address] = new ethers.Contract(address, ERC20_ABI, this.provider)
          this.addDebugLog(`✅ Contrato ${tokenInfo.symbol} inicializado: ${address}`)
        } catch (error) {
          this.addDebugLog(`❌ Erro ao inicializar contrato ${tokenInfo.symbol}: ${error.message}`)
        }
      }

      this.initialized = true
      this.addDebugLog("✅ Blockchain service inicializado com sucesso")
    } catch (error) {
      this.addDebugLog(`❌ Erro na inicialização: ${error.message}`)
      console.error("Failed to initialize blockchain service:", error)
    }
  }

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      this.addDebugLog(`=== BUSCANDO TRANSAÇÕES REAIS DA BLOCKCHAIN ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Limite: ${limit}`)

      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.provider) {
        this.addDebugLog("❌ Provider não inicializado")
        return []
      }

      // Verificar se o endereço é válido
      if (!ethers.isAddress(walletAddress)) {
        this.addDebugLog("❌ Endereço inválido")
        return []
      }

      const allTransactions: Transaction[] = []

      // Obter o bloco atual
      const currentBlock = await this.provider.getBlockNumber()
      this.addDebugLog(`📊 Bloco atual: ${currentBlock}`)

      // Buscar eventos dos últimos 50000 blocos (aproximadamente 1 semana)
      const fromBlock = Math.max(0, currentBlock - 50000)
      this.addDebugLog(`🔍 Buscando eventos do bloco ${fromBlock} ao ${currentBlock}`)

      // Buscar transações para cada token
      for (const [contractAddress, contract] of Object.entries(this.tokenContracts)) {
        try {
          const tokenInfo = TOKENS_INFO[contractAddress]
          this.addDebugLog(`🔍 Buscando transações ${tokenInfo.symbol}...`)

          // Criar filtros para eventos de transferência enviados e recebidos
          const sentFilter = contract.filters.Transfer(walletAddress, null)
          const receivedFilter = contract.filters.Transfer(null, walletAddress)

          // Buscar eventos de transferência
          const [sentEvents, receivedEvents] = await Promise.all([
            contract.queryFilter(sentFilter, fromBlock),
            contract.queryFilter(receivedFilter, fromBlock),
          ])

          this.addDebugLog(`📤 ${sentEvents.length} eventos enviados para ${tokenInfo.symbol}`)
          this.addDebugLog(`📥 ${receivedEvents.length} eventos recebidos para ${tokenInfo.symbol}`)

          // Processar eventos enviados
          for (const event of sentEvents) {
            try {
              const block = await this.provider.getBlock(event.blockNumber!)
              const timestamp = block?.timestamp ? new Date(Number(block.timestamp) * 1000) : new Date()

              const value = ethers.formatUnits(event.args![2], tokenInfo.decimals)

              allTransactions.push({
                id: `${event.transactionHash}-${event.logIndex}-sent`,
                hash: event.transactionHash!,
                type: "send",
                amount: value,
                tokenSymbol: tokenInfo.symbol,
                tokenAddress: contractAddress,
                from: event.args![0],
                to: event.args![1],
                timestamp: timestamp,
                status: "completed",
                blockNumber: event.blockNumber!,
              })
            } catch (error) {
              this.addDebugLog(`❌ Erro processando evento enviado ${tokenInfo.symbol}: ${error.message}`)
            }
          }

          // Processar eventos recebidos
          for (const event of receivedEvents) {
            try {
              const block = await this.provider.getBlock(event.blockNumber!)
              const timestamp = block?.timestamp ? new Date(Number(block.timestamp) * 1000) : new Date()

              const value = ethers.formatUnits(event.args![2], tokenInfo.decimals)

              allTransactions.push({
                id: `${event.transactionHash}-${event.logIndex}-received`,
                hash: event.transactionHash!,
                type: "receive",
                amount: value,
                tokenSymbol: tokenInfo.symbol,
                tokenAddress: contractAddress,
                from: event.args![0],
                to: event.args![1],
                timestamp: timestamp,
                status: "completed",
                blockNumber: event.blockNumber!,
              })
            } catch (error) {
              this.addDebugLog(`❌ Erro processando evento recebido ${tokenInfo.symbol}: ${error.message}`)
            }
          }
        } catch (error) {
          this.addDebugLog(`❌ Erro buscando transações ${TOKENS_INFO[contractAddress].symbol}: ${error.message}`)
        }
      }

      this.addDebugLog(`📊 Total de transações encontradas: ${allTransactions.length}`)

      // Ordenar por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Limitar o número de transações
      const limitedTransactions = allTransactions.slice(0, limit)

      this.addDebugLog(`✅ Retornando ${limitedTransactions.length} transações reais`)

      // Log das primeiras transações
      if (limitedTransactions.length > 0) {
        this.addDebugLog("=== PRIMEIRAS TRANSAÇÕES ENCONTRADAS ===")
        limitedTransactions.slice(0, 3).forEach((tx, index) => {
          this.addDebugLog(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ${tx.tokenSymbol} - ${tx.hash}`)
        })
      }

      return limitedTransactions
    } catch (error) {
      this.addDebugLog(`❌ Erro geral: ${error.message}`)
      console.error("Error fetching blockchain transactions:", error)
      return []
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }
}

export const blockchainTransactionService = new BlockchainTransactionService()
