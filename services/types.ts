// Tipos centralizados para evitar dependências circulares
export interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  icon?: string
  formattedBalance?: string
}

export interface Transaction {
  id: string
  hash: string
  type: "send" | "receive" | "swap"
  amount: string
  tokenSymbol: string
  tokenAddress: string
  from: string
  to: string
  timestamp: Date
  status: "completed" | "pending" | "failed"
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  value?: string
}

export interface TokenInfo {
  symbol: string
  name: string
  address: string
  logo: string
  decimals: number
}
