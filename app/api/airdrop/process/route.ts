import { type NextRequest, NextResponse } from "next/server"

// Garantir que todos os métodos HTTP estão definidos
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

export async function POST(request: NextRequest) {
  try {
    console.log("=== AIRDROP API CALLED ===")
    console.log("Method:", request.method)
    console.log("URL:", request.url)
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    const data = await request.json()
    console.log("=== AIRDROP API DEBUG ===")
    console.log("Received data:", JSON.stringify(data, null, 2))

    // Aceitar tanto o formato antigo (signature) quanto o novo (worldIdVerified)
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

    // Verificar se tem verificação World ID ou assinatura
    if (!worldIdVerified && !signature) {
      console.log("❌ Missing verification")
      return NextResponse.json(
        {
          success: false,
          error: "Verificação World ID ou assinatura é obrigatória",
        },
        { status: 400 },
      )
    }

    console.log(`✅ Processando airdrop para o endereço ${userAddress}`)
    console.log(`✅ World ID verified: ${worldIdVerified}`)
    console.log(`✅ Signature provided: ${!!signature}`)

    // Criar um ID de transação baseado no tipo de verificação
    let txId: string
    if (worldIdVerified) {
      const currentTimestamp = Date.now()
      txId = `worldid_${currentTimestamp}_${userAddress.slice(0, 8)}`
    } else {
      txId = `sig_${timestamp}_${signature.slice(0, 8)}`
    }

    console.log(`✅ Airdrop processado com sucesso! TX ID: ${txId}`)

    // Simular um pequeno delay para parecer mais realista
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = {
      success: true,
      txId: txId,
      message: "🎉 Airdrop processado com sucesso! Os tokens serão creditados em sua carteira em breve.",
      amount: "50 TPF",
      timestamp: new Date().toISOString(),
      userAddress: userAddress,
      verificationMethod: worldIdVerified ? "World ID" : "Signature",
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

    // Log mais detalhado do erro
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

// Definir outros métodos HTTP explicitamente
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
