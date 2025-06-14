console.log("🔍 Debug detalhado do Holdstation SDK...")

async function debugHoldstationDetailed() {
  try {
    // Importar os módulos
    console.log("📦 Importando módulos...")
    const HoldstationModule = await import("@holdstation/worldchain-sdk")
    const EthersModule = await import("@holdstation/worldchain-ethers-v6")

    console.log("✅ Módulos importados!")
    console.log("SDK exports:", Object.keys(HoldstationModule))
    console.log("Ethers exports:", Object.keys(EthersModule))

    // Testar Client
    const { Client } = EthersModule
    console.log("\n🔧 Testando Client...")
    console.log("Client type:", typeof Client)

    if (Client) {
      try {
        // Testar diferentes configurações
        const configs = [
          {
            rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
            chainId: 480,
          },
          {
            rpc: "https://worldchain-mainnet.g.alchemy.com/public",
            chain: 480,
          },
          {
            provider: "https://worldchain-mainnet.g.alchemy.com/public",
          },
          {
            url: "https://worldchain-mainnet.g.alchemy.com/public",
          },
          {}, // Vazio
        ]

        for (let i = 0; i < configs.length; i++) {
          try {
            console.log(`\n🔄 Tentando config ${i + 1}:`, configs[i])
            const client = new Client(configs[i])
            console.log(`✅ Config ${i + 1} funcionou!`)
            console.log("Client methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)))
            console.log("Client properties:", Object.keys(client))
            break
          } catch (error) {
            console.log(`❌ Config ${i + 1} falhou:`, error.message)
          }
        }
      } catch (error) {
        console.log("❌ Erro geral no Client:", error.message)
      }
    }

    // Testar Manager
    const { Manager } = HoldstationModule
    console.log("\n🔧 Testando Manager...")
    console.log("Manager type:", typeof Manager)

    if (Manager) {
      try {
        const manager = new Manager()
        console.log("✅ Manager criado!")
        console.log("Manager methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(manager)))
        console.log("Manager properties:", Object.keys(manager))

        // Testar se tem método setClient
        if (typeof manager.setClient === "function") {
          console.log("✅ Manager tem método setClient!")
        } else {
          console.log("⚠️ Manager NÃO tem método setClient")
        }
      } catch (error) {
        console.log("❌ Erro no Manager:", error.message)
      }
    }

    // Testar SwapHelper
    const { SwapHelper } = HoldstationModule
    console.log("\n🔧 Testando SwapHelper...")
    console.log("SwapHelper type:", typeof SwapHelper)

    if (SwapHelper) {
      try {
        const swapHelper = new SwapHelper()
        console.log("✅ SwapHelper criado!")
        console.log("SwapHelper methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(swapHelper)))
        console.log("SwapHelper properties:", Object.keys(swapHelper))

        // Testar se tem método setClient
        if (typeof swapHelper.setClient === "function") {
          console.log("✅ SwapHelper tem método setClient!")
        } else {
          console.log("⚠️ SwapHelper NÃO tem método setClient")
        }
      } catch (error) {
        console.log("❌ Erro no SwapHelper:", error.message)
      }
    }

    // Verificar defaultWorldchainConfig
    const { defaultWorldchainConfig } = HoldstationModule
    console.log("\n📋 defaultWorldchainConfig:", defaultWorldchainConfig)
  } catch (error) {
    console.error("❌ Erro geral:", error)
  }
}

debugHoldstationDetailed()
