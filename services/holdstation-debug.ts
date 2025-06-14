// DEBUG ESPECÍFICO PARA O FUNDADOR DA HOLDSTATION
// Mostra EXATAMENTE o request que fazemos para o SDK

export class HoldstationDebugger {
  static logExactRequest(params: any, method: string) {
    console.log("🚨 === HOLDSTATION FOUNDER DEBUG ===")
    console.log(`📡 Method being called: ${method}`)
    console.log("📋 EXACT REQUEST PARAMETERS:")
    console.log("├─ Raw params object:", params)
    console.log("├─ JSON stringified:", JSON.stringify(params, null, 2))
    console.log("├─ Type of each field:")

    for (const [key, value] of Object.entries(params)) {
      console.log(`│  ├─ ${key}: ${typeof value} = "${value}"`)
    }

    console.log("├─ Object keys:", Object.keys(params))
    console.log("├─ Object values:", Object.values(params))
    console.log("└─ Params length:", Object.keys(params).length)

    // Mostrar também como seria em diferentes formatos
    console.log("🔄 ALTERNATIVE FORMATS:")
    console.log("├─ As array:", Object.values(params))
    console.log("├─ As individual params:", ...Object.values(params))
    console.log("└─ As nested object:", { params })

    console.log("🚨 === END FOUNDER DEBUG ===")
  }

  static logMethodCall(obj: any, methodName: string, params: any) {
    console.log("🚨 === EXACT METHOD CALL DEBUG ===")
    console.log(`📡 Object: ${obj.constructor.name}`)
    console.log(`📡 Method: ${methodName}`)
    console.log(`📡 Method exists: ${typeof obj[methodName] === "function"}`)
    console.log(`📡 Method type: ${typeof obj[methodName]}`)

    if (typeof obj[methodName] === "function") {
      console.log(`📡 Method length (expected params): ${obj[methodName].length}`)
      console.log(`📡 Method toString:`, obj[methodName].toString().substring(0, 200) + "...")
    }

    console.log("📋 EXACT CALL BEING MADE:")
    console.log(`├─ ${obj.constructor.name}.${methodName}(${JSON.stringify(params)})`)
    console.log("🚨 === END METHOD CALL DEBUG ===")
  }
}
