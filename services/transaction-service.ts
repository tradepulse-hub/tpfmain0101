// Serviço para gerenciar transações
import { MiniKit } from "@worldcoin/minikit-js"
import { ethers } from "ethers"

export interface Transaction {
  id: string
  type: "send" | "receive"
  amount: number
  date: string
  address: string
  status: "pending" | "completed" | "failed"
  hash?: string
  blockNumber?: number
  tokenSymbol?: string
  from?: string
  to?: string
}

// ABI simplificado para tokens ERC20
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
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
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
]

// Endereço do contrato TPF na Worldchain
const TPF_CONTRACT_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

// Informações sobre tokens suportados
const TOKENS_INFO = {
  TPF: {
    name: "TPulseFi Token",
    symbol: "TPF",
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    decimals: 18,
    logo: "/logo-tpf.png",
  },
  WLD: {
    name: "Worldcoin",
    symbol: "WLD",
    address: "0x163f8C2467924be0ae7B5347228CABF260318753",
    decimals: 18,
    logo: "/worldcoin-logo.png",
  },
  DNA: {
    name: "DNA Token",
    symbol: "DNA",
    address: "0x8D2Cb35893C01fa8B564c84Bd540c5109d9fB6DB",
    decimals: 18,
    logo: "/dna-double-helix.png",
  },
  CASH: {
    name: "Cash Token",
    symbol: "CASH",
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    decimals: 18,
    logo: "/cash-pile.png",
  },
  WDD: {
    name: "World Dollar",
    symbol: "WDD",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    logo: "/placeholder-paov4.png",
  },
}

// Lista de RPCs para World Chain
const RPC_ENDPOINTS = [
  "https://worldchain-mainnet.g.alchemy.com/public", // RPC principal da World Chain
  "https://rpc.worldcoin.org",
  "https://worldchain-testnet.g.alchemy.com/public",
  "https://rpc-testnet.worldcoin.org",
]

// URL do explorador da blockchain
const EXPLORER_URL = "https://worldscan.org"

class TransactionService {
  private transactions: Transaction[] = []
  private initialized = false
  private provider: ethers.JsonRpcProvider | null = null
  private tpfContract: ethers.Contract | null = null
  private tokenContracts: Record<string, ethers.Contract> = {}

  constructor() {
    // Inicializar o serviço apenas no lado do cliente
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("Initializing transaction service...")

    // Inicializar provider
    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        console.log(`Trying to connect to RPC: ${rpcUrl}`)
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Verificar se o provider está funcionando
        const blockNumber = await provider.getBlockNumber()
        console.log(`Connected to RPC ${rpcUrl}, current block: ${blockNumber}`)

        this.provider = provider

        // Inicializar contratos para todos os tokens suportados
        for (const [symbol, tokenInfo] of Object.entries(TOKENS_INFO)) {
          try {
            this.tokenContracts[symbol] = new ethers.Contract(tokenInfo.address, ERC20_ABI, provider)
            console.log(`Initialized contract for ${symbol} at ${tokenInfo.address}`)
          } catch (error) {
            console.error(`Failed to initialize contract for ${symbol}:`, error)
          }
        }

        // Manter referência específica para o contrato TPF para compatibilidade
        this.tpfContract = this.tokenContracts.TPF || null

        console.log(`Successfully connected to RPC: ${rpcUrl}`)
        break
      } catch (error) {
        console.error(`Failed to connect to RPC ${rpcUrl}:`, error)
      }
    }

    // Carregar transações do localStorage (como fallback)
    const savedTransactions = localStorage.getItem("tpf_transactions")
    if (savedTransactions) {
      try {
        this.transactions = JSON.parse(savedTransactions)
        console.log(`Loaded ${this.transactions.length} transactions from localStorage`)
      } catch (error) {
        console.error("Error parsing saved transactions:", error)
        this.transactions = []
      }
    }

    // Se não houver transações salvas, criar algumas de exemplo
    if (this.transactions.length === 0) {
      this.generateMockTransactions()
    }

    this.initialized = true
  }

  // Gerar transações de exemplo
  private generateMockTransactions() {
    console.log("Generating mock transactions...")

    const mockTransactions: Transaction[] = [
      {
        id: "tx1",
        type: "receive",
        amount: 500,
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        address: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
        status: "completed",
        hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
        tokenSymbol: "TPF",
        from: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
        to: "0x" + "1".repeat(40),
      },
      {
        id: "tx2",
        type: "send",
        amount: 120.5,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
        address: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
        status: "completed",
        hash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
        tokenSymbol: "TPF",
        from: "0x" + "1".repeat(40),
        to: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
      },
      {
        id: "tx3",
        type: "receive",
        amount: 871.25,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 dias atrás
        address: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
        status: "completed",
        hash: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
        tokenSymbol: "WLD",
        from: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
        to: "0x" + "1".repeat(40),
      },
      {
        id: "tx4",
        type: "send",
        amount: 50,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias atrás
        address: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
        status: "completed",
        hash: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
        tokenSymbol: "DNA",
        from: "0x" + "1".repeat(40),
        to: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
      },
      {
        id: "tx5",
        type: "receive",
        amount: 200,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 dias atrás
        address: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j",
        status: "completed",
        hash: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j",
        tokenSymbol: "CASH",
        from: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j",
        to: "0x" + "1".repeat(40),
      },
    ]

    this.transactions = mockTransactions
    this.saveTransactions()
    console.log(`Generated ${mockTransactions.length} mock transactions`)
  }

  // Salvar transações no localStorage
  private saveTransactions() {
    localStorage.setItem("tpf_transactions", JSON.stringify(this.transactions))
  }

  // Obter todas as transações
  getTransactions(limit?: number): Transaction[] {
    if (!this.initialized) {
      this.initialize()
    }

    // Ordenar por data (mais recente primeiro)
    const sortedTransactions = [...this.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    if (limit) {
      return sortedTransactions.slice(0, limit)
    }

    return sortedTransactions
  }

  // Buscar transações da blockchain
  async fetchTransactionsFromBlockchain(address: string, limit = 10): Promise<Transaction[]> {
    try {
      console.log(`Fetching transactions from blockchain for address: ${address}`)

      if (!this.provider) {
        await this.initialize()
        if (!this.provider) {
          console.error("Provider not initialized, using mock transactions")
          return this.getTransactions(limit)
        }
      }

      // Verificar se o endereço é válido
      if (!ethers.isAddress(address)) {
        console.error("Invalid wallet address:", address)
        return this.getTransactions(limit)
      }

      // Buscar transações para cada token
      const allTransactions: Transaction[] = []

      for (const [symbol, contract] of Object.entries(this.tokenContracts)) {
        try {
          console.log(`Fetching ${symbol} transactions...`)

          // Criar filtros para eventos de transferência enviados e recebidos
          const sentFilter = contract.filters.Transfer(address, null)
          const receivedFilter = contract.filters.Transfer(null, address)

          // Obter o bloco atual
          const currentBlock = await this.provider.getBlockNumber()
          console.log(`Current block: ${currentBlock}`)

          // Buscar eventos dos últimos 10000 blocos (aproximadamente 1-2 dias)
          const fromBlock = Math.max(0, currentBlock - 10000)

          // Buscar eventos de transferência
          console.log(`Fetching transfer events from block ${fromBlock} to ${currentBlock}`)

          const sentEvents = await contract.queryFilter(sentFilter, fromBlock)
          console.log(`Found ${sentEvents.length} sent events for ${symbol}`)

          const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock)
          console.log(`Found ${receivedEvents.length} received events for ${symbol}`)

          // Obter os decimais do token
          const decimals = await contract.decimals()
          console.log(`${symbol} decimals: ${decimals}`)

          // Processar eventos enviados
          for (const event of sentEvents) {
            try {
              // Obter informações do bloco para o timestamp
              const block = await this.provider!.getBlock(event.blockNumber!)
              const timestamp = block?.timestamp
                ? new Date(Number(block.timestamp) * 1000).toISOString()
                : new Date().toISOString()

              // Formatar o valor com os decimais corretos
              const value = ethers.formatUnits(event.args![2], decimals)

              allTransactions.push({
                id: `${event.blockHash}-${event.transactionIndex}-sent`,
                type: "send",
                amount: Number(value),
                date: timestamp,
                address: event.args![1],
                status: "completed",
                hash: event.transactionHash,
                blockNumber: event.blockNumber,
                tokenSymbol: symbol,
                from: event.args![0],
                to: event.args![1],
              })
            } catch (error) {
              console.error(`Error processing sent event for ${symbol}:`, error)
            }
          }

          // Processar eventos recebidos
          for (const event of receivedEvents) {
            try {
              // Obter informações do bloco para o timestamp
              const block = await this.provider!.getBlock(event.blockNumber!)
              const timestamp = block?.timestamp
                ? new Date(Number(block.timestamp) * 1000).toISOString()
                : new Date().toISOString()

              // Formatar o valor com os decimais corretos
              const value = ethers.formatUnits(event.args![2], decimals)

              allTransactions.push({
                id: `${event.blockHash}-${event.transactionIndex}-received`,
                type: "receive",
                amount: Number(value),
                date: timestamp,
                address: event.args![0],
                status: "completed",
                hash: event.transactionHash,
                blockNumber: event.blockNumber,
                tokenSymbol: symbol,
                from: event.args![0],
                to: event.args![1],
              })
            } catch (error) {
              console.error(`Error processing received event for ${symbol}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error fetching ${symbol} transactions:`, error)
        }
      }

      console.log(`Total transactions found on blockchain: ${allTransactions.length}`)

      // Ordenar por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Limitar o número de transações
      const limitedTransactions = allTransactions.slice(0, limit)

      // Se não encontramos transações na blockchain, usar as simuladas
      if (limitedTransactions.length === 0) {
        console.log("No transactions found on blockchain, using mock transactions")
        return this.getTransactions(limit)
      }

      // Salvar as transações no localStorage para uso offline
      this.transactions = [...limitedTransactions, ...this.transactions]
      this.saveTransactions()

      return limitedTransactions
    } catch (error) {
      console.error("Error fetching transactions from blockchain:", error)

      // Retornar transações do cache em caso de erro
      console.log("Using mock transactions as fallback")
      return this.getTransactions(limit)
    }
  }

  // Adicionar uma nova transação
  async addTransaction(transaction: Omit<Transaction, "id" | "date" | "status">): Promise<Transaction> {
    if (!this.initialized) {
      this.initialize()
    }

    const newTransaction: Transaction = {
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
      status: "pending",
      ...transaction,
    }

    this.transactions.unshift(newTransaction)
    this.saveTransactions()

    // Simular processamento da transação
    setTimeout(() => {
      const index = this.transactions.findIndex((tx) => tx.id === newTransaction.id)
      if (index !== -1) {
        this.transactions[index].status = Math.random() > 0.1 ? "completed" : "failed"
        this.saveTransactions()

        // Disparar evento para notificar que a transação foi atualizada
        const event = new CustomEvent("tpf_transaction_updated", {
          detail: {
            transaction: this.transactions[index],
          },
        })
        window.dispatchEvent(event)
      }
    }, 2000)

    return newTransaction
  }

  // Enviar tokens usando o MiniKit
  async sendTokensWithMiniKit(
    recipient: string,
    amount: number,
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit não está instalado")
      }

      console.log("MiniKit is installed, preparing to send tokens...")

      // Converter o valor para string com 18 casas decimais (padrão para tokens ERC20)
      const amountInWei = (amount * 10 ** 18).toString()
      console.log("Amount in wei:", amountInWei)

      // Usar o método sendTransaction conforme a documentação
      console.log("Calling MiniKit.commandsAsync.sendTransaction...")
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: TPF_CONTRACT_ADDRESS,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [recipient, amountInWei],
          },
        ],
      })

      console.log("sendTransaction response:", finalPayload)

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.message || "Falha no envio da transação")
      }

      // Adicionar a transação ao histórico
      this.addTransaction({
        type: "send",
        amount,
        address: recipient,
        hash: finalPayload.transaction_id,
        tokenSymbol: "TPF",
        from: MiniKit.user?.walletAddress || "",
        to: recipient,
      })

      return {
        success: true,
        txId: finalPayload.transaction_id,
      }
    } catch (error) {
      console.error("Error sending tokens with MiniKit:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  // Obter URL do explorador para uma transação
  getExplorerTransactionUrl(hash: string): string {
    return `${EXPLORER_URL}/tx/${hash}`
  }

  // Obter URL do explorador para um endereço
  getExplorerAddressUrl(address: string): string {
    return `${EXPLORER_URL}/address/${address}`
  }

  // Obter informações sobre todos os tokens suportados
  getTokensInfo() {
    return TOKENS_INFO
  }
}

export const transactionService = new TransactionService()
