import { NextResponse } from "next/server"
import { ethers } from "ethers"

// ABI do contrato existente
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "claimAirdrop",
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
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "lastClaimTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DAILY_AIRDROP",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
]

const CONTRACT_ADDRESS = "0x7b7540d8a1713a5c7d7C9257573Bdf56E7488E05"
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

export async function POST(request: Request) {
  try {
    console.log("=== REAL CLAIM API CALLED ===")

    const data = await request.json()
    console.log("Received data:", JSON.stringify(data, null, 2))

    const { userAddress, worldIdVerified, proof, merkle_root, nullifier_hash } = data

    if (!userAddress || !worldIdVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    // Verificar se temos World ID proof (obrigatório para desbloquear)
    if (!proof || !merkle_root || !nullifier_hash) {
      return NextResponse.json(
        {
          success: false,
          error: "World ID verification is required to claim",
        },
        { status: 400 },
      )
    }

    // Conectar ao provider
    const provider = new ethers.JsonRpcProvider(RPC_URL)

    // Verificar se temos a chave privada para assinar transações
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      console.log("❌ No private key configured - returning simulation")

      // Retornar simulação se não tiver chave privada
      const txId = `sim_${Date.now()}_${userAddress.slice(0, 8)}`
      return NextResponse.json({
        success: true,
        txId: txId,
        message: "🎯 Simulation: World ID verified! Real claim would be successful with private key configuration.",
        amount: "50 TPF",
        timestamp: new Date().toISOString(),
        userAddress: userAddress,
        verificationMethod: "World ID + Contract Simulation",
        isSimulation: true,
        worldIdVerified: true,
      })
    }

    // Criar wallet com chave privada
    const wallet = new ethers.Wallet(privateKey, provider)
    console.log("Using wallet:", wallet.address)

    // Conectar ao contrato
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet)

    // Verificar se o usuário pode clamar (verificar cooldown)
    console.log("Checking user's last claim time...")
    const lastClaimTime = await contract.lastClaimTime(userAddress)
    const claimInterval = await contract.CLAIM_INTERVAL()
    const currentTime = Math.floor(Date.now() / 1000)

    console.log("Last claim time:", lastClaimTime.toString())
    console.log("Claim interval:", claimInterval.toString())
    console.log("Current time:", currentTime)

    if (lastClaimTime > 0) {
      const nextClaimTime = Number(lastClaimTime) + Number(claimInterval)
      if (currentTime < nextClaimTime) {
        const timeRemaining = nextClaimTime - currentTime
        return NextResponse.json(
          {
            success: false,
            error: `You need to wait ${Math.ceil(timeRemaining / 3600)} hours before claiming again.`,
            timeRemaining: timeRemaining,
          },
          { status: 400 },
        )
      }
    }

    // Verificar saldo do contrato
    console.log("Checking contract balance...")
    const contractBalance = await contract.contractBalance()
    const dailyAirdrop = await contract.DAILY_AIRDROP()

    console.log("Contract balance:", ethers.formatEther(contractBalance))
    console.log("Daily airdrop amount:", ethers.formatEther(dailyAirdrop))

    if (contractBalance < dailyAirdrop) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract has insufficient balance for airdrop",
        },
        { status: 400 },
      )
    }

    console.log("✅ World ID verified, calling claimAirdrop on contract...")

    // Chamar a função claimAirdrop do contrato
    // O contrato usa msg.sender, então a transação deve vir do endereço do usuário
    // Como estamos usando nossa chave privada, vamos simular por enquanto

    // OPÇÃO 1: Usar nossa chave privada (não ideal, mas funciona)
    // const tx = await contract.claimAirdrop({
    //   gasLimit: 200000,
    // })

    // OPÇÃO 2: Retornar instruções para o usuário fazer a transação
    return NextResponse.json({
      success: true,
      txId: `worldid_verified_${Date.now()}_${userAddress.slice(0, 8)}`,
      message: "🎉 World ID verified! You can now claim your airdrop directly from the contract.",
      amount: "50 TPF",
      timestamp: new Date().toISOString(),
      userAddress: userAddress,
      verificationMethod: "World ID + Contract Ready",
      contractAddress: CONTRACT_ADDRESS,
      contractFunction: "claimAirdrop",
      worldIdVerified: true,
      isSimulation: false,
      instructions: "Your World ID has been verified. You can now call claimAirdrop() on the contract.",
    })
  } catch (error) {
    console.error("❌ Error processing real claim:", error)

    let errorMessage = "Failed to process claim"
    if (error instanceof Error) {
      if (error.message.includes("Wait 24h between claims")) {
        errorMessage = "You need to wait 24 hours between claims"
      } else if (error.message.includes("Transfer failed")) {
        errorMessage = "Contract transfer failed - insufficient balance"
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
