import { NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

export async function POST(request: Request) {
  try {
    console.log("=== AIRDROP PROCESS API CALLED ===")

    const data = await request.json()
    console.log("Received data:", JSON.stringify(data, null, 2))

    const { signature, userAddress, timestamp, worldIdPayload, action, signal } = data

    // Verificar parâmetros básicos
    if (!userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Endereço do usuário é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se tem World ID payload (novo formato) ou assinatura (formato legado)
    if (!worldIdPayload && (!signature || !timestamp)) {
      return NextResponse.json(
        {
          success: false,
          error: "World ID verification ou assinatura é obrigatória",
        },
        { status: 400 },
      )
    }

    let verificationMethod = "Signature"
    let txId = ""

    // Se tem World ID payload, verificar com World ID
    if (worldIdPayload) {
      console.log("=== WORLD ID VERIFICATION ===")

      const app_id = process.env.APP_ID as `app_${string}`

      if (!app_id) {
        console.error("APP_ID environment variable not set")
        return NextResponse.json(
          {
            success: false,
            error: "Server configuration error - APP_ID not configured",
          },
          { status: 500 },
        )
      }

      const actionId = action || "claim-tpf"
      const signalData = signal || userAddress

      console.log("Verifying World ID with:")
      console.log("- APP_ID:", app_id)
      console.log("- Action:", actionId)
      console.log("- Signal:", signalData)
      console.log("- Payload:", JSON.stringify(worldIdPayload, null, 2))

      try {
        const verifyRes = (await verifyCloudProof(
          worldIdPayload as ISuccessResult,
          app_id,
          actionId,
          signalData,
        )) as IVerifyResponse

        console.log("World ID verification result:", verifyRes)

        if (!verifyRes.success) {
          console.error("World ID verification failed:", verifyRes)
          return NextResponse.json(
            {
              success: false,
              error: "World ID verification failed",
              details: verifyRes.detail || "Invalid World ID proof",
            },
            { status: 400 },
          )
        }

        console.log("✅ World ID verification successful!")
        verificationMethod = "World ID"
        txId = `worldid_${Date.now()}_${userAddress.slice(0, 8)}`
      } catch (worldIdError) {
        console.error("Error during World ID verification:", worldIdError)
        return NextResponse.json(
          {
            success: false,
            error: "World ID verification error",
            details: worldIdError instanceof Error ? worldIdError.message : "Unknown World ID error",
          },
          { status: 500 },
        )
      }
    } else {
      // Formato legado com assinatura
      console.log("=== SIGNATURE VERIFICATION (LEGACY) ===")
      console.log(`Processing airdrop for address ${userAddress} with signature ${signature}`)

      // Verificar se a assinatura é válida
      // Em um ambiente real, você verificaria a assinatura aqui
      verificationMethod = "Signature"
      txId = `sig_${timestamp}_${signature.slice(0, 8)}`
    }

    console.log(`✅ Airdrop processado com sucesso! TX ID: ${txId}`)
    console.log(`Verification method: ${verificationMethod}`)

    // Simular um pequeno delay para processamento
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = {
      success: true,
      txId: txId,
      message: "🎉 Airdrop processado com sucesso! Os tokens serão creditados em sua carteira em breve.",
      amount: "50 TPF",
      timestamp: new Date().toISOString(),
      userAddress: userAddress,
      verificationMethod: verificationMethod,
    }

    console.log("✅ Sending response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("❌ Erro ao processar airdrop:", error)

    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao processar airdrop",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Definir outros métodos HTTP explicitamente para evitar 405
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "GET method not supported. Use POST.",
      timestamp: new Date().toISOString(),
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "PUT method not supported. Use POST.",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "DELETE method not supported. Use POST.",
    },
    { status: 405 },
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: "PATCH method not supported. Use POST.",
    },
    { status: 405 },
  )
}
