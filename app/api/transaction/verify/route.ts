import { type NextRequest, NextResponse } from "next/server"

interface IRequestPayload {
  transaction_id: string
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== TRANSACTION VERIFY API START ===")

    const body = await req.json()
    console.log("Request body:", body)

    const { transaction_id } = body as IRequestPayload

    if (!transaction_id) {
      console.error("❌ Missing transaction_id in request")
      return NextResponse.json({ error: "Invalid transaction_id" }, { status: 400 })
    }

    console.log("✅ Transaction ID received:", transaction_id)
    console.log("Environment check:")
    console.log("├─ APP_ID:", process.env.APP_ID ? "✅ Set" : "❌ Missing")
    console.log("├─ DEV_PORTAL_API_KEY:", process.env.DEV_PORTAL_API_KEY ? "✅ Set" : "❌ Missing")

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.APP_ID || !process.env.DEV_PORTAL_API_KEY) {
      console.error("❌ Missing environment variables")
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "Missing APP_ID or DEV_PORTAL_API_KEY",
        },
        { status: 500 },
      )
    }

    const apiUrl = `https://developer.worldcoin.org/api/v2/minikit/transaction/${transaction_id}?app_id=${process.env.APP_ID}&type=transaction`
    console.log("API URL:", apiUrl)

    console.log("Making request to Worldcoin API...")
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Worldcoin API response:")
    console.log("├─ Status:", response.status)
    console.log("├─ Status Text:", response.statusText)
    console.log("├─ OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Worldcoin API Error:")
      console.error("├─ Status:", response.status)
      console.error("├─ Response:", errorText)
      console.error("└─ Headers:", Object.fromEntries(response.headers.entries()))

      return NextResponse.json(
        {
          error: "Failed to verify transaction",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const transaction = await response.json()
    console.log("✅ Transaction data received:", transaction)

    // Mapear a resposta para um formato consistente
    const result = {
      id: transaction.transactionId || transaction_id,
      hash: transaction.transactionHash,
      status: transaction.transactionStatus,
      from: transaction.fromWalletAddress,
      to: transaction.toContractAddress,
      network: transaction.network,
      updatedAt: transaction.updatedAt,
    }

    console.log("✅ Formatted result:", result)
    console.log("=== TRANSACTION VERIFY API END ===")

    return NextResponse.json(result)
  } catch (error) {
    console.error("=== TRANSACTION VERIFY API ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("Full error:", error)
    console.error("=== END ERROR ===")

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Adicionar suporte para GET também
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
