"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, BookOpen, BarChart2, Search, X } from "lucide-react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

export default function LearnPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [t, setT] = useState(getTranslations(language).learn || {})

  useEffect(() => {
    // Set initial language
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    setT(getTranslations(currentLang).learn || {})

    // Add listener for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setT(getTranslations(newLang).learn || {})
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    setShowSearch(false)
  }

  const handleBackClick = () => {
    if (activeSection) {
      setActiveSection(null)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "tokenomics":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">{language === "pt" ? "Tokenomics" : "Tokenomics"}</h2>
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-gray-300 mb-4">
                {language === "pt"
                  ? "Tokenomics refere-se à economia dos tokens criptográficos. Compreender a tokenomics de um projeto é essencial para avaliar seu valor e potencial de longo prazo."
                  : "Tokenomics refers to the economics of cryptocurrency tokens. Understanding a project's tokenomics is essential for evaluating its value and long-term potential."}
              </p>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <h3 className="text-white font-medium mb-1">
                    {language === "pt" ? "Oferta e Distribuição" : "Supply and Distribution"}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === "pt"
                      ? "A oferta total, circulante e máxima de tokens, bem como sua distribuição entre equipe, investidores e comunidade."
                      : "The total, circulating, and maximum supply of tokens, as well as their distribution among team, investors, and community."}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <h3 className="text-white font-medium mb-1">
                    {language === "pt" ? "Utilidade do Token" : "Token Utility"}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === "pt"
                      ? "Como o token é usado dentro do ecossistema e quais benefícios ele oferece aos detentores."
                      : "How the token is used within the ecosystem and what benefits it offers to holders."}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <h3 className="text-white font-medium mb-1">
                    {language === "pt" ? "Mecanismos de Valor" : "Value Mechanisms"}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === "pt"
                      ? "Queima de tokens, staking, governança e outros mecanismos que afetam o valor do token."
                      : "Token burning, staking, governance, and other mechanisms that affect the token's value."}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">
                {language === "pt" ? "Tokenomics do TPF" : "TPF Tokenomics"}
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>{language === "pt" ? "Oferta Total:" : "Total Supply:"}</span>
                  <span className="text-white">1.000.000.000 TPF</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === "pt" ? "Liquidez:" : "Liquidity:"}</span>
                  <span className="text-white">40%</span>
                </div>
                <div className="flex justify-between">
                  <span>Staking:</span>
                  <span className="text-white">25%</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === "pt" ? "Equipe:" : "Team:"}</span>
                  <span className="text-white">15%</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketing:</span>
                  <span className="text-white">10%</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === "pt" ? "Reserva:" : "Reserve:"}</span>
                  <span className="text-white">10%</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "glossary":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">
              {language === "pt" ? "Glossário Crypto" : "Crypto Glossary"}
            </h2>
            {searchQuery && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={language === "pt" ? "Buscar termos..." : "Search terms..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            )}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">A</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Airdrop</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Distribuição gratuita de tokens para carteiras específicas, geralmente como estratégia de marketing ou recompensa."
                        : "Free distribution of tokens to specific wallets, usually as a marketing strategy or reward."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Altcoin</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? 'Qualquer criptomoeda que não seja Bitcoin. O termo é uma abreviação de "alternative coin".'
                        : 'Any cryptocurrency that is not Bitcoin. The term is an abbreviation of "alternative coin".'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">APY (Annual Percentage Yield)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Taxa de retorno anual em um investimento, considerando o efeito dos juros compostos."
                        : "Annual rate of return on an investment, considering the effect of compound interest."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">ATH (All-Time High)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "O preço mais alto que uma criptomoeda já atingiu em toda a sua história."
                        : "The highest price a cryptocurrency has ever reached in its entire history."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">ATL (All-Time Low)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "O preço mais baixo que uma criptomoeda já atingiu em toda a sua história."
                        : "The lowest price a cryptocurrency has ever reached in its entire history."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">{language === "pt" ? "Arbitragem" : "Arbitrage"}</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Estratégia de comprar um ativo em um mercado e vendê-lo em outro para lucrar com a diferença de preço."
                        : "Strategy of buying an asset in one market and selling it in another to profit from the price difference."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">AMM (Automated Market Maker)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Protocolo que utiliza pools de liquidez e fórmulas matemáticas para precificar ativos, permitindo trocas descentralizadas."
                        : "Protocol that uses liquidity pools and mathematical formulas to price assets, enabling decentralized exchanges."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">API (Application Programming Interface)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Interface que permite que diferentes aplicações se comuniquem entre si, muito usada em exchanges e wallets."
                        : "Interface that allows different applications to communicate with each other, widely used in exchanges and wallets."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">B</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Blockchain</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Tecnologia de registro distribuído que mantém um registro crescente de transações em blocos vinculados."
                        : "Distributed ledger technology that maintains a growing record of transactions in linked blocks."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Bull Market</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Período em que os preços dos ativos estão subindo ou se espera que subam."
                        : "Period when asset prices are rising or expected to rise."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Bear Market</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Período em que os preços dos ativos estão caindo ou se espera que caiam."
                        : "Period when asset prices are falling or expected to fall."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Block Explorer</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Ferramenta online que permite visualizar informações sobre blocos, transações e endereços em uma blockchain."
                        : "Online tool that allows viewing information about blocks, transactions, and addresses on a blockchain."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Block Height</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Número de blocos na cadeia desde o bloco gênesis (primeiro bloco) até o bloco atual."
                        : "Number of blocks in the chain from the genesis block (first block) to the current block."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Block Reward</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Recompensa dada aos mineradores por validar e adicionar um novo bloco à blockchain."
                        : "Reward given to miners for validating and adding a new block to the blockchain."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Burning</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Processo de enviar tokens para um endereço inutilizável, removendo-os permanentemente de circulação."
                        : "Process of sending tokens to an unusable address, permanently removing them from circulation."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Bagholder</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Pessoa que mantém uma criptomoeda cujo valor caiu significativamente desde a compra."
                        : "Person who holds a cryptocurrency whose value has fallen significantly since purchase."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Bounty</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Recompensa oferecida por projetos para tarefas específicas, como encontrar bugs ou promover o projeto."
                        : "Reward offered by projects for specific tasks, such as finding bugs or promoting the project."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Bridge</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Protocolo que permite transferir ativos entre diferentes blockchains."
                        : "Protocol that allows transferring assets between different blockchains."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">C</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">{language === "pt" ? "Consenso" : "Consensus"}</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Mecanismo pelo qual uma rede blockchain concorda sobre o estado atual do blockchain."
                        : "Mechanism by which a blockchain network agrees on the current state of the blockchain."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Cold Wallet</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Carteira de criptomoedas que não está conectada à internet, oferecendo maior segurança."
                        : "Cryptocurrency wallet that is not connected to the internet, offering greater security."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">CEX (Centralized Exchange)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Plataforma de troca de criptomoedas operada por uma empresa centralizada que atua como intermediária."
                        : "Cryptocurrency exchange platform operated by a centralized company that acts as an intermediary."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Custodial</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Serviço onde uma terceira parte mantém controle sobre as chaves privadas dos usuários."
                        : "Service where a third party maintains control over users' private keys."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Cypherpunk</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Ativista que defende o uso de criptografia e tecnologias de privacidade para mudança social e política."
                        : "Activist who advocates the use of cryptography and privacy technologies for social and political change."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Coin</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Criptomoeda que opera em sua própria blockchain, diferente de tokens que operam em blockchains existentes."
                        : "Cryptocurrency that operates on its own blockchain, unlike tokens that operate on existing blockchains."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Collateral</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Ativos depositados como garantia para empréstimos em plataformas DeFi."
                        : "Assets deposited as collateral for loans on DeFi platforms."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">{language === "pt" ? "Criptografia" : "Cryptography"}</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Prática de proteger informações através de códigos para que apenas o destinatário pretendido possa lê-las."
                        : "Practice of securing information through codes so that only the intended recipient can read it."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Cross-chain</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Tecnologia que permite interoperabilidade entre diferentes blockchains."
                        : "Technology that enables interoperability between different blockchains."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">D</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">DAO (Decentralized Autonomous Organization)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Organização governada por contratos inteligentes e votação da comunidade, sem autoridade central."
                        : "Organization governed by smart contracts and community voting, without central authority."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">DApp (Decentralized Application)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Aplicação que roda em uma rede blockchain descentralizada, sem servidor central."
                        : "Application that runs on a decentralized blockchain network, without a central server."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">DeFi (Decentralized Finance)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Sistema financeiro construído em blockchain que elimina intermediários tradicionais."
                        : "Financial system built on blockchain that eliminates traditional intermediaries."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">DEX (Decentralized Exchange)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Exchange descentralizada que permite negociação peer-to-peer sem intermediários."
                        : "Decentralized exchange that allows peer-to-peer trading without intermediaries."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Diamond Hands</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Termo para investidores que mantêm suas posições mesmo durante quedas significativas de preço."
                        : "Term for investors who hold their positions even during significant price drops."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">DYOR (Do Your Own Research)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Conselho para que investidores façam sua própria pesquisa antes de investir."
                        : "Advice for investors to do their own research before investing."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Double Spending</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Problema onde a mesma moeda digital é gasta duas vezes, resolvido pela blockchain."
                        : "Problem where the same digital coin is spent twice, solved by blockchain."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">E</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">ERC-20</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Padrão técnico para tokens na blockchain Ethereum, definindo regras básicas de funcionamento."
                        : "Technical standard for tokens on the Ethereum blockchain, defining basic operating rules."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">ERC-721</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Padrão para tokens não-fungíveis (NFTs) na Ethereum, cada token é único."
                        : "Standard for non-fungible tokens (NFTs) on Ethereum, each token is unique."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Ethereum</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Plataforma blockchain que permite contratos inteligentes e aplicações descentralizadas."
                        : "Blockchain platform that enables smart contracts and decentralized applications."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Exchange</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Plataforma onde usuários podem comprar, vender e trocar criptomoedas."
                        : "Platform where users can buy, sell and trade cryptocurrencies."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">F</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">FOMO (Fear of Missing Out)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Medo de perder uma oportunidade de investimento, levando a decisões impulsivas."
                        : "Fear of missing an investment opportunity, leading to impulsive decisions."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">FUD (Fear, Uncertainty, Doubt)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Estratégia de espalhar informações negativas para influenciar o preço de um ativo."
                        : "Strategy of spreading negative information to influence an asset's price."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Fork</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Mudança no protocolo de uma blockchain, podendo ser soft (compatível) ou hard (incompatível)."
                        : "Change in a blockchain's protocol, can be soft (compatible) or hard (incompatible)."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Fiat</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Moeda tradicional emitida por governos, como dólar, euro ou real."
                        : "Traditional currency issued by governments, such as dollar, euro or real."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">G</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Gas</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Taxa paga para executar transações ou contratos inteligentes na rede Ethereum."
                        : "Fee paid to execute transactions or smart contracts on the Ethereum network."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Genesis Block</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "O primeiro bloco de uma blockchain, também conhecido como bloco zero."
                        : "The first block of a blockchain, also known as block zero."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Governance Token</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Token que dá direito de voto em decisões sobre o futuro de um protocolo."
                        : "Token that gives voting rights in decisions about a protocol's future."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">H</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Hash</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Função matemática que converte dados de qualquer tamanho em uma string de tamanho fixo."
                        : "Mathematical function that converts data of any size into a fixed-size string."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">HODL</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Estratégia de manter criptomoedas por longo prazo, independente da volatilidade."
                        : "Strategy of holding cryptocurrencies long-term, regardless of volatility."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Hot Wallet</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Carteira de criptomoedas conectada à internet, mais conveniente mas menos segura."
                        : "Cryptocurrency wallet connected to the internet, more convenient but less secure."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">I</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">ICO (Initial Coin Offering)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Método de arrecadação de fundos onde novos projetos vendem tokens para investidores."
                        : "Fundraising method where new projects sell tokens to investors."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Impermanent Loss</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Perda temporária que ocorre ao fornecer liquidez em pools quando os preços dos ativos mudam."
                        : "Temporary loss that occurs when providing liquidity in pools when asset prices change."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">L</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Layer 1</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Blockchain principal, como Bitcoin ou Ethereum, que processa transações diretamente."
                        : "Main blockchain, like Bitcoin or Ethereum, that processes transactions directly."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Layer 2</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Soluções construídas sobre blockchains principais para melhorar velocidade e reduzir custos."
                        : "Solutions built on top of main blockchains to improve speed and reduce costs."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Liquidity Pool</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Reserva de tokens bloqueados em contratos inteligentes para facilitar negociações."
                        : "Reserve of tokens locked in smart contracts to facilitate trading."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">M</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Market Cap</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Valor total de mercado de uma criptomoeda, calculado multiplicando preço por oferta circulante."
                        : "Total market value of a cryptocurrency, calculated by multiplying price by circulating supply."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Mining</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Processo de validar transações e adicionar novos blocos à blockchain usando poder computacional."
                        : "Process of validating transactions and adding new blocks to blockchain using computational power."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Mnemonic Phrase</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Sequência de 12-24 palavras usada para recuperar uma carteira de criptomoedas."
                        : "Sequence of 12-24 words used to recover a cryptocurrency wallet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">N</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">NFT (Non-Fungible Token)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Token único e indivisível que representa propriedade de um item digital específico."
                        : "Unique and indivisible token that represents ownership of a specific digital item."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Node</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Computador que participa da rede blockchain mantendo uma cópia do ledger."
                        : "Computer that participates in the blockchain network maintaining a copy of the ledger."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">P</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Private Key</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Chave secreta que permite acesso e controle sobre fundos em uma carteira de criptomoedas."
                        : "Secret key that allows access and control over funds in a cryptocurrency wallet."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Public Key</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Chave pública derivada da chave privada, usada para receber transações."
                        : "Public key derived from private key, used to receive transactions."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Proof of Work (PoW)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Mecanismo de consenso que requer poder computacional para validar transações."
                        : "Consensus mechanism that requires computational power to validate transactions."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Proof of Stake (PoS)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Mecanismo de consenso onde validadores são escolhidos baseado na quantidade de tokens que possuem."
                        : "Consensus mechanism where validators are chosen based on the amount of tokens they hold."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">S</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Smart Contract</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Programa autoexecutável que roda na blockchain e executa automaticamente quando condições são atendidas."
                        : "Self-executing program that runs on blockchain and executes automatically when conditions are met."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Staking</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Processo de bloquear tokens para apoiar operações da rede e ganhar recompensas."
                        : "Process of locking tokens to support network operations and earn rewards."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Satoshi</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Menor unidade do Bitcoin, equivalente a 0.00000001 BTC."
                        : "Smallest unit of Bitcoin, equivalent to 0.00000001 BTC."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">T</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Token</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Ativo digital criado em uma blockchain existente, diferente de uma coin que tem sua própria blockchain."
                        : "Digital asset created on an existing blockchain, different from a coin which has its own blockchain."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">TPS (Transactions Per Second)</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Métrica que mede quantas transações uma blockchain pode processar por segundo."
                        : "Metric that measures how many transactions a blockchain can process per second."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">W</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Wallet</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Software ou hardware que armazena chaves privadas e permite gerenciar criptomoedas."
                        : "Software or hardware that stores private keys and allows managing cryptocurrencies."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Whale</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Investidor que possui grandes quantidades de criptomoedas, capaz de influenciar o mercado."
                        : "Investor who holds large amounts of cryptocurrencies, capable of influencing the market."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-medium">Web3</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Nova versão da internet baseada em blockchain, descentralizada e controlada pelos usuários."
                        : "New version of the internet based on blockchain, decentralized and controlled by users."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Y</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Yield Farming</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Estratégia de maximizar retornos fornecendo liquidez ou fazendo staking em protocolos DeFi."
                        : "Strategy to maximize returns by providing liquidity or staking in DeFi protocols."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Z</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-400 font-medium">Zero-Knowledge Proof</h4>
                    <p className="text-gray-300 text-sm">
                      {language === "pt"
                        ? "Método criptográfico que permite provar conhecimento de informação sem revelá-la."
                        : "Cryptographic method that allows proving knowledge of information without revealing it."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-3 p-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{t.title || "Learn"}</h2>
              {!showSearch ? (
                <button onClick={() => setShowSearch(true)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                  <Search size={18} className="text-gray-300" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                  }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
                >
                  <X size={18} className="text-gray-300" />
                </button>
              )}
            </div>

            {showSearch && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={t.search || "Search content..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSectionClick("glossary")}
                    className="mt-2 w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
                  >
                    {t.searchInGlossary || "Search in Glossary"}
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <SectionCard
                title={t.tokenomics || "Tokenomics"}
                description={
                  t.tokenomicsDesc ||
                  "Understand token economics and how it affects the value and utility of crypto projects."
                }
                icon={<BarChart2 size={24} className="text-blue-400" />}
                onClick={() => handleSectionClick("tokenomics")}
              />
              <SectionCard
                title={t.glossary || "Crypto Glossary"}
                description={
                  t.glossaryDesc ||
                  "Complete guide to terms and concepts from the cryptocurrency world for beginners and experts."
                }
                icon={<BookOpen size={24} className="text-purple-400" />}
                onClick={() => handleSectionClick("glossary")}
              />
            </div>

            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <h3 className="text-base font-semibold text-white mb-1">{t.didYouKnow || "Did you know?"}</h3>
              <p className="text-gray-300 text-xs">
                {t.bitcoinPizza ||
                  "On May 22, 2010, Laszlo Hanyecz made the first Bitcoin purchase: two pizzas for 10,000 BTC. Today, that amount would be worth millions of dollars!"}
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pb-20 overflow-hidden">
      <BackgroundEffect />

      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={handleBackClick}
            className={`mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${
              !activeSection && "invisible"
            }`}
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-white">
            {activeSection
              ? activeSection === "trading-simulator"
                ? language === "pt"
                  ? "Simulador de Trading"
                  : "Trading Simulator"
                : activeSection === "tokenomics"
                  ? "Tokenomics"
                  : language === "pt"
                    ? "Glossário Crypto"
                    : "Crypto Glossary"
              : t.title || "Learn"}
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md pt-16"
      >
        {renderContent()}
      </motion.div>

      <BottomNav activeTab="learn" />
    </main>
  )
}

const SectionCard = ({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-800 p-3 rounded-lg cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-1">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}
