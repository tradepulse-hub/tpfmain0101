// Script para debugar a estrutura do pacote Holdstation
console.log("🔍 Debugando estrutura do pacote @holdstation/worldchain-sdk...")

async function debugHoldstationPackage() {
  try {
    // Tentar importar o pacote
    console.log("📦 Importando @holdstation/worldchain-sdk...")
    const HoldstationModule = await import("@holdstation/worldchain-sdk")

    console.log("✅ Pacote importado com sucesso!")
    console.log("📋 Estrutura do módulo:")
    console.log("- Exports disponíveis:", Object.keys(HoldstationModule))

    // Analisar cada export
    for (const [key, value] of Object.entries(HoldstationModule)) {
      console.log(`\n🔍 Export "${key}":`)
      console.log(`  - Tipo: ${typeof value}`)

      if (typeof value === "function") {
        console.log(`  - É uma função/classe: ✅`)
        console.log(`  - Nome: ${value.name}`)
        console.log(`  - Prototype:`, Object.getOwnPropertyNames(value.prototype || {}))
      } else if (typeof value === "object" && value !== null) {
        console.log(`  - É um objeto: ✅`)
        console.log(`  - Propriedades:`, Object.keys(value))
      } else {
        console.log(`  - Valor:`, value)
      }
    }

    // Tentar instanciar cada possível classe
    console.log("\n🧪 Testando instanciação...")

    const possibleClasses = Object.entries(HoldstationModule).filter(
      ([key, value]) => typeof value === "function" && value.name,
    )

    for (const [key, ClassConstructor] of possibleClasses) {
      try {
        console.log(`\n🔧 Tentando instanciar "${key}"...`)
        const instance = new ClassConstructor({
          chainId: 480,
          rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
        })
        console.log(`✅ "${key}" instanciado com sucesso!`)
        console.log(`  - Métodos disponíveis:`, Object.getOwnPropertyNames(Object.getPrototypeOf(instance)))
      } catch (error) {
        console.log(`❌ Erro ao instanciar "${key}":`, error.message)
      }
    }
  } catch (error) {
    console.error("❌ Erro ao importar pacote:", error)
  }
}

// Executar debug
debugHoldstationPackage()
