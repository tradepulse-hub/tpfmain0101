import { NextResponse } from "next/server"
import { ethers } from "ethers"

// Novo endereço do contrato
const CONTRACT_ADDRESS = "0x0089b777aa68589E115357313BDbBa2F662c81Bf"
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// ABI do contrato atualizado
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "blockedAddresses",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "canUserClaim",
    outputs: [
      { internalType: "bool", name: "canClaim", type: "bool" },
      { internalType: "uint256", name: "timeUntilNextClaim", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CLAIM_INTERVAL",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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
    inputs: [],
    name: "contractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "dailyAirdrop",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractInfo",
    outputs: [
      { internalType: "uint256", name: "currentDailyAirdrop", type: "uint256" },
      { internalType: "uint256", name: "currentBalance", type: "uint256" },
      { internalType: "uint256", name: "claimInterval", type: "uint256" },
      { internalType: "address", name: "tokenAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isAddressBlocked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "lastClaimTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

export async function POST(request: Request) {
  try {
    console.log("=== AIRDROP PROCESS API CALLED ===")

    const data = await request.json()
    console.log("Received data:", JSON.stringify(data, null, 2))

    const { userAddress, worldIdVerified } = data

    // Verificar parâmetros básicos
    if (!userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Endereço do usuário é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se World ID foi verificado (já feito no frontend)
    if (!worldIdVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "World ID verification is required",
        },
        { status: 400 },
      )
    }

    console.log("✅ World ID already verified, checking contract conditions...")

    // Verificar contrato
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      // Verificar se o usuário pode clamar
      console.log("Checking contract status for user:", userAddress)
      const [canClaim, timeUntilNextClaim] = await contract.canUserClaim(userAddress)
      const dailyAirdrop = await contract.dailyAirdrop()
      const contractBalance = await contract.contractBalance()
      const isBlocked = await contract.isAddressBlocked(userAddress)
      const emergencyPaused = await contract.emergencyPaused()

      console.log("Contract status:")
      console.log("- Can claim:", canClaim)
      console.log("- Time until next claim:", timeUntilNextClaim.toString())
      console.log("- Is blocked:", isBlocked)
      console.log("- Emergency paused:", emergencyPaused)
      console.log("- Daily airdrop:", ethers.formatEther(dailyAirdrop))
      console.log("- Contract balance:", ethers.formatEther(contractBalance))

      // Verificar condições
      if (isBlocked) {
        return NextResponse.json(
          {
            success: false,
            error: "Your address is blocked from claiming airdrops",
            contractAddress: CONTRACT_ADDRESS,
          },
          { status: 400 },
        )
      }

      if (emergencyPaused) {
        return NextResponse.json(
          {
            success: false,
            error: "Airdrop claims are temporarily paused",
            contractAddress: CONTRACT_ADDRESS,
          },
          { status: 400 },
        )
      }

      if (!canClaim && timeUntilNextClaim > 0) {
        const hoursRemaining = Math.ceil(Number(timeUntilNextClaim) / 3600)
        return NextResponse.json(
          {
            success: false,
            error: `You need to wait ${hoursRemaining} hours before claiming again`,
            timeRemaining: Number(timeUntilNextClaim),
            contractAddress: CONTRACT_ADDRESS,
          },
          { status: 400 },
        )
      }

      if (contractBalance < dailyAirdrop) {
        return NextResponse.json(
          {
            success: false,
            error: "Contract has insufficient balance for airdrop",
            contractAddress: CONTRACT_ADDRESS,
          },
          { status: 400 },
        )
      }

      // Tudo OK - gerar TX ID e retornar sucesso
      const txId = `worldid_${Date.now()}_${userAddress.slice(0, 8)}`

      console.log(`✅ All conditions met! TX ID: ${txId}`)

      const response = {
        success: true,
        txId: txId,
        message: "🎉 World ID verified and contract ready! You can now claim your airdrop.",
        amount: ethers.formatEther(dailyAirdrop) + " TPF",
        timestamp: new Date().toISOString(),
        userAddress: userAddress,
        verificationMethod: "World ID",
        contractAddress: CONTRACT_ADDRESS,
        contractFunction: "claimAirdropSafe", // Atualizado para usar a função segura
        canClaim: canClaim,
        worldIdVerified: true,
      }

      console.log("✅ Sending response:", JSON.stringify(response, null, 2))

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })
    } catch (contractError) {
      console.error("Contract interaction error:", contractError)

      // Mesmo com erro no contrato, World ID foi verificado
      const txId = `worldid_error_${Date.now()}_${userAddress.slice(0, 8)}`

      return NextResponse.json({
        success: true,
        txId: txId,
        message: "🎉 World ID verified! Contract interaction had issues but verification is complete.",
        amount: "10 TPF",
        timestamp: new Date().toISOString(),
        userAddress: userAddress,
        verificationMethod: "World ID",
        contractAddress: CONTRACT_ADDRESS,
        worldIdVerified: true,
        contractError: contractError instanceof Error ? contractError.message : "Unknown contract error",
      })
    }
  } catch (error) {
    console.error("❌ Erro ao processar airdrop:", error)

    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao processar airdrop",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Definir outros métodos HTTP explicitamente para evitar 405
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "GET method not supported. Use POST.",
      timestamp: new Date().toISOString(),
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "PUT method not supported. Use POST.",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "DELETE method not supported. Use POST.",
    },
    { status: 405 },
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: "PATCH method not supported. Use POST.",
    },
    { status: 405 },
  )
}
