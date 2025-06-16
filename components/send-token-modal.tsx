"use client"

import type React from "react"
import { useState } from "react"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
}

const SendTokenModal: React.FC<SendTokenModalProps> = ({ isOpen, onClose }) => {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("ETH") // Default to ETH
  const [statusMessage, setStatusMessage] = useState("")
  const [warningMessage, setWarningMessage] = useState("")

  const handleSendToken = () => {
    // Simulate sending token logic
    if (!recipientAddress || !amount) {
      setWarningMessage("Please enter recipient address and amount.")
      setStatusMessage("")
      return
    }

    try {
      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setWarningMessage("Please enter a valid amount.")
        setStatusMessage("")
        return
      }

      // Simulate successful transaction
      setStatusMessage(`Successfully sent ${amount} ${selectedToken} to ${recipientAddress}`)
      setWarningMessage("")

      // Clear form
      setRecipientAddress("")
      setAmount("")

      // Optionally close the modal after a delay
      setTimeout(() => {
        onClose()
        setStatusMessage("")
      }, 2000)
    } catch (error) {
      setWarningMessage("An error occurred while sending tokens.")
      setStatusMessage("")
    }
  }

  const tokenOptions = ["ETH", "BTC", "USDT"]

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-96">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-lg font-semibold">Send Token</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3">
              <form className="space-y-3">
                <div>
                  <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    id="recipientAddress"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1.5"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1.5"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                    Token
                  </label>
                  <div className="relative">
                    <select
                      id="token"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1.5 appearance-none"
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                    >
                      {tokenOptions.map((token) => (
                        <option key={token} value={token}>
                          {token}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleSendToken}
                  >
                    Send
                  </button>
                </div>
              </form>

              {statusMessage && (
                <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-md">
                  {statusMessage}
                </div>
              )}

              {warningMessage && (
                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {warningMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SendTokenModal
