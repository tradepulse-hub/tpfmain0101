import { NextResponse } from "next/server"

// Marcar como rota dinâmica
export const dynamic = "force-dynamic"

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

    console.log(`Simulating airdrop status check for address: ${address}`)

    // Simular dados de airdrop
    const now = Math.floor(Date.now() / 1000)
    const lastClaimTime = now - 3600 // 1 hora atrás
    const claimInterval = 24 * 60 * 60 // 24 horas
    const nextClaimTime = lastClaimTime + claimInterval
    const canClaim = now >= nextClaimTime

    return NextResponse.json({
      success: true,
      lastClaimTime: lastClaimTime,
      nextClaimTime: nextClaimTime,
      canClaim: canClaim,
      timeRemaining: canClaim ? 0 : nextClaimTime - now,
      airdropAmount: "100",
      rpcUsed: "simulated",
    })
  } catch (error) {
    console.error("Error simulating airdrop status:", error)
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
