import { ethers } from "ethers"
import { TokenProvider } from "@holdstation/worldchain-sdk"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// Interface para detalhes do token
interface TokenDetails {
  address: string
  chainId: number
  decimals: number
  symbol: string
  name: string
}

// Interface para saldo de token
interface TokenBalance {
  [tokenAddress: string]: string
}

class HoldstationService {
  private provider: ethers.JsonRpcProvider
  private tokenProvider: TokenProvider
  private initialized = false

  constructor() {
    // Inicializar apenas no lado do cliente
    if (typeof window !== "undefined") {
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC_URL)
      this.tokenProvider = new TokenProvider({ provider: this.provider })
      this.initialized = true
    }
  }

  // Verificar se o serviço está inicializado
  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error("HoldstationService not initialized. Make sure you're on the client side.")
    }
  }

  // Obter detalhes de múltiplos tokens
  async getTokenDetails(...tokenAddresses: string[]): Promise<{ [address: string]: TokenDetails }> {
    this.ensureInitialized()

    try {
      console.log("Fetching token details for:", tokenAddresses)
      const details = await this.tokenProvider.details(...tokenAddresses)
      console.log("Token details received:", details)
      return details
    } catch (error) {
      console.error("Error fetching token details:", error)
      throw error
    }
  }

  // Obter todos os tokens de uma carteira
  async getWalletTokens(walletAddress: string): Promise<string[]> {
    this.ensureInitialized()

    try {
      console.log("Fetching tokens for wallet:", walletAddress)
      const tokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log("Wallet tokens received:", tokens)
      return tokens
    } catch (error) {
      console.error("Error fetching wallet tokens:", error)
      throw error
    }
  }

  // Obter saldos de múltiplos tokens para uma carteira
  async getTokenBalances(walletAddress: string, tokenAddresses: string[]): Promise<TokenBalance> {
    this.ensureInitialized()

    try {
      console.log("Fetching token balances for wallet:", walletAddress, "tokens:", tokenAddresses)
      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })
      console.log("Token balances received:", balances)
      return balances
    } catch (error) {
      console.error("Error fetching token balances:", error)
      throw error
    }
  }

  // Obter saldo de um token específico para múltiplas carteiras
  async getTokenBalanceForWallets(tokenAddress: string, walletAddresses: string[]): Promise<TokenBalance> {
    this.ensureInitialized()

    try {
      console.log("Fetching token balance for token:", tokenAddress, "wallets:", walletAddresses)
      const balances = await this.tokenProvider.balanceOf({
        token: tokenAddress,
        wallets: walletAddresses,
      })
      console.log("Token balance for wallets received:", balances)
      return balances
    } catch (error) {
      console.error("Error fetching token balance for wallets:", error)
      throw error
    }
  }

  // Obter informações completas de um token (detalhes + saldo)
  async getCompleteTokenInfo(walletAddress: string, tokenAddress: string) {
    this.ensureInitialized()

    try {
      // Buscar detalhes e saldo em paralelo
      const [details, balances] = await Promise.all([
        this.getTokenDetails(tokenAddress),
        this.getTokenBalances(walletAddress, [tokenAddress]),
      ])

      const tokenDetails = details[tokenAddress]
      const rawBalance = balances[tokenAddress]

      // Formatar o saldo usando os decimais do token
      const formattedBalance = ethers.formatUnits(rawBalance || "0", tokenDetails.decimals)

      return {
        ...tokenDetails,
        balance: formattedBalance,
        rawBalance: rawBalance || "0",
      }
    } catch (error) {
      console.error("Error fetching complete token info:", error)
      throw error
    }
  }

  // Descobrir e obter informações de todos os tokens de uma carteira
  async discoverWalletTokens(walletAddress: string) {
    this.ensureInitialized()

    try {
      // Primeiro, descobrir todos os tokens da carteira
      const tokenAddresses = await this.getWalletTokens(walletAddress)

      if (tokenAddresses.length === 0) {
        return []
      }

      // Obter detalhes e saldos de todos os tokens
      const [details, balances] = await Promise.all([
        this.getTokenDetails(...tokenAddresses),
        this.getTokenBalances(walletAddress, tokenAddresses),
      ])

      // Combinar informações
      return tokenAddresses
        .map((address) => {
          const tokenDetails = details[address]
          const rawBalance = balances[address]
          const formattedBalance = ethers.formatUnits(rawBalance || "0", tokenDetails.decimals)

          return {
            ...tokenDetails,
            balance: formattedBalance,
            rawBalance: rawBalance || "0",
          }
        })
        .filter((token) => Number.parseFloat(token.balance) > 0) // Filtrar tokens com saldo zero
    } catch (error) {
      console.error("Error discovering wallet tokens:", error)
      throw error
    }
  }
}

// Exportar instância única
export const holdstationService = new HoldstationService()
