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

// In-memory storage for promotions
let promotions: Promotion[] = []

// Clean expired promotions (older than 1 hour)
const cleanExpiredPromotions = () => {
  const oneHourAgo = Date.now() - 3600000 // 1 hour in milliseconds
  promotions = promotions.filter((promotion) => {
    const createdTime = new Date(promotion.createdAt).getTime()
    return createdTime > oneHourAgo
  })
}

export async function GET() {
  try {
    // Clean expired promotions before returning
    cleanExpiredPromotions()

    return NextResponse.json({
      success: true,
      promotions: promotions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    })
  } catch (error) {
    console.error("Error fetching promotions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch promotions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, title, description, userId } = await request.json()

    if (!url || !title || !userId) {
      return NextResponse.json({ success: false, error: "URL, title, and userId are required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 })
    }

    // Clean expired promotions before adding new one
    cleanExpiredPromotions()

    const newPromotion: Promotion = {
      id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title: title.slice(0, 100), // Limit title length
      description: description ? description.slice(0, 200) : "", // Limit description length
      clicks: 0,
      createdAt: new Date().toISOString(),
      userId,
    }

    promotions.push(newPromotion)

    return NextResponse.json({
      success: true,
      promotion: newPromotion,
    })
  } catch (error) {
    console.error("Error creating promotion:", error)
    return NextResponse.json({ success: false, error: "Failed to create promotion" }, { status: 500 })
  }
}
