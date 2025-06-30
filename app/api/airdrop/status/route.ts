import { ethers } from "ethers"
import { NextResponse } from "next/server"

// Replace with your contract address and ABI
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const contractABI = [
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
        name: "",
        type: "bool",
      },
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
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "isAddressBlocked",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyPaused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({
      success: false,
      error: "Address parameter is required",
    })
  }

  // Replace with your RPC URL
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL

  if (!rpcUrl) {
    return NextResponse.json({
      success: false,
      error: "RPC URL is not defined",
    })
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(contractAddress!, contractABI, provider)

    // Buscar dados do contrato usando a nova função canUserClaim
    const [canClaim, timeUntilNextClaim] = await contract.canUserClaim(address)
    const dailyAirdrop = await contract.dailyAirdrop()
    const isBlocked = await contract.isAddressBlocked(address)
    const emergencyPaused = await contract.emergencyPaused()

    console.log("Contract data retrieved:", {
      canClaim: canClaim,
      timeUntilNextClaim: Number(timeUntilNextClaim),
      dailyAirdrop: dailyAirdrop.toString(),
      isBlocked: isBlocked,
      emergencyPaused: emergencyPaused,
    })

    // Verificar condições de bloqueio
    if (isBlocked) {
      return NextResponse.json({
        success: false,
        error: "Address is blocked from claiming airdrops",
        canClaim: false,
        timeRemaining: 0,
        airdropAmount: ethers.formatUnits(dailyAirdrop, 18),
        rpcUsed: rpcUrl,
      })
    }

    if (emergencyPaused) {
      return NextResponse.json({
        success: false,
        error: "Airdrop claims are temporarily paused",
        canClaim: false,
        timeRemaining: 0,
        airdropAmount: ethers.formatUnits(dailyAirdrop, 18),
        rpcUsed: rpcUrl,
      })
    }

    return NextResponse.json({
      success: true,
      canClaim: canClaim,
      timeRemaining: Number(timeUntilNextClaim),
      airdropAmount: ethers.formatUnits(dailyAirdrop, 18),
      rpcUsed: rpcUrl,
    })
  } catch (error: any) {
    console.error("Error fetching airdrop status:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
