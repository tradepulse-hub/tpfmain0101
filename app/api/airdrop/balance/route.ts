import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { airdropContractABI, AIRDROP_CONTRACT_ADDRESS, RPC_ENDPOINTS } from "@/lib/airdropContractABI"

export async function GET() {
  try {
    console.log(`Fetching contract balance from address: ${AIRDROP_CONTRACT_ADDRESS}`)

    // Tentar cada RPC até encontrar um que funcione
    let lastError = null

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        console.log(`Trying RPC endpoint: ${rpcUrl}`)

        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Verificar se o contrato existe
        const code = await provider.getCode(AIRDROP_CONTRACT_ADDRESS)
        if (code === "0x") {
          console.log(`Contract not found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
          continue // Tentar próximo RPC
        }

        console.log(`Contract found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)

        const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropContractABI, provider)

        const balance = await contract.contractBalance()
        const formattedBalance = ethers.formatUnits(balance, 18)

        console.log(`Contract balance: ${formattedBalance} TPF`)

        return NextResponse.json({
          success: true,
          balance: formattedBalance,
          rpcUsed: rpcUrl,
        })
      } catch (error) {
        console.error(`Error with RPC ${rpcUrl}:`, error)
        lastError = error
        // Continuar para o próximo RPC
      }
    }

    // Se chegamos aqui, nenhum RPC funcionou
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contract balance from any RPC endpoint",
        details: lastError instanceof Error ? lastError.message : "Unknown error",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error fetching airdrop contract balance:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch airdrop contract balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
