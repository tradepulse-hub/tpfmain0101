import { ethers } from "ethers"

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

// Criar uma instância do contrato
export const getAirdropContract = async () => {
  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

      // Verificar se o contrato existe
      const code = await provider.getCode(AIRDROP_CONTRACT_ADDRESS)
      if (code === "0x") {
        console.log(`Contract not found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
        continue // Tentar próximo RPC
      }

      console.log(`Contract found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
      return new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropContractABI, provider)
    } catch (error) {
      console.error(`Error with RPC ${rpcUrl}:`, error)
      // Continuar para o próximo RPC
    }
  }

  throw new Error("Failed to connect to any RPC endpoint")
}

// Function to get the provider
const getProvider = (providerUrl: string): ethers.providers.Provider => {
  try {
    return new ethers.providers.JsonRpcProvider(providerUrl)
  } catch (error) {
    console.error("Error creating provider:", error)
    throw new Error("Failed to create provider. Check provider URL.")
  }
}

export { getProvider }
