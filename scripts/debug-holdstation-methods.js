console.log("🔍 DEBUGGING HOLDSTATION SDK METHODS...")

async function debugHoldstationMethods() {
  try {
    console.log("📦 Importing modules...")

    // Importar os módulos
    const [HoldstationModule, EthersModule] = await Promise.all([
      import("@holdstation/worldchain-sdk"),
      import("@holdstation/worldchain-ethers-v6"),
    ])

    console.log("✅ Modules imported successfully!")

    // Analisar exports do SDK
    console.log("\n=== HOLDSTATION SDK EXPORTS ===")
    const sdkExports = Object.keys(HoldstationModule)
    console.log("SDK Exports:", sdkExports)

    for (const exportName of sdkExports) {
      const exportValue = HoldstationModule[exportName]
      console.log(`├─ ${exportName}:`, typeof exportValue)

      if (typeof exportValue === "function") {
        try {
          console.log(`│  └─ Constructor signature:`, exportValue.toString().slice(0, 200) + "...")
        } catch (e) {
          console.log(`│  └─ Cannot inspect constructor`)
        }
      }
    }

    // Analisar exports do Ethers
    console.log("\n=== ETHERS MODULE EXPORTS ===")
    const ethersExports = Object.keys(EthersModule)
    console.log("Ethers Exports:", ethersExports)

    for (const exportName of ethersExports) {
      const exportValue = EthersModule[exportName]
      console.log(`├─ ${exportName}:`, typeof exportValue)
    }

    // Tentar criar instâncias e analisar métodos
    console.log("\n=== CREATING INSTANCES FOR METHOD ANALYSIS ===")

    const { ethers } = await import("ethers")

    // Criar provider
    const provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public", {
      chainId: 480,
      name: "worldchain",
    })

    // Criar Client
    const { Client } = EthersModule
    const client = new Client(provider)
    console.log("✅ Client created")

    // Analisar métodos do Client
    console.log("\n=== CLIENT METHODS ===")
    const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
    console.log("Client methods:", clientMethods)

    // Testar métodos básicos do Client
    try {
      console.log("Client name:", client.name())
      console.log("Client chainId:", client.getChainId())
    } catch (e) {
      console.log("Client basic methods failed:", e.message)
    }

    // Configurar config global
    const { config } = HoldstationModule
    config.client = client
    console.log("✅ Global config set")

    // Analisar TokenProvider
    if (HoldstationModule.TokenProvider) {
      console.log("\n=== TOKEN PROVIDER METHODS ===")
      const tokenProvider = new HoldstationModule.TokenProvider()
      const tokenProviderMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tokenProvider))
      console.log("TokenProvider methods:", tokenProviderMethods)

      // Testar métodos do TokenProvider
      for (const method of tokenProviderMethods) {
        if (typeof tokenProvider[method] === "function" && !method.startsWith("_") && method !== "constructor") {
          console.log(`├─ ${method}: function`)
          try {
            const methodStr = tokenProvider[method].toString()
            const params = methodStr.match(/$$([^)]*)$$/)?.[1] || ""
            console.log(`│  └─ Parameters: (${params})`)
          } catch (e) {
            console.log(`│  └─ Cannot inspect parameters`)
          }
        }
      }
    }

    // Analisar Quoter
    if (HoldstationModule.Quoter) {
      console.log("\n=== QUOTER METHODS ===")
      try {
        const quoter = new HoldstationModule.Quoter(client)
        const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(quoter))
        console.log("Quoter methods:", quoterMethods)

        for (const method of quoterMethods) {
          if (typeof quoter[method] === "function" && !method.startsWith("_") && method !== "constructor") {
            console.log(`├─ ${method}: function`)
            try {
              const methodStr = quoter[method].toString()
              const params = methodStr.match(/$$([^)]*)$$/)?.[1] || ""
              console.log(`│  └─ Parameters: (${params})`)
            } catch (e) {
              console.log(`│  └─ Cannot inspect parameters`)
            }
          }
        }
      } catch (e) {
        console.log("❌ Failed to create Quoter:", e.message)
      }
    } else if (EthersModule.Quoter) {
      console.log("\n=== ETHERS QUOTER METHODS ===")
      try {
        const quoter = new EthersModule.Quoter(client)
        const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(quoter))
        console.log("Ethers Quoter methods:", quoterMethods)

        for (const method of quoterMethods) {
          if (typeof quoter[method] === "function" && !method.startsWith("_") && method !== "constructor") {
            console.log(`├─ ${method}: function`)
          }
        }
      } catch (e) {
        console.log("❌ Failed to create Ethers Quoter:", e.message)
      }
    }

    // Analisar SwapHelper
    if (HoldstationModule.SwapHelper) {
      console.log("\n=== SWAP HELPER METHODS ===")
      try {
        const { inmemoryTokenStorage } = HoldstationModule
        const swapHelper = new HoldstationModule.SwapHelper(client, {
          tokenStorage: inmemoryTokenStorage,
        })
        const swapHelperMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(swapHelper))
        console.log("SwapHelper methods:", swapHelperMethods)

        for (const method of swapHelperMethods) {
          if (typeof swapHelper[method] === "function" && !method.startsWith("_") && method !== "constructor") {
            console.log(`├─ ${method}: function`)
            try {
              const methodStr = swapHelper[method].toString()
              const params = methodStr.match(/$$([^)]*)$$/)?.[1] || ""
              console.log(`│  └─ Parameters: (${params})`)
            } catch (e) {
              console.log(`│  └─ Cannot inspect parameters`)
            }
          }
        }
      } catch (e) {
        console.log("❌ Failed to create SwapHelper:", e.message)
      }
    } else if (EthersModule.SwapHelper) {
      console.log("\n=== ETHERS SWAP HELPER METHODS ===")
      try {
        const { inmemoryTokenStorage } = HoldstationModule
        const swapHelper = new EthersModule.SwapHelper(client, {
          tokenStorage: inmemoryTokenStorage,
        })
        const swapHelperMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(swapHelper))
        console.log("Ethers SwapHelper methods:", swapHelperMethods)

        for (const method of swapHelperMethods) {
          if (typeof swapHelper[method] === "function" && !method.startsWith("_") && method !== "constructor") {
            console.log(`├─ ${method}: function`)
          }
        }
      } catch (e) {
        console.log("❌ Failed to create Ethers SwapHelper:", e.message)
      }
    }

    // Verificar se existem outros objetos úteis
    console.log("\n=== OTHER USEFUL OBJECTS ===")

    // Verificar config
    console.log("Config object:", Object.keys(config))
    console.log("Config.client exists:", !!config.client)

    // Verificar inmemoryTokenStorage
    if (HoldstationModule.inmemoryTokenStorage) {
      console.log("inmemoryTokenStorage:", typeof HoldstationModule.inmemoryTokenStorage)
      console.log("inmemoryTokenStorage methods:", Object.getOwnPropertyNames(HoldstationModule.inmemoryTokenStorage))
    }

    console.log("\n✅ DEBUG COMPLETE!")
  } catch (error) {
    console.error("❌ Debug failed:", error)
  }
}

// Executar debug
debugHoldstationMethods()
