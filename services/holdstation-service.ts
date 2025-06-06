// Serviço simulado do Holdstation SDK
class HoldstationService {
  private initialized = false
  private knownTokens = {
    TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    WLD: "0x163f8C2467924be0ae7B5347228CABF260318753",
    WETH: "0x4200000000000000000000000000000000000006",
    USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
  }

  constructor() {
    this.initialize()
  }

  private async initialize() {
    if (this.initialized) return

    console.log("Initializing Holdstation service (simulated)...")

    // Simular inicialização
    await new Promise((resolve) => setTimeout(resolve, 100))

    this.initialized = true
    console.log("Holdstation service initialized (simulated)")
  }

  isInitialized() {
    return this.initialized
  }

  getKnownTokens() {
    return this.knownTokens
  }

  async getSingleTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    // Simular chamada de saldo
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Retornar saldo simulado baseado no token
    if (tokenAddress === this.knownTokens.TPF) {
      // Verificar se há saldo customizado
      if (typeof window !== "undefined") {
        const userBalance = localStorage.getItem("userDefinedTPFBalance")
        if (userBalance) {
          const weiBalance = BigInt(Math.floor(Number(userBalance) * Math.pow(10, 18)))
          return weiBalance.toString()
        }
      }
      return (BigInt(1000) * BigInt(Math.pow(10, 18))).toString() // 1000 TPF
    }

    return (BigInt(100) * BigInt(Math.pow(10, 18))).toString() // 100 tokens padrão
  }

  async getTokenBalances(walletAddress: string, tokenAddresses: string[]): Promise<Record<string, string>> {
    const balances: Record<string, string> = {}

    for (const address of tokenAddresses) {
      balances[address] = await this.getSingleTokenBalance(address, walletAddress)
    }

    return balances
  }

  async getTokenDetails(tokenAddresses: string[]): Promise<Record<string, any>> {
    const details: Record<string, any> = {}

    for (const address of tokenAddresses) {
      details[address] = {
        decimals: 18,
        symbol: this.getTokenSymbol(address),
        name: this.getTokenName(address),
      }
    }

    return details
  }

  private getTokenSymbol(address: string): string {
    for (const [symbol, addr] of Object.entries(this.knownTokens)) {
      if (addr.toLowerCase() === address.toLowerCase()) {
        return symbol
      }
    }
    return "UNKNOWN"
  }

  private getTokenName(address: string): string {
    const symbolToName: Record<string, string> = {
      TPF: "TPulseFi Token",
      WLD: "Worldcoin",
      WETH: "Wrapped Ethereum",
      USDCe: "USD Coin (Bridged)",
    }

    const symbol = this.getTokenSymbol(address)
    return symbolToName[symbol] || "Unknown Token"
  }

  async getTransactionHistory(walletAddress: string, offset: number, limit: number): Promise<any[]> {
    // Simular histórico de transações
    await new Promise((resolve) => setTimeout(resolve, 200))

    return [
      {
        hash: "0xabc123...",
        type: "receive",
        amount: "100000000000000000000", // 100 tokens em wei
        timestamp: Math.floor(Date.now() / 1000) - 86400,
        from: "0x1234...5678",
        to: walletAddress,
        status: "completed",
        blockNumber: 12345,
        token: "TPF",
      },
      {
        hash: "0xdef456...",
        type: "send",
        amount: "50000000000000000000", // 50 tokens em wei
        timestamp: Math.floor(Date.now() / 1000) - 172800,
        from: walletAddress,
        to: "0x9876...5432",
        status: "completed",
        blockNumber: 12344,
        token: "TPF",
      },
    ]
  }

  async watchTransactionHistory(walletAddress: string, callback: () => void) {
    // Simular monitoramento
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        // 5% chance a cada verificação
        callback()
      }
    }, 10000) // Verificar a cada 10 segundos

    return {
      stop: () => {
        clearInterval(interval)
        console.log("Stopped transaction monitoring")
      },
    }
  }

  async getSwapQuote(params: any) {
    // Simular cotação de swap
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      amountOut: "95000000000000000000", // 95 tokens
      data: "0x",
      to: "0x1234567890123456789012345678901234567890",
      value: "0",
      addons: {
        feeAmountOut: "5000000000000000000", // 5 tokens de taxa
      },
    }
  }

  async executeSwap(params: any) {
    // Simular execução de swap
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      hash: "0xswap123...",
      status: "pending",
    }
  }

  async sendToken(params: { to: string; amount: number; token?: string }) {
    // Simular envio de token
    await new Promise((resolve) => setTimeout(resolve, 400))

    return {
      hash: "0xsend123...",
      status: "pending",
    }
  }

  getNetworkInfo() {
    return {
      chainId: 480,
      name: "World Chain",
      rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
    }
  }

  async getWalletTokens(walletAddress: string) {
    // Simular tokens da carteira
    await new Promise((resolve) => setTimeout(resolve, 200))

    return Object.entries(this.knownTokens).map(([symbol, address]) => ({
      address,
      symbol,
      balance: "1000000000000000000000", // 1000 tokens
      decimals: 18,
    }))
  }
}

// Exportar instância
export const holdstationService = new HoldstationService()
export default HoldstationService
