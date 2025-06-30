import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"
import { type NextRequest, NextResponse } from "next/server"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal: string | undefined
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload

    console.log("=== VERIFY API DEBUG ===")
    console.log("Received payload:", JSON.stringify(payload, null, 2))
    console.log("Action:", action)
    console.log("Signal:", signal)

    const app_id = process.env.APP_ID as `app_${string}`

    if (!app_id) {
      console.error("APP_ID environment variable not set")
      return NextResponse.json({
        success: false,
        error: "Server configuration error",
        status: 500,
      })
    }

    console.log("Using APP_ID:", app_id)

    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

    console.log("World ID verification result:", verifyRes)

    if (verifyRes.success) {
      // This is where you should perform backend actions if the verification succeeds
      // Such as, setting a user as "verified" in a database
      return NextResponse.json({
        success: true,
        verifyRes,
        status: 200,
      })
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      return NextResponse.json({
        success: false,
        verifyRes,
        status: 400,
      })
    }
  } catch (error) {
    console.error("Error in verification endpoint:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    })
  }
}
