import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

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
    const app_id = "app_a3a55e132983350c67923dd57dc22c5e" as `app_${string}`

    console.log("Using APP_ID:", app_id)
    console.log("Verifying World ID proof for action:", action, "signal:", signal)

    // Verificar a prova com World ID
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

    console.log("World ID verification result:", JSON.stringify(verifyRes, null, 2))

    if (verifyRes.success) {
      // Aqui você pode adicionar lógica adicional, como:
      // - Salvar no banco de dados que o usuário foi verificado
      // - Verificar se já reivindicou antes
      // - Outras validações de negócio

      console.log("World ID verification successful for:", signal)
      return NextResponse.json({ verifyRes, status: 200 })
    } else {
      // Usuário já verificou ou erro na verificação
      console.log("World ID verification failed:", verifyRes)
      return NextResponse.json({
        verifyRes,
        status: 400,
        error: verifyRes.detail || "Verification failed. You may have already claimed.",
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
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    })
  }
}
