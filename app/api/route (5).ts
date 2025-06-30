import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { action, nullifier_hash } = await req.json()

    // APP_ID fixo
    const app_id = "app_a3a55e132983350c67923dd57dc22c5e"

    console.log("=== PRECHECK API DEBUG ===")
    console.log("APP_ID:", app_id)
    console.log("Action:", action)
    console.log("Nullifier hash:", nullifier_hash)

    // Chamar a API de precheck da World ID
    const precheckResponse = await fetch(`https://developer.worldcoin.org/api/v1/precheck/${app_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TPulseFi-Airdrop/1.0",
      },
      body: JSON.stringify({
        action: action,
        nullifier_hash: nullifier_hash || "",
      }),
    })

    console.log("Precheck response status:", precheckResponse.status)

    const precheckResult = await precheckResponse.json()
    console.log("Precheck response:", JSON.stringify(precheckResult, null, 2))

    if (precheckResponse.ok) {
      return NextResponse.json({
        success: true,
        data: precheckResult,
        status: 200,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Action not found or inactive",
        details: precheckResult,
        status: precheckResponse.status,
      })
    }
  } catch (error) {
    console.error("Error in precheck endpoint:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    })
  }
}
