import type { MiniAppPaymentSuccessPayload } from "@worldcoin/minikit-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload

    // Fetch the payment reference from cookies
    const cookieStore = cookies()
    const reference = cookieStore.get("payment-nonce")?.value

    if (!reference) {
      console.error("No payment reference found in cookies.")
      return NextResponse.json({ success: false, message: "Missing reference" })
    }

    console.log("Payment reference:", reference)
    console.log("Payload received:", payload)

    // 1. Check that the transaction received from the mini app matches the one initiated
    if (payload.reference === reference) {
      const response = await fetch(
        `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
          },
        },
      )

      if (!response.ok) {
        console.error("Error fetching transaction data:", response.statusText)
        return NextResponse.json({ success: false, message: "Failed to fetch transaction" })
      }

      const transaction = await response.json()

      // 2. Optimistically confirm the transaction or check its status
      if (transaction.reference === reference && transaction.status !== "failed") {
        console.log("Transaction confirmed successfully:", transaction)
        return NextResponse.json({ success: true })
      } else {
        console.error("Transaction failed or reference mismatch")
        return NextResponse.json({ success: false, message: "Transaction failed or mismatch" })
      }
    } else {
      console.error("Reference mismatch: Payload reference does not match the one stored.")
      return NextResponse.json({ success: false, message: "Reference mismatch" })
    }
  } catch (error) {
    console.error("Error processing payment confirmation:", error)
    return NextResponse.json({ success: false, message: "Internal server error" })
  }
}
