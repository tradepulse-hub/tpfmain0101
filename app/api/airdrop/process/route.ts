import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("=== AIRDROP API DEBUG ===")
    console.log("Received data:", data)

    // Aceitar tanto o formato antigo (signature) quanto o novo (worldIdVerified)
    const { signature, userAddress, timestamp, worldIdVerified } = data

    if (!userAddress) {
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
    if (worldIdVerified) {
      const currentTimestamp = Date.now()
      txId = `worldid_${currentTimestamp}_${userAddress.slice(0, 8)}`
    } else {
      txId = `sig_${timestamp}_${signature.slice(0, 8)}`
    }

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
