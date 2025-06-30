import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { userAddress, worldIdVerified } = data

    console.log("=== AIRDROP API DEBUG ===")
    console.log("Request data:", data)
    console.log("User address:", userAddress)
    console.log("World ID verified:", worldIdVerified)

    if (!userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Endereço do usuário é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se o usuário passou pela verificação World ID
    if (!worldIdVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Verificação World ID é obrigatória",
        },
        { status: 400 },
      )
    }

    console.log(`✅ Processando airdrop para o endereço ${userAddress} (World ID verificado)`)

    // Criar um ID de transação simulado
    const timestamp = Date.now()
    const txId = `worldid_${timestamp}_${userAddress.slice(0, 8)}`

    console.log(`✅ Airdrop processado com sucesso! TX ID: ${txId}`)

    // Em um ambiente real, você usaria uma chave privada para enviar a transação
    // Aqui estamos apenas simulando o sucesso

    return NextResponse.json({
      success: true,
      txId: txId,
      message: "🎉 Airdrop processado com sucesso! Os tokens serão creditados em sua carteira em breve.",
      amount: "50 TPF",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erro ao processar airdrop:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao processar airdrop",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
