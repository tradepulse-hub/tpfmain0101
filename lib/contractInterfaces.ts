// Interface simplificada para o contrato de airdrop
export const AIRDROP_INTERFACE = [
  "function claimAirdrop()",
  "function claimAirdropSafe()",
  "function canUserClaim(address user) view returns (bool canClaim, uint256 timeUntilNextClaim)",
  "function dailyAirdrop() view returns (uint256)",
  "function contractBalance() view returns (uint256)",
  "function isAddressBlocked(address user) view returns (bool)",
  "function emergencyPaused() view returns (bool)",
]

// ABI mínima para MiniKit (apenas as funções de claim)
export const MINIKIT_AIRDROP_ABI = [
  {
    inputs: [],
    name: "claimAirdrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimAirdropSafe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export const CONTRACT_ADDRESS = "0x0089b777aa68589E115357313BDbBa2F662c81Bf"
