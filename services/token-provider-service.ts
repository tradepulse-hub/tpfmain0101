import { ethers } from "ethers"
import { TokenProvider } from "@holdstation/worldchain-sdk"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"

// Endereços dos tokens conhecidos
const KNOWN_TOKENS = {
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  CASH: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
  WETH: "0x4200000000000000000000000000000000000006",
  USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
}

class TokenProviderService {
  private provider: ethers.JsonRpcProvider | null = null
  private tokenProvider: TokenProvider | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing TokenProvider service...")

      // Criar provider do ethers
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC)

      // Verificar se está funcionando
      const blockNumber = await this.provider.getBlockNumber()
      console.log(`Connected to Worldchain, current block: ${blockNumber}`)

      // Inicializar TokenProvider
      this.tokenProvider = new TokenProvider({ provider: this.provider })

      this.initialized = true
      console.log("TokenProvider service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize TokenProvider service:", error)
    }
  }

  // Obter saldos de múltiplos tokens para uma carteira
  async getTokenBalances(walletAddress: string): Promise<Record<string, string>> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !walletAddress) {
        throw new Error("TokenProvider not initialized or wallet address missing")
      }

      console.log("Getting token balances for:", walletAddress)

      // Obter saldos de todos os tokens conhecidos
      const tokenAddresses = Object.values(KNOWN_TOKENS)

      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })

      console.log("Raw balances from TokenProvider:", balances)

      // Converter para formato mais legível
      const formattedBalances: Record<string, string> = {}

      for (const [symbol, address] of Object.entries(KNOWN_TOKENS)) {
        const balance = balances[address]
        if (balance) {
          // Converter de wei para formato legível (assumindo 18 decimais)
          const formatted = ethers.formatUnits(balance, 18)
          formattedBalances[symbol] = formatted
          console.log(`${symbol} balance: ${formatted}`)
        } else {
          formattedBalances[symbol] = "0"
        }
      }

      return formattedBalances
    } catch (error) {
      console.error("Error getting token balances:", error)
      return {}
    }
  }

  // Obter detalhes de tokens
  async getTokenDetails(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider) {
        throw new Error("TokenProvider not initialized")
      }

      console.log("Getting token details for:", tokenAddresses)

      const details = await this.tokenProvider.details(...tokenAddresses)
      console.log("Token details:", details)

      return details
    } catch (error) {
      console.error("Error getting token details:", error)
      return {}
    }
  }

  // Obter todos os tokens de uma carteira
  async getWalletTokens(walletAddress: string): Promise<string[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !walletAddress) {
        throw new Error("TokenProvider not initialized or wallet address missing")
      }

      console.log("Getting wallet tokens for:", walletAddress)

      const tokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log("Wallet tokens:", tokens)

      return tokens
    } catch (error) {
      console.error("Error getting wallet tokens:", error)
      return Object.values(KNOWN_TOKENS)
    }
  }

  // Obter endereços dos tokens conhecidos
  getKnownTokens() {
    return KNOWN_TOKENS
  }
}

// Exportar instância única
export const tokenProviderService = new TokenProviderService()
