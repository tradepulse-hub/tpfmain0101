import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./dark-theme.css"
import { MiniKitProvider } from "@/components/minikit-provider"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TPulseFi - Worldcoin Mini App",
  description: "TPulseFi token ecosystem on Worldchain",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>
          <MiniKitProvider>{children}</MiniKitProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
