// Endereço do contrato de airdrop na Worldchain
export const AIRDROP_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"

// Endereço do token TPF
export const TPF_TOKEN_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

// Lista de RPCs para World Chain
export const RPC_ENDPOINTS = [
  "https://worldchain-mainnet.g.alchemy.com/public",
  "https://worldchain-mainnet.gateway.tenderly.co",
]

// ABI completa do contrato de airdrop
export const airdropContractABI = [
  "function lastClaimTime(address) view returns (uint256)",
  "function CLAIM_INTERVAL() view returns (uint256)",
  "function DAILY_AIRDROP() view returns (uint256)",
  "function claimAirdrop() external",
]

// Função para criar provider usando fetch API
export const createProvider = (rpcUrl: string) => {
  return {
    async call(method: string, params: any[] = []) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
            id: 1,
          }),
        })

        const data = await response.json()
        return data.result
      } catch (error) {
        console.error(`RPC call failed for ${rpcUrl}:`, error)
        throw error
      }
    },
  }
}

// Verificar se contrato existe
export const getAirdropContract = async () => {
  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const provider = createProvider(rpcUrl)

      // Verificar se o contrato existe
      const code = await provider.call("eth_getCode", [AIRDROP_CONTRACT_ADDRESS, "latest"])

      if (code === "0x" || code === "0x0") {
        console.log(`Contract not found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
        continue
      }

      console.log(`Contract found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
      return { provider, address: AIRDROP_CONTRACT_ADDRESS }
    } catch (error) {
      console.error(`Error with RPC ${rpcUrl}:`, error)
      continue
    }
  }

  throw new Error("Failed to connect to any RPC endpoint")
}

// Função utilitária para converter wei para ether
export const formatEther = (wei: string): string => {
  try {
    const weiNum = BigInt(wei)
    const etherNum = Number(weiNum) / Math.pow(10, 18)
    return etherNum.toString()
  } catch (error) {
    console.error("Error formatting ether:", error)
    return "0"
  }
}

// Função utilitária para converter ether para wei
export const parseEther = (ether: string): string => {
  try {
    const etherNum = Number.parseFloat(ether)
    const weiNum = BigInt(Math.floor(etherNum * Math.pow(10, 18)))
    return weiNum.toString()
  } catch (error) {
    console.error("Error parsing ether:", error)
    return "0"
  }
}
