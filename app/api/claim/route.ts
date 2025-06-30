import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== CLAIM API CALLED ===")
    console.log("Method:", request.method)
    console.log("URL:", request.url)

    const data = await request.json()
    console.log("=== CLAIM API DEBUG ===")
    console.log("Received data:", JSON.stringify(data, null, 2))

    const { userAddress, worldIdVerified } = data

    if (!userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "User address is required",
        },
        { status: 400 },
      )
    }

    if (!worldIdVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "World ID verification is required",
        },
        { status: 400 },
      )
    }

    console.log(`✅ Processing claim for address ${userAddress}`)

    const currentTimestamp = Date.now()
    const txId = `claim_${currentTimestamp}_${userAddress.slice(0, 8)}`

    console.log(`✅ Claim processed successfully! TX ID: ${txId}`)

    const response = {
      success: true,
      txId: txId,
      message: "🎉 Claim processed successfully! Tokens will be credited to your wallet soon.",
      amount: "50 TPF",
      timestamp: new Date().toISOString(),
      userAddress: userAddress,
      verificationMethod: "World ID",
    }

    console.log("✅ Sending response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error processing claim:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
