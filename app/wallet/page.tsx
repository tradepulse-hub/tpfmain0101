"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { useBalance } from "wagmi"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { balanceSyncService } from "@/services/balance-sync-service"

export default function WalletPage() {
  const { address: walletAddress, isConnected } = useAccount()
  const [tpfBalance, setTpfBalance] = useState<string | null>(null)
  const [isLoadingTpfBalance, setIsLoadingTpfBalance] = useState(true)

  const { data: ethBalanceData, isLoading: isLoadingEthBalance } = useBalance({
    address: walletAddress,
  })

  useEffect(() => {
    const fetchTpfBalance = async () => {
      setIsLoadingTpfBalance(true)
      try {
        // Simulação de busca do saldo TPF (substitua pela sua lógica real)
        await new Promise((resolve) => setTimeout(resolve, 1500)) // Simula um delay de 1.5 segundos
        const balance = (Math.random() * 1000).toFixed(2) // Saldo aleatório para simulação
        setTpfBalance(balance.replace(".", ","))
      } catch (error) {
        console.error("Erro ao buscar saldo TPF:", error)
        setTpfBalance(null)
      } finally {
        setIsLoadingTpfBalance(false)
      }
    }

    if (walletAddress) {
      fetchTpfBalance()
    } else {
      setTpfBalance(null)
      setIsLoadingTpfBalance(false)
    }
  }, [walletAddress])

  useEffect(() => {
    const syncBalance = () => {
      if (walletAddress && tpfBalance) {
        const balance = Number.parseFloat(tpfBalance.replace(/,/g, ""))
        balanceSyncService.updateTPFBalance(walletAddress, balance)
      }
    }

    syncBalance()
  }, [walletAddress, tpfBalance])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Carteira</h1>

      {!isConnected ? (
        <p>Conecte sua carteira para visualizar seus saldos.</p>
      ) : (
        <Tabs defaultValue="balances" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="balances">Saldos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>
          <TabsContent value="balances">
            <Card>
              <CardHeader>
                <CardTitle>Saldo ETH</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEthBalance ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <p>{ethBalanceData ? formatEther(ethBalanceData.value) : "0"} ETH</p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Saldo TPF</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTpfBalance ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <p>{tpfBalance !== null ? tpfBalance + " TPF" : "Erro ao carregar"}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transactions">
            <p>Em breve: Histórico de transações.</p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
