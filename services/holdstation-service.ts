import { ethers } from "ethers"

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
  private provider: ethers.JsonRpcProvider | null = null
  private tokenProvider: any = null
  private initialized = false
  private initializationError: string | null = null

  constructor() {
    // Inicializar apenas no lado do cliente
    if (typeof window !== "undefined") {
      this.initializeAsync()
    }
  }

  private async initializeAsync() {
    try {
      // Importação dinâmica para evitar erros de SSR
      const { TokenProvider } = await import("@holdstation/worldchain-sdk")

      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC_URL)
      this.tokenProvider = new TokenProvider({ provider: this.provider })
      this.initialized = true

      console.log("HoldstationService initialized successfully")
    } catch (error) {
      console.error("Failed to initialize HoldstationService:", error)
      this.initializationError = error instanceof Error ? error.message : "Unknown initialization error"
    }
  }

  // Verificar se o serviço está inicializado
  private async ensureInitialized() {
    if (this.initializationError) {
      throw new Error(`HoldstationService initialization failed: ${this.initializationError}`)
    }

    if (!this.initialized) {
      // Aguardar um pouco para a inicialização
      let attempts = 0
      while (!this.initialized && !this.initializationError && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!this.initialized) {
        throw new Error(
          "HoldstationService not initialized. Make sure you're on the client side and the SDK is available.",
        )
      }
    }
  }

  // Obter detalhes de múltiplos tokens
  async getTokenDetails(...tokenAddresses: string[]): Promise<{ [address: string]: TokenDetails }> {
    try {
      await this.ensureInitialized()

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
    try {
      await this.ensureInitialized()

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
    try {
      await this.ensureInitialized()

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

  // Obter informações completas de um token (detalhes + saldo)
  async getCompleteTokenInfo(walletAddress: string, tokenAddress: string) {
    try {
      await this.ensureInitialized()

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

  // Verificar se o serviço está disponível
  isAvailable(): boolean {
    return this.initialized && !this.initializationError
  }

  // Obter erro de inicialização se houver
  getInitializationError(): string | null {
    return this.initializationError
  }
}

// Exportar instância única
export const holdstationService = new HoldstationService()
