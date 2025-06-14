"use client"

import { useState, useEffect } from "react"
import { holdstationHistoryService } from "@/services/holdstation-history-service"
import type { Transaction } from "@/services/types"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@nextui-org/react"
import { useWallet } from "@txnlab/use-wallet"

export const TransactionHistoryModal = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { activeAccount } = useWallet()
  const walletAddress = activeAccount?.address

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTransactions()
    }
  }, [isOpen, walletAddress])

  const loadTransactions = async () => {
    if (!walletAddress) return

    setIsLoading(true)
    try {
      const realTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 10)
      setTransactions(realTransactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onPress={onOpen} color="primary">
        Transaction History
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Transaction History</ModalHeader>
              <ModalBody>
                {isLoading ? (
                  <div className="flex justify-center">
                    <Spinner size="lg" />
                  </div>
                ) : transactions.length > 0 ? (
                  <Table aria-label="Transaction History">
                    <TableHeader>
                      <TableColumn>Date</TableColumn>
                      <TableColumn>Description</TableColumn>
                      <TableColumn>Amount</TableColumn>
                      <TableColumn>Status</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center">No transactions found.</div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
