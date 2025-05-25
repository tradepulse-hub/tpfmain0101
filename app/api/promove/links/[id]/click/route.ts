import { type NextRequest, NextResponse } from "next/server"

interface Promotion {
  id: string
  url: string
  title: string
  description: string
  clicks: number
  createdAt: string
  userId: string
}

// Import the same promotions array (in a real app, this would be in a database)
const promotions: Promotion[] = []

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find and update the promotion
    const promotionIndex = promotions.findIndex((p) => p.id === id)

    if (promotionIndex === -1) {
      return NextResponse.json({ success: false, error: "Promotion not found" }, { status: 404 })
    }

    // Check if promotion is still valid (not expired)
    const promotion = promotions[promotionIndex]
    const oneHourAgo = Date.now() - 3600000
    const createdTime = new Date(promotion.createdAt).getTime()

    if (createdTime <= oneHourAgo) {
      return NextResponse.json({ success: false, error: "Promotion expired" }, { status: 410 })
    }

    // Increment click count
    promotions[promotionIndex].clicks += 1

    return NextResponse.json({
      success: true,
      clicks: promotions[promotionIndex].clicks,
    })
  } catch (error) {
    console.error("Error tracking click:", error)
    return NextResponse.json({ success: false, error: "Failed to track click" }, { status: 500 })
  }
}
