"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [debugOutput, setDebugOutput] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setDebugOutput((prev) => [...prev, message])
  }

  const debugHoldstationMethods = async () => {
    try {
      addLog("🔍 DEBUGGING HOLDSTATION SDK METHODS...")
      addLog("📦 Importing modules...")

      // Importar os módulos
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      addLog("✅ Modules imported successfully!")

      // Analisar exports do SDK
      addLog("\n=== HOLDSTATION SDK EXPORTS ===")
      const sdkExports = Object.keys(HoldstationModule)
      addLog(`SDK Exports: ${JSON.stringify(sdkExports)}`)

      for (const exportName of sdkExports) {
        const exportValue = HoldstationModule[exportName]
        addLog(`├─ ${exportName}: ${typeof exportValue}`)
      }

      // Analisar exports do Ethers
      addLog("\n=== ETHERS MODULE EXPORTS ===")
      const ethersExports = Object.keys(EthersModule)
      addLog(`Ethers Exports: ${JSON.stringify(ethersExports)}`)

      for (const exportName of ethersExports) {
        const exportValue = EthersModule[exportName]
        addLog(`├─ ${exportName}: ${typeof exportValue}`)
      }

      // Tentar criar instâncias e analisar métodos
      addLog("\n=== CREATING INSTANCES FOR METHOD ANALYSIS ===")

      const { ethers } = await import("ethers")

      // Criar provider
      const provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public", {
        chainId: 480,
        name: "worldchain",
      })

      // Criar Client
      const { Client } = EthersModule
      const client = new Client(provider)
      addLog("✅ Client created")

      // Analisar métodos do Client
      addLog("\n=== CLIENT METHODS ===")
      const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      addLog(`Client methods: ${JSON.stringify(clientMethods)}`)

      // Testar métodos básicos do Client
      try {
        addLog(`Client name: ${client.name()}`)
        addLog(`Client chainId: ${client.getChainId()}`)
      } catch (e) {
        addLog(`Client basic methods failed: ${e.message}`)
      }

      // Configurar config global
      const { config } = HoldstationModule
      config.client = client
      addLog("✅ Global config set")

      // Analisar TokenProvider
      if (HoldstationModule.TokenProvider) {
        addLog("\n=== TOKEN PROVIDER METHODS ===")
        const tokenProvider = new HoldstationModule.TokenProvider()
        const tokenProviderMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tokenProvider))
        addLog(`TokenProvider methods: ${JSON.stringify(tokenProviderMethods)}`)

        // Testar métodos do TokenProvider
        for (const method of tokenProviderMethods) {
          if (typeof tokenProvider[method] === "function" && !method.startsWith("_") && method !== "constructor") {
            addLog(`├─ ${method}: function`)
          }
        }
      }

      // Analisar Quoter
      if (HoldstationModule.Quoter) {
        addLog("\n=== QUOTER METHODS (SDK) ===")
        try {
          const quoter = new HoldstationModule.Quoter(client)
          const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(quoter))
          addLog(`Quoter methods: ${JSON.stringify(quoterMethods)}`)

          for (const method of quoterMethods) {
            if (typeof quoter[method] === "function" && !method.startsWith("_") && method !== "constructor") {
              addLog(`├─ ${method}: function`)
            }
          }
        } catch (e) {
          addLog(`❌ Failed to create SDK Quoter: ${e.message}`)
        }
      }

      if (EthersModule.Quoter) {
        addLog("\n=== QUOTER METHODS (ETHERS) ===")
        try {
          const quoter = new EthersModule.Quoter(client)
          const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(quoter))
          addLog(`Ethers Quoter methods: ${JSON.stringify(quoterMethods)}`)

          for (const method of quoterMethods) {
            if (typeof quoter[method] === "function" && !method.startsWith("_") && method !== "constructor") {
              addLog(`├─ ${method}: function`)
            }
          }
        } catch (e) {
          addLog(`❌ Failed to create Ethers Quoter: ${e.message}`)
        }
      }

      // Analisar SwapHelper
      if (HoldstationModule.SwapHelper) {
        addLog("\n=== SWAP HELPER METHODS (SDK) ===")
        try {
          const { inmemoryTokenStorage } = HoldstationModule
          const swapHelper = new HoldstationModule.SwapHelper(client, {
            tokenStorage: inmemoryTokenStorage,
          })
          const swapHelperMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(swapHelper))
          addLog(`SwapHelper methods: ${JSON.stringify(swapHelperMethods)}`)

          for (const method of swapHelperMethods) {
            if (typeof swapHelper[method] === "function" && !method.startsWith("_") && method !== "constructor") {
              addLog(`├─ ${method}: function`)
            }
          }
        } catch (e) {
          addLog(`❌ Failed to create SDK SwapHelper: ${e.message}`)
        }
      }

      if (EthersModule.SwapHelper) {
        addLog("\n=== SWAP HELPER METHODS (ETHERS) ===")
        try {
          const { inmemoryTokenStorage } = HoldstationModule
          const swapHelper = new EthersModule.SwapHelper(client, {
            tokenStorage: inmemoryTokenStorage,
          })
          const swapHelperMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(swapHelper))
          addLog(`Ethers SwapHelper methods: ${JSON.stringify(swapHelperMethods)}`)

          for (const method of swapHelperMethods) {
            if (typeof swapHelper[method] === "function" && !method.startsWith("_") && method !== "constructor") {
              addLog(`├─ ${method}: function`)
            }
          }
        } catch (e) {
          addLog(`❌ Failed to create Ethers SwapHelper: ${e.message}`)
        }
      }

      // Verificar outros objetos úteis
      addLog("\n=== OTHER USEFUL OBJECTS ===")
      addLog(`Config object keys: ${JSON.stringify(Object.keys(config))}`)
      addLog(`Config.client exists: ${!!config.client}`)

      if (HoldstationModule.inmemoryTokenStorage) {
        addLog(`inmemoryTokenStorage: ${typeof HoldstationModule.inmemoryTokenStorage}`)
      }

      addLog("\n✅ DEBUG COMPLETE!")
    } catch (error) {
      addLog(`❌ Debug failed: ${error.message}`)
      console.error("Full error:", error)
    }
  }

  useEffect(() => {
    debugHoldstationMethods()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Holdstation SDK Debug</h1>
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {debugOutput.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
