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

    // Você precisa definir APP_ID no seu .env
    const app_id = process.env.APP_ID as `app_${string}`

    if (!app_id) {
      return NextResponse.json({
        error: "APP_ID not configured",
        status: 500,
      })
    }

    // Verificar a prova com World ID
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

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
        error: "Verification failed. You may have already claimed.",
      })
    }
  } catch (error) {
    console.error("Error in verification endpoint:", error)
    return NextResponse.json({
      error: "Internal server error",
      status: 500,
    })
  }
}
