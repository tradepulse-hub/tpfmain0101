import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET() {
  try {
    // Gerar um nonce aleatório para autenticação
    const nonce = randomBytes(32).toString("hex")

    // Armazenar o nonce em um cookie ou banco de dados para validação posterior
    // Aqui estamos apenas retornando o nonce, mas em produção você deve armazená-lo

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error("Erro ao gerar nonce:", error)
    return NextResponse.json({ error: "Erro ao gerar nonce" }, { status: 500 })
  }
}
