"use client"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
} from "@nextui-org/react"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-hot-toast"
import { QRCode } from "react-qrcode-logo"

import { useWallet } from "@/liveblocks.config"
import { shortenAddress } from "@/lib/utils"
import type { Chain } from "@/types"

interface ReceiveTokenModalProps {
  address: string | undefined
  chains: Chain[]
}

export function ReceiveTokenModal({ address, chains }: ReceiveTokenModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { t } = useTranslation()
  const wallet = useWallet()
  const [selectedChain, setSelectedChain] = useState(chains[0])

  const handleCopyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast.success(t("receive_token.address_copied"))
  }, [address, t])

  return (
    <>
      <Button color="primary" variant="shadow" onPress={onOpen}>
        {t("receive_token.receive_tokens")}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
        size="sm"
        className="dark:bg-zinc-800"
      >
        <ModalContent className="dark:bg-zinc-800">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 mb-3">{t("receive_token.receive_tokens")}</ModalHeader>
              <ModalBody className="p-3">
                <div className="flex flex-col items-center space-y-3">
                  <QRCode
                    value={address || "0x"}
                    size={48}
                    level="H"
                    ecLevel="H"
                    qrStyle="dots"
                    eyeRadius={5}
                    logoImage="/ethereum-logo.png"
                    logoWidth={30}
                    logoHeight={30}
                    logoOpacity={1}
                  />
                  <div className="flex items-center justify-center">
                    <Tooltip content={t("receive_token.copy_address")}>
                      <Button size="sm" variant="light" className="py-2 px-3" onClick={handleCopyAddress}>
                        {shortenAddress(address)}
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="mb-1 font-semibold">{t("receive_token.instructions_title")}</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li className="p-2">{t("receive_token.instructions_1")}</li>
                    <li className="p-2">{t("receive_token.instructions_2")}</li>
                    <li className="p-2">{t("receive_token.instructions_3")}</li>
                  </ol>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">{t("receive_token.supported_networks")}</h4>
                  <div className="p-2">
                    {chains.map((chain) => (
                      <div key={chain.id}>{chain.name}</div>
                    ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  {t("common.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
