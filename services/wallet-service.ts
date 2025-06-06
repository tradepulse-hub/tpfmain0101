import { MiniKit } from "@worldcoin/minikit-js"
import { ethers } from "ethers"
import { holdstationService } from "./holdstation-service"

// Endereço do contrato TPF na Worldchain
const TPF_CONTRACT_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

// ABI simplificado para tokens ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// Configuração da rede Worldchain
const WORLDCHAIN_CONFIG = {
  chainId: 480, // 0x1e0
  name: "World Chain Mainnet",
  shortName: "wc",
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  blockExplorer: "https://worldscan.org",
  bridge: "https://worldchain-mainnet.bridge.alchemy.com",
}

// Lista de RPCs para World Chain
const RPC_ENDPOINTS = [
  "https://worldchain-mainnet.g.alchemy.com/public", // RPC principal da World Chain
  "https://rpc.worldcoin.org",
  "https://worldchain-testnet.g.alchemy.com/public",
  "https://rpc-testnet.worldcoin.org",
]

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
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    decimals: 18,
    logo: "/worldcoin.jpeg",
  },
  DNA: {
    name: "DNA Token",
    symbol: "DNA",
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    decimals: 18,
    logo: "/dna-token.png",
  },
  CASH: {
    name: "Cash Token",
    symbol: "CASH",
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    decimals: 18,
    logo: "/cash-token.png",
  },
  WDD: {
    name: "World Drachma",
    symbol: "WDD",
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    decimals: 18,
    logo: "/drachma-token.png",
  },
}

class WalletService {
  private provider: ethers.JsonRpcProvider | null = null
  private tpfContract: ethers.Contract | null = null
  private tokenContracts: Record<string, ethers.Contract> = {}
  private initialized = false

  constructor() {
    // Inicializar o serviço apenas no lado do cliente
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("Initializing wallet service...")

    // Tentar cada RPC até encontrar um que funcione
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
          this.tokenContracts[symbol] = new ethers.Contract(tokenInfo.address, ERC20_ABI, provider)
          console.log(`Initialized contract for ${symbol} at ${tokenInfo.address}`)
        }

        // Manter referência específica para o contrato TPF para compatibilidade
        this.tpfContract = this.tokenContracts.TPF

        console.log(`Successfully connected to RPC: ${rpcUrl}`)
        this.initialized = true
        break
      } catch (error) {
        console.error(`Failed to connect to RPC ${rpcUrl}:`, error)
      }
    }

    if (!this.initialized) {
      console.error("Failed to connect to any RPC endpoint")
    }
  }

  // Obter o saldo de TPF da carteira
  async getBalance(walletAddress: string): Promise<number> {
    try {
      console.log("Getting TPF balance for address:", walletAddress)

      // Verificar se o MiniKit está instalado e tem um usuário
      if (MiniKit.isInstalled() && MiniKit.user && MiniKit.user.walletAddress) {
        console.log("MiniKit is installed and has user:", MiniKit.user.walletAddress)

        // Se o endereço não foi fornecido, usar o do MiniKit
        if (!walletAddress) {
          walletAddress = MiniKit.user.walletAddress
          console.log("Using MiniKit wallet address:", walletAddress)
        }
      }

      // Verificar se temos um endereço válido
      if (!walletAddress) {
        console.error("No wallet address provided")
        return 0
      }

      // Verificar se o provider e o contrato estão inicializados
      if (!this.provider || !this.tpfContract) {
        await this.initialize()

        if (!this.provider || !this.tpfContract) {
          console.error("Failed to initialize provider or TPF contract")
          return 0
        }
      }

      // Verificar se o endereço é válido
      if (!ethers.isAddress(walletAddress)) {
        console.error("Invalid wallet address:", walletAddress)
        return 0
      }

      console.log("Calling balanceOf for address:", walletAddress)

      // Obter o saldo real do contrato
      const balance = await this.tpfContract.balanceOf(walletAddress)
      console.log("Raw TPF balance:", balance.toString())

      // Obter os decimais do token
      const decimals = await this.tpfContract.decimals()
      console.log("TPF decimals:", decimals)

      // Converter o saldo para o formato legível
      const formattedBalance = Number(ethers.formatUnits(balance, decimals))
      console.log("Formatted TPF balance:", formattedBalance)

      return formattedBalance
    } catch (error) {
      console.error("Error getting TPF balance:", error)

      // Verificar se há um saldo definido pelo usuário no localStorage
      const userDefinedBalance = localStorage.getItem("userDefinedTPFBalance")
      if (userDefinedBalance) {
        return Number(userDefinedBalance)
      }

      return 0
    }
  }

  // Obter o saldo de um token específico
  async getTokenBalance(walletAddress: string, tokenSymbol: string): Promise<number> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!walletAddress || !tokenSymbol) {
        throw new Error("Wallet address and token symbol are required")
      }

      // Verificar se temos o contrato do token
      const tokenContract = this.tokenContracts[tokenSymbol]
      if (!tokenContract) {
        throw new Error(`Contract for token ${tokenSymbol} not found`)
      }

      // Obter o saldo e os decimais
      const balance = await tokenContract.balanceOf(walletAddress)
      const decimals = await tokenContract.decimals()

      // Formatar o saldo
      const formattedBalance = Number(ethers.formatUnits(balance, decimals))
      return formattedBalance
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} balance:`, error)

      // Valores de fallback para demonstração
      const fallbackBalances: Record<string, number> = {
        WLD: 42.67,
        DNA: 125.45,
        CASH: 310.89,
        WDD: 78.32,
        TPF: 1000,
      }

      return fallbackBalances[tokenSymbol] || 0
    }
  }

  async getAllTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!walletAddress) {
        throw new Error("Wallet address is required")
      }

      // Usar a API da Holdstation para obter saldos reais
      const tokenBalances = await holdstationService.getTokenBalances(walletAddress)

      const balances: Record<string, number> = {}
      tokenBalances.forEach((token) => {
        balances[token.symbol] = Number.parseFloat(token.balance)
      })

      console.log("Real token balances from Holdstation:", balances)
      return balances
    } catch (error) {
      console.error("Error getting token balances from Holdstation:", error)

      // Fallback para valores simulados
      return {
        TPF: 1000,
        WLD: 42.67,
        DNA: 125.45,
        CASH: 310.89,
        WDD: 78.32,
        WETH: 0.5,
        USDCe: 1500,
      }
    }
  }

  async getTokenBalances(walletAddress: string): Promise<any[]> {
    try {
      if (!walletAddress) {
        throw new Error("Wallet address is required")
      }

      // Usar a API da Holdstation para obter tokens reais da carteira
      const tokens = await holdstationService.getTokenBalances(walletAddress)
      console.log("Real wallet tokens from Holdstation:", tokens)
      return tokens
    } catch (error) {
      console.error("Error getting wallet tokens from Holdstation:", error)
      return []
    }
  }

  // Buscar transações de um token específico
  async getTokenTransactions(walletAddress: string, tokenSymbol: string): Promise<any[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!walletAddress || !tokenSymbol) {
        throw new Error("Wallet address and token symbol are required")
      }

      console.log(`Fetching ${tokenSymbol} transactions for address: ${walletAddress}`)

      // Verificar se temos o contrato do token
      const tokenContract = this.tokenContracts[tokenSymbol]
      if (!tokenContract) {
        throw new Error(`Contract for token ${tokenSymbol} not found`)
      }

      // Obter os decimais do token
      const decimals = await tokenContract.decimals()
      console.log(`${tokenSymbol} decimals:`, decimals)

      // Criar filtros para eventos de transferência enviados e recebidos
      const sentFilter = tokenContract.filters.Transfer(walletAddress, null)
      const receivedFilter = tokenContract.filters.Transfer(null, walletAddress)

      // Obter o bloco atual
      const currentBlock = await this.provider!.getBlockNumber()
      console.log(`Current block: ${currentBlock}`)

      // Buscar eventos dos últimos 10000 blocos (aproximadamente 1-2 dias)
      const fromBlock = Math.max(0, currentBlock - 10000)

      // Buscar eventos de transferência
      console.log(`Fetching transfer events from block ${fromBlock} to ${currentBlock}`)
      const sentEvents = await tokenContract.queryFilter(sentFilter, fromBlock)
      const receivedEvents = await tokenContract.queryFilter(receivedFilter, fromBlock)

      console.log(
        `Found ${sentEvents.length} sent events and ${receivedEvents.length} received events for ${tokenSymbol}`,
      )

      // Combinar e processar os eventos
      const allEvents = [...sentEvents, ...receivedEvents]

      // Ordenar por bloco (mais recente primeiro)
      allEvents.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))

      // Converter eventos em transações
      const transactions = await Promise.all(
        allEvents.map(async (event) => {
          // Obter informações do bloco para o timestamp
          const block = await this.provider!.getBlock(event.blockNumber!)
          const timestamp = block?.timestamp
            ? new Date(Number(block.timestamp) * 1000).toISOString()
            : new Date().toISOString()

          // Determinar se é uma transação de envio ou recebimento
          const isSent = event.args![0].toLowerCase() === walletAddress.toLowerCase()
          const from = event.args![0]
          const to = event.args![1]

          // Formatar o valor com os decimais corretos
          const value = ethers.formatUnits(event.args![2], decimals)

          return {
            id: `${event.blockHash}-${event.transactionIndex}`,
            type: isSent ? "send" : "receive",
            amount: value,
            date: timestamp,
            from,
            to,
            status: "completed",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            token: tokenSymbol,
          }
        }),
      )

      console.log(`Processed ${transactions.length} ${tokenSymbol} transactions`)
      return transactions
    } catch (error) {
      console.error(`Error fetching ${tokenSymbol} transactions:`, error)
      return []
    }
  }

  // Definir o saldo manualmente (temporário até termos integração real)
  async setUserBalance(amount: number): Promise<boolean> {
    try {
      localStorage.setItem("userDefinedTPFBalance", amount.toString())

      // Disparar um evento para notificar que o saldo foi atualizado
      const event = new CustomEvent("tpf_balance_updated", {
        detail: {
          amount,
        },
      })
      window.dispatchEvent(event)

      return true
    } catch (error) {
      console.error("Erro ao definir saldo:", error)
      return false
    }
  }

  // Obter informações da rede Worldchain
  getNetworkInfo() {
    return WORLDCHAIN_CONFIG
  }

  // Obter endereço do contrato TPF
  getTPFContractAddress() {
    return TPF_CONTRACT_ADDRESS
  }

  // Obter informações sobre todos os tokens suportados
  getTokensInfo() {
    return TOKENS_INFO
  }

  // Obter URL do explorador para uma transação
  getExplorerTransactionUrl(hash: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/tx/${hash}`
  }

  // Obter URL do explorador para um endereço
  getExplorerAddressUrl(address: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/address/${address}`
  }
}

// Exportar instância única
export const walletService = new WalletService()
