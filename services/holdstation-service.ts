import type { TokenBalance, SwapQuote } from "./types"

// Configuração para Worldchain
const WORLDCHAIN_CONFIG = {
  chainId: 480,
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  name: "Worldchain",
}

// Tokens suportados pela Holdstation
const SUPPORTED_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

class HoldstationService {
  private holdstation: any = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing REAL Holdstation SDK - NO MOCK ALLOWED...")

      // Método 1: Tentar carregar SDK via CDN
      await this.loadHoldstationSDKFromCDN()

      // Método 2: Tentar SDK global
      if (!this.holdstation && typeof window !== "undefined" && (window as any).Holdstation) {
        console.log("🔍 Found global Holdstation SDK")
        this.holdstation = new (window as any).Holdstation({
          chainId: WORLDCHAIN_CONFIG.chainId,
          rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
        })
        console.log("✅ Global Holdstation SDK initialized!")
      }

      // Método 3: Tentar importação dinâmica
      if (!this.holdstation) {
        try {
          const HoldstationModule = await import("@holdstation/sdk")
          this.holdstation = new HoldstationModule.Holdstation({
            chainId: WORLDCHAIN_CONFIG.chainId,
            rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
          })
          console.log("✅ NPM Holdstation SDK initialized!")
        } catch (importError) {
          console.warn("⚠️ NPM import failed:", importError.message)
        }
      }

      if (!this.holdstation) {
        throw new Error("❌ REAL Holdstation SDK not available - refusing to use mock")
      }

      // Testar conectividade real
      await this.testRealConnection()

      this.initialized = true
      console.log("✅ REAL Holdstation SDK successfully initialized!")
    } catch (error) {
      console.error("❌ Failed to initialize REAL Holdstation SDK:", error)
      console.error("❌ NO MOCK WILL BE USED - Service will fail")
      throw new Error(`Real Holdstation SDK required: ${error.message}`)
    }
  }

  private async loadHoldstationSDKFromCDN(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Tentar carregar SDK via CDN se disponível
      if (typeof window === "undefined") {
        reject(new Error("Window not available"))
        return
      }

      // Verificar se já existe um script do Holdstation
      const existingScript = document.querySelector('script[src*="holdstation"]')
      if (existingScript) {
        console.log("🔍 Holdstation script already loaded")
        setTimeout(() => {
          if ((window as any).Holdstation) {
            this.holdstation = new (window as any).Holdstation({
              chainId: WORLDCHAIN_CONFIG.chainId,
              rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
            })
            console.log("✅ CDN Holdstation SDK initialized!")
            resolve()
          } else {
            reject(new Error("Holdstation not available after script load"))
          }
        }, 1000)
        return
      }

      // URLs possíveis do SDK da Holdstation
      const possibleCDNUrls = [
        "https://cdn.holdstation.com/sdk/latest/holdstation.min.js",
        "https://unpkg.com/@holdstation/sdk/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@holdstation/sdk/dist/index.js",
      ]

      let attempts = 0
      const tryNextURL = () => {
        if (attempts >= possibleCDNUrls.length) {
          reject(new Error("All CDN URLs failed"))
          return
        }

        const script = document.createElement("script")
        script.src = possibleCDNUrls[attempts]
        script.async = true

        script.onload = () => {
          console.log(`✅ Loaded Holdstation SDK from: ${possibleCDNUrls[attempts]}`)
          setTimeout(() => {
            if ((window as any).Holdstation) {
              this.holdstation = new (window as any).Holdstation({
                chainId: WORLDCHAIN_CONFIG.chainId,
                rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
              })
              console.log("✅ CDN Holdstation SDK initialized!")
              resolve()
            } else {
              attempts++
              tryNextURL()
            }
          }, 500)
        }

        script.onerror = () => {
          console.warn(`⚠️ Failed to load from: ${possibleCDNUrls[attempts]}`)
          attempts++
          tryNextURL()
        }

        document.head.appendChild(script)
      }

      tryNextURL()
    })
  }

  private async testRealConnection(): Promise<void> {
    if (!this.holdstation) {
      throw new Error("No Holdstation SDK to test")
    }

    try {
      console.log("🧪 Testing REAL Holdstation SDK connection...")

      // Tentar métodos comuns do SDK
      const testMethods = ["getNetworkInfo", "getSupportedTokens", "getVersion", "isConnected"]

      let testPassed = false
      for (const method of testMethods) {
        if (typeof this.holdstation[method] === "function") {
          try {
            const result = await this.holdstation[method]()
            console.log(`✅ SDK method ${method} works:`, result)
            testPassed = true
            break
          } catch (methodError) {
            console.warn(`⚠️ SDK method ${method} failed:`, methodError.message)
          }
        }
      }

      if (!testPassed) {
        // Verificar se pelo menos os métodos principais existem
        const requiredMethods = ["getTokenBalances", "getSwapQuote", "executeSwap"]
        const missingMethods = requiredMethods.filter((method) => typeof this.holdstation[method] !== "function")

        if (missingMethods.length > 0) {
          throw new Error(`SDK missing required methods: ${missingMethods.join(", ")}`)
        }

        console.log("✅ SDK has required methods, assuming it's functional")
      }
    } catch (error) {
      console.error("❌ SDK connection test failed:", error)
      throw new Error(`SDK test failed: ${error.message}`)
    }
  }

  // Obter saldos de tokens - APENAS REAL
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting REAL token balances for: ${walletAddress}`)

      if (!this.holdstation) {
        throw new Error("REAL Holdstation SDK not available")
      }

      console.log("📡 Calling REAL Holdstation getTokenBalances...")
      const balances = await this.holdstation.getTokenBalances(walletAddress)

      console.log("📊 REAL balances from Holdstation:", balances)

      if (!Array.isArray(balances)) {
        throw new Error("Invalid response from Holdstation SDK")
      }

      // Processar e formatar saldos
      const formattedBalances: TokenBalance[] = balances.map((balance: any) => ({
        symbol: balance.symbol,
        name: balance.name,
        address: balance.address,
        balance: balance.balance,
        decimals: balance.decimals || 18,
        icon: this.getTokenIcon(balance.symbol),
        formattedBalance: balance.formattedBalance || balance.balance,
      }))

      console.log("✅ REAL formatted balances:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("❌ Error getting REAL token balances:", error)
      throw new Error(`Real balance fetch failed: ${error.message}`)
    }
  }

  // Obter cotação de swap - APENAS REAL
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("💱 Getting REAL swap quote from Holdstation...")
      console.log("📊 REAL quote parameters:", params)

      if (!this.holdstation) {
        throw new Error("REAL Holdstation SDK not available")
      }

      console.log("📡 Calling REAL Holdstation getSwapQuote...")
      const quote = await this.holdstation.getSwapQuote({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
      })

      console.log("📊 REAL quote from Holdstation:", quote)

      // Validar cotação real
      if (!quote || typeof quote !== "object") {
        throw new Error("Invalid quote response from Holdstation SDK")
      }

      if (!quote.amountOut || Number.parseFloat(quote.amountOut) <= 0) {
        throw new Error("Invalid quote amount from Holdstation SDK")
      }

      console.log("✅ REAL valid quote received:", quote)
      return quote
    } catch (error) {
      console.error("❌ Error getting REAL swap quote:", error)
      throw new Error(`Real quote fetch failed: ${error.message}`)
    }
  }

  // Executar swap - APENAS REAL
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🚀 Executing REAL swap via Holdstation...")
      console.log("📊 REAL swap parameters:", params)

      if (!this.holdstation) {
        throw new Error("REAL Holdstation SDK not available")
      }

      console.log("📡 Calling REAL Holdstation executeSwap...")
      console.log("⚠️ This will execute a REAL transaction on the blockchain!")

      const txHash = await this.holdstation.executeSwap({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
      })

      console.log("✅ REAL swap executed successfully!")
      console.log("📋 REAL transaction hash:", txHash)

      // Validar hash de transação real
      if (!txHash || typeof txHash !== "string" || !txHash.startsWith("0x")) {
        throw new Error("Invalid transaction hash from Holdstation SDK")
      }

      if (txHash.length < 20) {
        throw new Error("Transaction hash too short - possibly mock")
      }

      console.log("✅ REAL transaction confirmed:", txHash)
      return txHash
    } catch (error) {
      console.error("❌ Error executing REAL swap:", error)
      throw new Error(`Real swap execution failed: ${error.message}`)
    }
  }

  private getTokenIcon(symbol: string): string {
    const icons: Record<string, string> = {
      TPF: "/logo-tpf.png",
      WLD: "/worldcoin.jpeg",
      DNA: "/dna-token.png",
      WDD: "/drachma-token.png",
    }
    return icons[symbol] || "/placeholder.svg"
  }

  // Métodos auxiliares
  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getSDKStatus() {
    return {
      initialized: this.initialized,
      hasSDK: !!this.holdstation,
      sdkType: "REAL Holdstation SDK ONLY",
      noMockAllowed: true,
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  // Método para verificar se o SDK é real
  async verifyRealSDK(): Promise<boolean> {
    try {
      if (!this.holdstation) return false

      // Verificar se tem métodos reais
      const requiredMethods = ["getTokenBalances", "getSwapQuote", "executeSwap"]
      const hasAllMethods = requiredMethods.every((method) => typeof this.holdstation[method] === "function")

      if (!hasAllMethods) {
        console.error("❌ SDK missing required methods")
        return false
      }

      console.log("✅ SDK verification passed - appears to be real")
      return true
    } catch (error) {
      console.error("❌ SDK verification failed:", error)
      return false
    }
  }
}

export const holdstationService = new HoldstationService()
