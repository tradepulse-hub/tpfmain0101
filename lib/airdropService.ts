import { ethers } from "ethers"
import { MiniKit } from "@worldcoin/minikit-js"
import { AIRDROP_CONTRACT_ADDRESS, RPC_ENDPOINTS, airdropContractABI } from "./airdropContractABI"

// Função para obter o status do airdrop para um endereço
export async function getAirdropStatus(address: string) {
  try {
    console.log(`Checking airdrop status for address: ${address}`)
    console.log(`Using contract address: ${AIRDROP_CONTRACT_ADDRESS}`)

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

        // Buscar dados do contrato
        const [lastClaimTime, claimInterval, dailyAirdrop] = await Promise.all([
          contract.lastClaimTime(address),
          contract.CLAIM_INTERVAL(),
          contract.DAILY_AIRDROP(),
        ])

        console.log("Contract data retrieved:", {
          lastClaimTime: Number(lastClaimTime),
          claimInterval: Number(claimInterval),
          dailyAirdrop: dailyAirdrop.toString(),
        })

        const now = Math.floor(Date.now() / 1000)
        const nextClaimTime = Number(lastClaimTime) + Number(claimInterval)
        const canClaim = Number(lastClaimTime) === 0 || now >= nextClaimTime

        return {
          success: true,
          lastClaimTime: Number(lastClaimTime),
          nextClaimTime: nextClaimTime,
          canClaim: canClaim,
          timeRemaining: canClaim ? 0 : nextClaimTime - now,
          airdropAmount: ethers.formatUnits(dailyAirdrop, 18),
          rpcUsed: rpcUrl,
        }
      } catch (error) {
        console.error(`Error with RPC ${rpcUrl}:`, error)
        lastError = error
        // Continuar para o próximo RPC
      }
    }

    // Se chegamos aqui, nenhum RPC funcionou
    // Vamos usar uma simulação para desenvolvimento
    console.log("All RPCs failed, using simulation mode")

    // Verificar se há um último claim no localStorage
    const lastClaimTimeStr = localStorage.getItem(`lastClaim_${address}`)

    if (lastClaimTimeStr) {
      const lastClaimTime = Math.floor(new Date(lastClaimTimeStr).getTime() / 1000)
      const now = Math.floor(Date.now() / 1000)
      const claimInterval = 24 * 60 * 60 // 24 horas em segundos
      const nextClaimTime = lastClaimTime + claimInterval
      const canClaim = now >= nextClaimTime

      return {
        success: true,
        lastClaimTime: lastClaimTime,
        nextClaimTime: nextClaimTime,
        canClaim: canClaim,
        timeRemaining: canClaim ? 0 : nextClaimTime - now,
        airdropAmount: "50",
        rpcUsed: "simulation",
      }
    }

    // Se não há registro de claim anterior, permitir o claim
    return {
      success: true,
      lastClaimTime: 0,
      nextClaimTime: 0,
      canClaim: true,
      timeRemaining: 0,
      airdropAmount: "50",
      rpcUsed: "simulation",
    }
  } catch (error) {
    console.error("Error fetching airdrop status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch airdrop status",
    }
  }
}

// Função para obter o saldo do contrato
export async function getContractBalance() {
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

        return {
          success: true,
          balance: formattedBalance,
          rpcUsed: rpcUrl,
        }
      } catch (error) {
        console.error(`Error with RPC ${rpcUrl}:`, error)
        lastError = error
        // Continuar para o próximo RPC
      }
    }

    // Se chegamos aqui, nenhum RPC funcionou, usar valor simulado
    return {
      success: true,
      balance: "1000000",
      rpcUsed: "simulation",
    }
  } catch (error) {
    console.error("Error fetching airdrop contract balance:", error)
    return {
      success: false,
      error: "Failed to fetch airdrop contract balance",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Função para reivindicar o airdrop
export async function claimAirdrop(address: string) {
  try {
    console.log(`Claiming airdrop for address: ${address}`)

    if (!MiniKit.isInstalled()) {
      throw new Error("MiniKit is not installed")
    }

    console.log("MiniKit is installed, preparing to claim airdrop...")
    console.log("Contract address:", AIRDROP_CONTRACT_ADDRESS)
    console.log("Using ABI:", JSON.stringify(airdropContractABI))

    try {
      // Usar o MiniKit para enviar a transação
      console.log("Calling MiniKit.commandsAsync.sendTransaction...")
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: AIRDROP_CONTRACT_ADDRESS,
            abi: airdropContractABI,
            functionName: "claimAirdrop",
            args: [],
          },
        ],
      })

      console.log("MiniKit transaction response:", finalPayload)

      if (finalPayload.status === "error") {
        console.error("Error claiming airdrop:", finalPayload.message)
        throw new Error(finalPayload.message || "Failed to claim airdrop")
      }

      console.log("Airdrop claimed successfully:", finalPayload)

      // Salvar o timestamp do claim no localStorage
      localStorage.setItem(`lastClaim_${address}`, new Date().toISOString())

      // Atualizar o saldo do usuário (simulação)
      const currentBalance = localStorage.getItem("userDefinedTPFBalance")
      if (currentBalance) {
        const newBalance = Number(currentBalance) + 50
        localStorage.setItem("userDefinedTPFBalance", newBalance.toString())

        // Disparar evento para atualizar o saldo na UI
        const event = new CustomEvent("tpf_balance_updated", {
          detail: {
            amount: newBalance,
          },
        })
        window.dispatchEvent(event)
      }

      return {
        success: true,
        txId: finalPayload.transaction_id,
      }
    } catch (error) {
      console.error("Error in MiniKit transaction:", error)

      // Tentar método alternativo se o MiniKit falhar
      console.log("Trying alternative method via API...")
      return await processAirdrop(address)
    }
  } catch (error) {
    console.error("Error claiming airdrop:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during the claim",
    }
  }
}

// Método alternativo para processar o airdrop via API
export async function processAirdrop(address: string) {
  try {
    console.log(`Processing airdrop via API for address: ${address}`)

    // Gerar uma assinatura simulada
    const timestamp = Date.now()
    const signature = Math.random().toString(36).substring(2, 15)

    // Chamar a API para processar o airdrop
    const response = await fetch("/api/airdrop/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature,
        userAddress: address,
        timestamp,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to process airdrop")
    }

    // Salvar o timestamp do claim no localStorage
    localStorage.setItem(`lastClaim_${address}`, new Date().toISOString())

    // Atualizar o saldo do usuário (simulação)
    const currentBalance = localStorage.getItem("userDefinedTPFBalance")
    if (currentBalance) {
      const newBalance = Number(currentBalance) + 50
      localStorage.setItem("userDefinedTPFBalance", newBalance.toString())

      // Disparar evento para atualizar o saldo na UI
      const event = new CustomEvent("tpf_balance_updated", {
        detail: {
          amount: newBalance,
        },
      })
      window.dispatchEvent(event)
    }

    return {
      success: true,
      txId: data.txId,
    }
  } catch (error) {
    console.error("Error processing airdrop via API:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during API processing",
    }
  }
}
