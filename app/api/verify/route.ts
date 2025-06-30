import { type NextRequest, NextResponse } from "next/server"
import type { ISuccessResult } from "@worldcoin/minikit-js"
import { hashToField } from "@worldcoin/idkit-core/hashing"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal: string | undefined
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload

    // Log detalhado para debug
    console.log("=== VERIFY API DEBUG ===")
    console.log("Received payload:", JSON.stringify(payload, null, 2))
    console.log("Action:", action)
    console.log("Signal:", signal)

    // APP_ID fixo baseado no que você forneceu
    const app_id = "app_a3a55e132983350c67923dd57dc22c5e"

    console.log("Using APP_ID:", app_id)

    // Hash do signal usando a função oficial da World ID
    const signal_hash = signal ? hashToField(signal).digest : hashToField("").digest
    console.log("Signal hash:", signal_hash)

    // Preparar dados para a API v2 da World ID
    const verifyData = {
      nullifier_hash: payload.nullifier_hash,
      merkle_root: payload.merkle_root,
      proof: payload.proof,
      verification_level: payload.verification_level,
      action: action,
      signal_hash: signal_hash,
    }

    console.log("Sending to World ID API v2:", JSON.stringify(verifyData, null, 2))

    // Chamar a API v2 da World ID Developer Portal
    const worldIdResponse = await fetch(`https://developer.worldcoin.org/api/v2/verify/${app_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TPulseFi-Airdrop/1.0",
      },
      body: JSON.stringify(verifyData),
    })

    console.log("World ID API response status:", worldIdResponse.status)

    const worldIdResult = await worldIdResponse.json()
    console.log("World ID API response:", JSON.stringify(worldIdResult, null, 2))

    if (worldIdResponse.ok && worldIdResult.success) {
      // Verificação bem-sucedida
      console.log("World ID verification successful for:", signal)
      return NextResponse.json({
        success: true,
        verifyRes: worldIdResult,
        status: 200,
      })
    } else {
      // Verificação falhou
      console.log("World ID verification failed:", worldIdResult)

      // Determinar a mensagem de erro baseada na resposta
      let errorMessage = "Verification failed"

      if (worldIdResponse.status === 400) {
        if (worldIdResult.code === "already_verified") {
          errorMessage = "You have already verified for this action."
        } else if (worldIdResult.code === "invalid_proof") {
          errorMessage = "Invalid proof provided."
        } else if (worldIdResult.code === "invalid_merkle_root") {
          errorMessage = "Invalid merkle root."
        } else if (worldIdResult.code === "max_verifications_reached") {
          errorMessage = "Maximum verifications reached for this action."
        } else {
          errorMessage = worldIdResult.detail || worldIdResult.message || "Verification failed"
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: worldIdResult,
        status: worldIdResponse.status,
      })
    }
  } catch (error) {
    console.error("Error in verification endpoint:", error)

    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    })
  }
}
