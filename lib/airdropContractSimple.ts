// ABI simplificada apenas com as funções essenciais para reduzir erros
export const SIMPLE_AIRDROP_ABI = [
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
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "canUserClaim",
    outputs: [
      {
        internalType: "bool",
        name: "canClaim",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "timeUntilNextClaim",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "dailyAirdrop",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export const CONTRACT_ADDRESS = "0x0089b777aa68589E115357313BDbBa2F662c81Bf"
