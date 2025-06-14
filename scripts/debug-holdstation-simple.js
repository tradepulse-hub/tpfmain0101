// Script mais simples para debugar
console.log("🔍 Debugando Holdstation SDK...")

// Primeiro, vamos ver se conseguimos importar usando require
console.log("📦 Tentando require...")
try {
  const holdstation = require("@holdstation/worldchain-sdk")
  console.log("✅ require funcionou!")
  console.log("Exports:", Object.keys(holdstation))
} catch (error) {
  console.log("❌ require falhou:", error.message)
}

// Tentar diferentes nomes de pacote
const packageNames = [
  "@holdstation/worldchain-sdk",
  "@holdstation/worldchain-ethers-v6",
  "@holdstation/sdk",
  "holdstation-sdk",
]

console.log("\n🔍 Testando diferentes nomes de pacote...")

for (const packageName of packageNames) {
  try {
    console.log(`\n📦 Tentando ${packageName}...`)
    const pkg = require(packageName)
    console.log(`✅ ${packageName} encontrado!`)
    console.log("Exports:", Object.keys(pkg))

    // Se encontrou, tentar analisar mais
    for (const [key, value] of Object.entries(pkg)) {
      console.log(`  - ${key}: ${typeof value}`)
      if (typeof value === "function") {
        console.log(`    Nome da função: ${value.name}`)
      }
    }
  } catch (error) {
    console.log(`❌ ${packageName} não encontrado`)
  }
}

// Verificar se existe algum arquivo de index
console.log("\n📄 Verificando arquivos de entrada...")
const fs = require("fs")
const path = require("path")

const possiblePaths = [
  "node_modules/@holdstation/worldchain-sdk",
  "node_modules/@holdstation/worldchain-ethers-v6",
  "node_modules/@holdstation",
]

for (const dirPath of possiblePaths) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`\n📂 Encontrado: ${dirPath}`)
      const files = fs.readdirSync(dirPath)
      console.log("Arquivos:", files)

      // Verificar package.json
      const packageJsonPath = path.join(dirPath, "package.json")
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
        console.log("Main:", packageJson.main)
        console.log("Module:", packageJson.module)
        console.log("Exports:", packageJson.exports)
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar ${dirPath}:`, error.message)
  }
}
