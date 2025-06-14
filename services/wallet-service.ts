import { WORLDCHAIN_CONFIG, TOKENS_INFO } from "./constants"
import { balanceSyncService } from "./balance-sync-service"
import type { TokenBalance, Transaction } from "./types"
import { ethers } from "ethers"

declare global {
  interface Window {
    MiniKit?: {
      sendTransaction: (params: {
        to: string
        value: string
        data: string
      }) => Promise<string>
      isConnected?: () => boolean
      getTokenBalance?: (params: {
        tokenAddress: string
        walletAddress: string
      }) => Promise<{ balance: string }>
    }
  }
}

class WalletService {
  private initialized = false
  private provider: ethers.JsonRpcProvider | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("🔄 Initializing Wallet Service...")

    // Inicializar provider para consultas diretas à blockchain
    this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl)

    this.initialized = true
    console.log("✅ Wallet Service initialized!")
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) await this.initialize()

      console.log(`💰 Getting REAL token balances for: ${walletAddress}`)
      console.log("🚫 NO MOCK VALUES - Only real blockchain data")

      const balances: TokenBalance[] = []

      // Para cada token, obter saldo real da blockchain
      for (const [symbol, tokenInfo] of Object.entries(TOKENS_INFO)) {
        try {
          console.log(`🔍 Getting real balance for ${symbol}...`)

          let realBalance = "0"

          // Método 1: Tentar MiniKit primeiro (mais confiável)
          if (window.MiniKit?.getTokenBalance) {
            try {
              console.log(`📱 Trying MiniKit for ${symbol}...`)
              const result = await window.MiniKit.getTokenBalance({
                tokenAddress: tokenInfo.address,
                walletAddress: walletAddress,
              })

              if (result?.balance) {
                realBalance = ethers.formatUnits(result.balance, tokenInfo.decimals)
                console.log(`✅ MiniKit ${symbol}: ${realBalance}`)
              }
            } catch (miniKitError) {
              console.log(`⚠️ MiniKit failed for ${symbol}:`, miniKitError.message)
            }
          }

          // Método 2: Se MiniKit falhou, tentar RPC direto
          if (realBalance === "0" && this.provider) {
            try {
              console.log(`🌐 Trying RPC for ${symbol}...`)
              const contract = new ethers.Contract(
                tokenInfo.address,
                ["function balanceOf(address) view returns (uint256)"],
                this.provider,
              )

              const balance = await contract.balanceOf(walletAddress)
              realBalance = ethers.formatUnits(balance, tokenInfo.decimals)
              console.log(`✅ RPC ${symbol}: ${realBalance}`)
            } catch (rpcError) {
              console.log(`⚠️ RPC failed for ${symbol}:`, rpcError.message)
            }
          }

          // Método 3: Para TPF, verificar se há saldo sincronizado REAL
          if (symbol === "TPF" && realBalance === "0") {
            const syncedBalance = balanceSyncService.getCurrentTPFBalance(walletAddress)
            // Só usar se for um valor que foi realmente definido pelo usuário
            const timestamp = localStorage.getItem("tpf_balance_timestamp")
            if (syncedBalance > 0 && timestamp) {
              realBalance = syncedBalance.toString()
              console.log(`✅ Synced TPF (user-set): ${realBalance}`)
            }
          }

          // Adicionar à lista (mesmo que seja 0)
          balances.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: realBalance,
            decimals: tokenInfo.decimals,
            icon: tokenInfo.logo,
            formattedBalance: realBalance,
          })

          console.log(`📊 Final ${symbol} balance: ${realBalance}`)
        } catch (tokenError) {
          console.error(`❌ Error getting ${symbol} balance:`, tokenError)

          // Adicionar com saldo 0 em caso de erro
          balances.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: "0",
            decimals: tokenInfo.decimals,
            icon: tokenInfo.logo,
            formattedBalance: "0",
          })
        }
      }

      console.log("✅ Real balances obtained:")
      balances.forEach((b) => {
        console.log(`  ${b.symbol}: ${b.balance}`)
      })

      return balances
    } catch (error) {
      console.error("❌ Error getting real token balances:", error)

      // Em caso de erro total, retornar tokens com saldo 0
      return Object.entries(TOKENS_INFO).map(([symbol, tokenInfo]) => ({
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        address: tokenInfo.address,
        balance: "0",
        decimals: tokenInfo.decimals,
        icon: tokenInfo.logo,
        formattedBalance: "0",
      }))
    }
  }

  async getBalance(walletAddress: string, tokenSymbol = "TPF"): Promise<number> {
    try {
      console.log(`💰 Getting real balance for ${tokenSymbol}...`)

      const tokenInfo = TOKENS_INFO[tokenSymbol as keyof typeof TOKENS_INFO]
      if (!tokenInfo) {
        console.error(`❌ Token ${tokenSymbol} not found`)
        return 0
      }

      // Para TPF, verificar primeiro o balance sync (se foi definido pelo usuário)
      if (tokenSymbol === "TPF") {
        const syncedBalance = balanceSyncService.getCurrentTPFBalance(walletAddress)
        const timestamp = localStorage.getItem("tpf_balance_timestamp")
        if (syncedBalance > 0 && timestamp) {
          console.log(`✅ Using user-set TPF balance: ${syncedBalance}`)
          return syncedBalance
        }
      }

      // Tentar MiniKit
      if (window.MiniKit?.getTokenBalance) {
        try {
          const result = await window.MiniKit.getTokenBalance({
            tokenAddress: tokenInfo.address,
            walletAddress: walletAddress,
          })

          if (result?.balance) {
            const balance = Number(ethers.formatUnits(result.balance, tokenInfo.decimals))
            console.log(`✅ MiniKit ${tokenSymbol}: ${balance}`)
            return balance
          }
        } catch (miniKitError) {
          console.log(`⚠️ MiniKit failed for ${tokenSymbol}:`, miniKitError.message)
        }
      }

      // Tentar RPC direto
      if (this.provider) {
        try {
          const contract = new ethers.Contract(
            tokenInfo.address,
            ["function balanceOf(address) view returns (uint256)"],
            this.provider,
          )

          const balance = await contract.balanceOf(walletAddress)
          const formattedBalance = Number(ethers.formatUnits(balance, tokenInfo.decimals))
          console.log(`✅ RPC ${tokenSymbol}: ${formattedBalance}`)
          return formattedBalance
        } catch (rpcError) {
          console.log(`⚠️ RPC failed for ${tokenSymbol}:`, rpcError.message)
        }
      }

      console.log(`📊 No real balance found for ${tokenSymbol}, returning 0`)
      return 0
    } catch (error) {
      console.error(`❌ Error getting ${tokenSymbol} balance:`, error)
      return 0
    }
  }

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting transaction history for: ${walletAddress}`)

      // Return empty array - transactions will be handled by the modal
      console.log("📊 No transaction history service available")
      return []
    } catch (error) {
      console.error("❌ Error getting transaction history:", error)
      return []
    }
  }

  async sendToken(params: {
    to: string
    amount: number
    tokenAddress?: string
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`📤 Sending ${params.amount} tokens to ${params.to}`)
      console.log(`Token address: ${params.tokenAddress || "ETH"}`)

      // Verificar se MiniKit está disponível
      if (typeof window === "undefined" || !window.MiniKit) {
        throw new Error("MiniKit not available")
      }

      // Se não tem tokenAddress, é ETH nativo
      if (!params.tokenAddress) {
        const amountInWei = ethers.parseEther(params.amount.toString())

        const transactionId = await window.MiniKit.sendTransaction({
          to: params.to,
          value: amountInWei.toString(),
          data: "0x",
        })

        return {
          success: true,
          txHash: transactionId,
        }
      }

      // Para tokens ERC20
      const amountInWei = ethers.parseUnits(params.amount.toString(), 18)

      const erc20Interface = new ethers.Interface(["function transfer(address _to, uint256 _value) returns (bool)"])

      const transferData = erc20Interface.encodeFunctionData("transfer", [params.to, amountInWei])

      const transactionId = await window.MiniKit.sendTransaction({
        to: params.tokenAddress,
        value: "0",
        data: transferData,
      })

      console.log(`✅ Token sent successfully: ${transactionId}`)

      return {
        success: true,
        txHash: transactionId,
      }
    } catch (error) {
      console.error("❌ Error sending token:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getNetworkInfo() {
    return WORLDCHAIN_CONFIG
  }

  getTokensInfo() {
    return TOKENS_INFO
  }

  getExplorerTransactionUrl(hash: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/tx/${hash}`
  }

  getExplorerAddressUrl(address: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/address/${address}`
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const walletService = new WalletService()
