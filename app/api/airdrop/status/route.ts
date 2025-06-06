import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { airdropContractABI, AIRDROP_CONTRACT_ADDRESS, RPC_ENDPOINTS } from "@/lib/airdropContractABI"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address parameter is required",
        },
        { status: 400 },
      )
    }

    console.log(`Checking airdrop status for address: ${address}`)
    console.log(`Using contract address: ${AIRDROP_CONTRACT_ADDRESS}`)

    // Tentar cada RPC até encontrar um que funcione
    let lastError = null

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        console.log(`Trying RPC endpoint: ${rpcUrl}`)

        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Verificar se o contrato existe
        const code = await provider.getCode(AIRDROP_CONTRACT_ADDRESS)
        if (code === "0x") {
          console.log(`Contract not found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
          continue // Tentar próximo RPC
        }

        console.log(`Contract found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)

        const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropContractABI, provider)

        // Buscar dados do contrato
        const [lastClaimTime, claimInterval, dailyAirdrop] = await Promise.all([
          contract.lastClaimTime(address),
          contract.CLAIM_INTERVAL(),
          contract.DAILY_AIRDROP(),
        ])

        console.log("Contract data retrieved:", {
          lastClaimTime: Number(lastClaimTime),
          claimInterval: Number(claimInterval),
          dailyAirdrop: dailyAirdrop.toString(),
        })

        const now = Math.floor(Date.now() / 1000)
        const nextClaimTime = Number(lastClaimTime) + Number(claimInterval)
        const canClaim = Number(lastClaimTime) === 0 || now >= nextClaimTime

        return NextResponse.json({
          success: true,
          lastClaimTime: Number(lastClaimTime),
          nextClaimTime: nextClaimTime,
          canClaim: canClaim,
          timeRemaining: canClaim ? 0 : nextClaimTime - now,
          airdropAmount: ethers.formatUnits(dailyAirdrop, 18),
          rpcUsed: rpcUrl,
        })
      } catch (error) {
        console.error(`Error with RPC ${rpcUrl}:`, error)
        lastError = error
        // Continuar para o próximo RPC
      }
    }

    // Se chegamos aqui, nenhum RPC funcionou
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch airdrop status from any RPC endpoint",
        details: lastError instanceof Error ? lastError.message : "Unknown error",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error fetching airdrop status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch airdrop status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
