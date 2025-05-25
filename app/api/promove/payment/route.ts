import { type NextRequest, NextResponse } from "next/server"

interface PaymentRecord {
  id: string
  userId: string
  transactionHash: string
  amount: string
  token: string
  createdAt: string
}

// In-memory storage for payment records
const payments: PaymentRecord[] = []

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionHash, amount, token } = await request.json()

    if (!userId || !transactionHash || !amount || !token) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    const newPayment: PaymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionHash,
      amount,
      token,
      createdAt: new Date().toISOString(),
    }

    payments.push(newPayment)

    return NextResponse.json({
      success: true,
      payment: newPayment,
    })
  } catch (error) {
    console.error("Error recording payment:", error)
    return NextResponse.json({ success: false, error: "Failed to record payment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (userId) {
      const userPayments = payments.filter((p) => p.userId === userId)
      return NextResponse.json({
        success: true,
        payments: userPayments,
      })
    }

    return NextResponse.json({
      success: true,
      payments: payments,
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 })
  }
}
