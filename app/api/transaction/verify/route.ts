import { type NextRequest, NextResponse } from "next/server"

interface IRequestPayload {
  transaction_id: string
}

export async function POST(req: NextRequest) {
  try {
    const { transaction_id } = (await req.json()) as IRequestPayload

    if (!transaction_id) {
      return NextResponse.json({ error: "Invalid transaction_id" }, { status: 400 })
    }

    console.log("Verifying transaction:", transaction_id)

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transaction_id}?app_id=${process.env.APP_ID}&type=transaction`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error verifying transaction:", errorText)
      return NextResponse.json({ error: "Failed to verify transaction" }, { status: response.status })
    }

    const transaction = await response.json()
    console.log("Transaction verified:", transaction)

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

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in confirm-transaction API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
