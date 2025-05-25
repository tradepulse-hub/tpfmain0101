import { type NextRequest, NextResponse } from "next/server"

interface StormWord {
  id: string
  text: string
  timestamp: number
  color: string
}

// Armazenamento temporário em memória (em produção, usar banco de dados)
let stormWords: StormWord[] = []

export async function GET() {
  try {
    // Retornar apenas palavras dos últimos 60 segundos (para 10 segundos de exibição + margem)
    const now = Date.now()
    const activeWords = stormWords.filter((word) => now - word.timestamp < 60000)

    // Limpar palavras antigas
    stormWords = activeWords

    return NextResponse.json({ words: activeWords })
  } catch (error) {
    console.error("Erro ao buscar palavras:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, color } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 })
    }

    // Validar tamanho do texto
    if (text.length > 20) {
      return NextResponse.json({ error: "Texto muito longo" }, { status: 400 })
    }

    // Criar nova palavra
    const newWord: StormWord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      timestamp: Date.now(),
      color: color || "#FF6B6B",
    }

    // Adicionar à lista
    stormWords.push(newWord)

    // Limitar a 100 palavras para evitar sobrecarga
    if (stormWords.length > 100) {
      stormWords = stormWords.slice(-100)
    }

    return NextResponse.json({ success: true, word: newWord })
  } catch (error) {
    console.error("Erro ao salvar palavra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
