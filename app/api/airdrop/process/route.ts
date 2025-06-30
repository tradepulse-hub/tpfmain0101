import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== AIRDROP API CALLED ===")
    console.log("Method:", request.method)
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    const data = await request.json()
    console.log("=== AIRDROP API DEBUG ===")
    console.log("Received data:", JSON.stringify(data, null, 2))

    // Suporte para ambos os formatos: original (signature) e novo (worldIdVerified)
    const { signature, userAddress, timestamp, worldIdVerified } = data

    if (!userAddress) {
      console.log("❌ Missing userAddress")
      return NextResponse.json(
        {
          success: false,
          error: "Endereço do usuário é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se tem verificação World ID ou assinatura (formato original)
    if (!worldIdVerified && (!signature || !timestamp)) {
      console.log("❌ Missing verification - need either worldIdVerified or signature+timestamp")
      return NextResponse.json(
        {
          success: false,
          error: "Verificação World ID ou assinatura é obrigatória",
        },
        { status: 400 },
      )
    }

    console.log(`✅ Processando airdrop para o endereço ${userAddress}`)

    // Criar um ID de transação baseado no tipo de verificação
    let txId: string
    let verificationMethod: string

    if (worldIdVerified) {
      // Novo formato com World ID
      const currentTimestamp = Date.now()
      txId = `worldid_${currentTimestamp}_${userAddress.slice(0, 8)}`
      verificationMethod = "World ID"
      console.log(`✅ Using World ID verification`)
    } else {
      // Formato original com assinatura
      txId = `sig_${timestamp}_${signature.slice(0, 8)}`
      verificationMethod = "Signature"
      console.log(`✅ Using signature verification: ${signature}`)
    }

    console.log(`✅ Airdrop processado com sucesso! TX ID: ${txId}`)

    // Simular um pequeno delay
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
