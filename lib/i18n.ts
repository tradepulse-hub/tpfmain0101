"use client"

import { useState, useEffect } from "react"

// Tipos para internacionalização
export type Language = "en" | "pt"

export interface AirdropTranslations {
  title?: string
  subtitle?: string
  contractBalance?: string
  dailyAirdrop?: string
  nextClaimIn?: string
  claimButton?: string
  processing?: string
  tokensClaimedSuccess?: string
  availableForAirdrop?: string
}

export interface HistoryTranslations {
  title?: string
  all?: string
  loading?: string
  loadMore?: string
  noTransactions?: string
  showAllTransactions?: string
  received?: string
  sent?: string
  from?: string
  to?: string
  block?: string
  txHash?: string
  today?: string
  yesterday?: string
}

export interface NavTranslations {
  home?: string
  wallet?: string
  learn?: string
  profile?: string
  news?: string
  agenda?: string
  winners?: string
  games?: string
  storm?: string
  about?: string
  finances?: string
  partnerships?: string
  membership?: string
  menu?: string
  close?: string
}

export interface GamesTranslations {
  title?: string
  subtitle?: string
  allGames?: string
  action?: string
  adventure?: string
  strategy?: string
  puzzle?: string
  rpg?: string
  comingSoon?: string
  enterNow?: string
  moreGames?: string
  featuredGame?: string
  back?: string
  start?: string
  score?: string
  round?: string
  lives?: string
  shots?: string
  gameOver?: string
  playAgain?: string
  loading?: string
  developed?: string
}

export interface WalletTranslations {
  title?: string
  balance?: string
  send?: string
  receive?: string
  swap?: string
  otherTokens?: string
  errorMessage?: string
  address?: string
  assets?: string
  activity?: string
  copyAddress?: string
  addressCopied?: string
  refreshBalances?: string
  balancesUpdated?: string
  errorUpdatingBalances?: string
}

export interface SwapTranslations {
  title?: string
  subtitle?: string
  from?: string
  to?: string
  amount?: string
  estimatedOutput?: string
  slippage?: string
  slippageTooltip?: string
  swapButton?: string
  processing?: string
  success?: string
  error?: string
  insufficientBalance?: string
  selectToken?: string
  enterAmount?: string
  gettingQuote?: string
  noQuoteAvailable?: string
  swapTokens?: string
  maxSlippage?: string
  priceImpact?: string
  minimumReceived?: string
  networkFee?: string
  route?: string
}

export interface WinnersTranslations {
  title?: string
  subtitle?: string
  noWinners?: string
  noWinnersDesc?: string
}

export interface AgendaTranslations {
  title?: string
  subtitle?: string
  today?: string
  event?: string
  noEvents?: string
  howToParticipate?: string
  incentivePeriod?: string
  eventsAndActivities?: string
  online?: string
  participants?: string
  days?: string[]
  months?: string[]
  eventTypes?: {
    airdrop?: string
    community?: string
    competition?: string
    education?: string
  }
  events?: {
    topHoldersIncentive?: {
      title?: string
      description?: string
      howToParticipate?: string[]
    }
  }
}

export interface FurnaceTranslations {
  title?: string
  subtitle?: string
  totalBurned?: string
  amountToBurn?: string
  startBurn?: string
  openFurnace?: string
  burning?: string
  burnCompleted?: string
  instructions?: string
  furnaceInfo?: string
  deflation?: string
  lastTransaction?: string
}

export interface LearnTranslations {
  title?: string
  search?: string
  searchTerms?: string
  searchInGlossary?: string
  didYouKnow?: string
  bitcoinPizza?: string
  tokenomics?: string
  tokenomicsDesc?: string
  glossary?: string
  glossaryDesc?: string
  glossaryTitle?: string
  tokenomicsTitle?: string
  tokenomicsIntro?: string
  supplyDistribution?: string
  supplyDistributionDesc?: string
  tokenUtility?: string
  tokenUtilityDesc?: string
  valueMechanisms?: string
  valueMechanismsDesc?: string
  tpfTokenomics?: string
  totalSupply?: string
  liquidity?: string
  staking?: string
  team?: string
  marketing?: string
  reserve?: string
  tradingSimulator?: string
}

export interface AboutTranslations {
  title?: string
  subtitle?: string
  about?: string
  roadmap?: string
  tokenomics?: string
  whyChoose?: string
  airdrops?: string
  community?: string
  utility?: string
  longTerm?: string
  growthStrategy?: string
  marketing?: string
  incentives?: string
  governance?: string
  phase1?: string
  phase1Completed?: string
  phase2?: string
  phase2Development?: string
  phase3?: string
  phase3Future?: string
  tokenLaunch?: string
  websiteDocs?: string
  communityGrowth?: string
  miniApp?: string
  airdropCampaigns?: string
  fiGames?: string
  fiStaking?: string
  pulseGame?: string
  fiPay?: string
  enhancedSecurity?: string
  exchangeListings?: string
  ecosystem?: string
  partnerships?: string
  mobileApp?: string
  tokenDetails?: string
  holderBenefits?: string
  buyTPF?: string
}

export interface SendTokenTranslations {
  title?: string
  subtitle?: string
  address?: string
  amount?: string
  selectToken?: string
  send?: string
  processing?: string
  addressRequired?: string
  invalidAmount?: string
  error?: string
  transactionSuccess?: string
  transactionFailed?: string
  sentTo?: string
  viewTx?: string
  minikitNotInstalled?: string
  tokenNotSupported?: string
  warning?: string
  warningWorldchain?: string
  hideWarning?: string
  transactionPending?: string
}

export interface ConnectButtonTranslations {
  connect?: string
  connecting?: string
  connected?: string
  installMiniKit?: string
  errorConnecting?: string
}

export interface StormTranslations {
  title?: string
  subtitle?: string
  placeholder?: string
  publish?: string
  connectWallet?: string
  wordPublished?: string
  enterWord?: string
  publishing?: string
}

export interface ProfileTranslations {
  inviteBanner?: string
  shareButton?: string
  profile?: string
  logOut?: string
  shareWithFriends?: string
  followUs?: string
  notConnected?: string
}

export interface DailyCheckInTranslations {
  title?: string
  subtitle?: string
  checkInButton?: string
  alreadyCheckedIn?: string
  points?: string
  totalPoints?: string
  streak?: string
  days?: string
  checkInSuccess?: string
  history?: string
  showHistory?: string
  hideHistory?: string
  noHistory?: string
  today?: string
  yesterday?: string
  daysAgo?: string
  consecutiveDays?: string
  nextCheckIn?: string
  hours?: string
  minutes?: string
  seconds?: string
  availableNow?: string
}

export interface FinancesTranslations {
  title?: string
  subtitle?: string
  transparencyMessage?: string
  incentivesReceived?: string
  transactionFees?: string
  tradingRevenue?: string
  projectExpenses?: string
  lastUpdated?: string
  overview?: string
  revenue?: string
  expenses?: string
  netBalance?: string
  financialChart?: string
  revenueBreakdown?: string
  expenseBreakdown?: string
  noData?: string
  totalRevenue?: string
  totalExpenses?: string
}

export interface PartnershipsTranslations {
  title?: string
  subtitle?: string
  ourPartners?: string
  holdstationTitle?: string
  holdstationDescription?: string
  visitApp?: string
  poweredBy?: string
  swapIntegration?: string
  swapDescription?: string
  morePartnerships?: string
  comingSoon?: string
}

export interface LevelTranslations {
  title?: string
  multiplier?: string
  progress?: string
  toNextLevel?: string
  xpSources?: string
  dailyCheckIn?: string
  checkInXP?: string
  tpfHolding?: string
  currentBalance?: string
  totalXP?: string
  levelBenefits?: string
  eventRewards?: string
  level?: string
  viewDetails?: string
}

export interface EventsTranslations {
  topHoldersEvent?: {
    title?: string
    description?: string
    remaining?: string
  }
  snakeTournament?: {
    registrationTitle?: string
    registrationDescription?: string
    tournamentTitle?: string
    tournamentDescription?: string
    instructions?: string
    rules?: {
      rule1?: string
      rule2?: string
      rule3?: string
      rule4?: string
      rule5?: string
    }
    registrationAddress?: string
    copyAddress?: string
    addressCopied?: string
    email?: string
    remaining?: string
    phase?: string
    registration?: string
    tournament?: string
  }
}

export interface MembershipTranslations {
  title?: string
  subtitle?: string
  readyQuestion?: string
  whatWeOffer?: string
  benefitDescription?: string
  benefitNote?: string
  price?: string
  priceForever?: string
  priceExplanation?: string
  becomeButton?: string
  processing?: string
  paymentInfo?: string
  destinationWallet?: string
  afterPayment?: string
  contactSupport?: string
  tip?: string
  tipDescription?: string
}

export interface Translations {
  airdrop?: AirdropTranslations
  history?: HistoryTranslations
  nav?: NavTranslations
  games?: GamesTranslations
  wallet?: WalletTranslations
  swap?: SwapTranslations
  winners?: WinnersTranslations
  agenda?: AgendaTranslations
  furnace?: FurnaceTranslations
  learn?: LearnTranslations
  about?: AboutTranslations
  sendToken?: SendTokenTranslations
  connectButton?: ConnectButtonTranslations
  storm?: StormTranslations
  profile?: ProfileTranslations
  dailyCheckIn?: DailyCheckInTranslations
  finances?: FinancesTranslations
  partnerships?: PartnershipsTranslations
  level?: LevelTranslations
  events?: EventsTranslations
  membership?: MembershipTranslations
}

// Função para obter o idioma atual do navegador ou o padrão (inglês)
export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") return "en"

  // Verificar se há um idioma salvo no localStorage
  const savedLanguage = localStorage.getItem("tpf_language")
  if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
    return savedLanguage as Language
  }

  // Se não houver idioma salvo, usar inglês como padrão
  return "en"
}

// Função para definir o idioma atual
export function setCurrentLanguage(lang: Language): void {
  if (typeof window === "undefined") return

  localStorage.setItem("tpf_language", lang)

  // Disparar um evento para notificar componentes sobre a mudança de idioma
  const event = new Event("languageChange")
  window.dispatchEvent(event)
}

// Função para obter as traduções para um idioma específico
export function getTranslations(lang: Language): Translations {
  switch (lang) {
    case "pt":
      return {
        airdrop: {
          title: "Airdrop",
          subtitle: "Receba seus tokens TPF diários",
          contractBalance: "Saldo do contrato:",
          dailyAirdrop: "Airdrop diário:",
          nextClaimIn: "Próximo claim em:",
          claimButton: "Resgate o seu TPF",
          processing: "Processando...",
          tokensClaimedSuccess: "Tokens reivindicados com sucesso!",
          availableForAirdrop: "Disponível para Airdrop:",
        },
        history: {
          title: "Histórico de Transações",
          all: "Todos",
          loading: "Carregando...",
          loadMore: "Carregar mais",
          noTransactions: "Nenhuma transação encontrada",
          showAllTransactions: "Mostrar todas as transações",
          received: "Recebido",
          sent: "Enviado",
          from: "De",
          to: "Para",
          block: "Bloco",
          txHash: "Hash da transação",
          today: "Hoje",
          yesterday: "Ontem",
        },
        nav: {
          home: "Início",
          wallet: "Carteira",
          learn: "Aprender",
          profile: "Perfil",
          news: "Notícias",
          agenda: "Agenda",
          winners: "Vencedores",
          games: "Jogos",
          storm: "Storm",
          about: "Sobre",
          finances: "Finanças",
          partnerships: "Parcerias",
          membership: "Membership",
          menu: "Menu",
          close: "Fechar",
        },
        games: {
          title: "FiGames",
          subtitle: "Jogue e ganhe TPF",
          allGames: "Todos",
          action: "Ação",
          adventure: "Aventura",
          strategy: "Estratégia",
          puzzle: "Puzzle",
          rpg: "RPG",
          comingSoon: "Em Breve",
          enterNow: "Entrar Agora",
          moreGames: "Mais jogos em breve",
          featuredGame: "Destaque da Semana",
          back: "Voltar",
          start: "Iniciar Jogo",
          score: "Pontuação",
          round: "Rodada",
          lives: "Vidas",
          shots: "Tiros",
          gameOver: "Fim de Jogo",
          playAgain: "Jogar Novamente",
          loading: "Carregando",
          developed: "Desenvolvido por TPulseFi",
        },
        wallet: {
          title: "Carteira",
          balance: "Saldo TPF",
          send: "Enviar",
          receive: "Receber",
          swap: "Trocar",
          otherTokens: "Outros Tokens",
          errorMessage: "Não foi possível obter o saldo real. Tente definir manualmente.",
          address: "Endereço",
          assets: "Assets",
          activity: "Atividade",
          copyAddress: "Copiar endereço",
          addressCopied: "Endereço copiado!",
          refreshBalances: "Atualizar saldos",
          balancesUpdated: "Saldos atualizados!",
          errorUpdatingBalances: "Erro ao atualizar saldos",
        },
        swap: {
          title: "Trocar Tokens",
          subtitle: "Troque tokens de forma rápida e segura",
          from: "De",
          to: "Para",
          amount: "Quantidade",
          estimatedOutput: "Saída estimada",
          slippage: "Slippage",
          slippageTooltip: "Tolerância máxima de variação de preço",
          swapButton: "Trocar",
          processing: "Processando...",
          success: "Troca realizada com sucesso!",
          error: "Erro ao realizar a troca",
          insufficientBalance: "Saldo insuficiente",
          selectToken: "Selecionar token",
          enterAmount: "Digite a quantidade",
          gettingQuote: "Obtendo cotação...",
          noQuoteAvailable: "Cotação não disponível",
          swapTokens: "Inverter tokens",
          maxSlippage: "Slippage máximo",
          priceImpact: "Impacto no preço",
          minimumReceived: "Mínimo recebido",
          networkFee: "Taxa de rede",
          route: "Rota",
        },
        winners: {
          title: "Vencedores",
          subtitle: "Participantes premiados nos nossos eventos",
          noWinners: "Nenhum vencedor ainda",
          noWinnersDesc:
            "Os vencedores dos nossos eventos serão exibidos aqui. Fique atento aos próximos eventos para participar!",
        },
        agenda: {
          title: "Agenda",
          subtitle: "Eventos e atividades da comunidade",
          today: "Hoje",
          event: "Evento",
          noEvents: "Nenhum evento para esta data",
          howToParticipate: "Como participar:",
          incentivePeriod: "Período de Incentivo",
          eventsAndActivities: "Eventos e atividades da comunidade",
          online: "Online",
          participants: "participantes",
          days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
          months: [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ],
          eventTypes: {
            airdrop: "Airdrop",
            community: "Comunidade",
            competition: "Competição",
            education: "Educação",
          },
          events: {
            topHoldersIncentive: {
              title: "10% de Incentivo para os Top 10 Holders de TPF",
              description:
                "Ganhe 10% de tokens bônus se você estiver entre os 10 maiores holders de TPF durante o período do evento. Exemplo: 10M TPF = 1M tokens bônus",
              howToParticipate: [
                "Compre e mantenha tokens TPF",
                "Alcance uma posição entre os 10 maiores holders",
                "Mantenha a posição até 9 de Junho",
              ],
            },
          },
        },
        furnace: {
          title: "Fornalha",
          subtitle: "Queime tokens TPF e contribua para a substabilidade do token",
          totalBurned: "Total queimado",
          amountToBurn: "Quantidade de TPF para queimar",
          startBurn: "Iniciar Queima",
          openFurnace: "Abrir a Fornalha",
          burning: "Queimando...",
          burnCompleted: "Queima Concluída!",
          instructions: "Clique no botão para abrir a fornalha",
          furnaceInfo: "Informações sobre a Fornalha",
          deflation:
            "Deflação: Cada token queimado é enviado para uma carteira morta (0x000...dEaD) e removido permanentemente da circulação.",
          lastTransaction: "Última Transação",
        },
        learn: {
          title: "Aprenda",
          search: "Buscar conteúdo...",
          searchTerms: "Buscar termos...",
          searchInGlossary: "Buscar no Glossário",
          didYouKnow: "Você sabia?",
          bitcoinPizza:
            "Em 22 de maio de 2010, Laszlo Hanyecz fez a primeira compra com Bitcoin: duas pizzas por 10.000 BTC. Hoje, esse valor equivaleria a milhões de dólares!",
          tokenomics: "Tokenomics",
          tokenomicsDesc: "Entenda a economia dos tokens e como ela afeta o valor e a utilidade dos projetos crypto.",
          glossary: "Glossário Crypto",
          glossaryDesc: "Guia completo de termos e conceitos do mundo das criptomoedas para iniciantes e experts.",
          glossaryTitle: "Glossário Crypto",
          tokenomicsTitle: "Tokenomics",
          tokenomicsIntro:
            "Tokenomics refere-se à economia dos tokens criptográficos. Compreender a tokenomics de um projeto é essencial para avaliar seu valor e potencial de longo prazo.",
          supplyDistribution: "Oferta e Distribuição",
          supplyDistributionDesc:
            "A oferta total, circulante e máxima de tokens, bem como sua distribuição entre equipe, investidores e comunidade.",
          tokenUtility: "Utilidade do Token",
          tokenUtilityDesc: "Como o token é usado dentro do ecossistema e quais benefícios ele oferece aos detentores.",
          valueMechanisms: "Mecanismos de Valor",
          valueMechanismsDesc: "Queima de tokens, staking, governança e outros mecanismos que afetam o valor do token.",
          tpfTokenomics: "Tokenomics do TPF",
          totalSupply: "Oferta Total:",
          liquidity: "Liquidez:",
          staking: "Staking:",
          team: "Equipe:",
          marketing: "Marketing:",
          reserve: "Reserva:",
          tradingSimulator: "Simulador de Trading",
        },
        about: {
          title: "Sobre Nós",
          subtitle: "Conheça o projeto TPulseFi",
          about: "Sobre",
          roadmap: "Roadmap",
          tokenomics: "Tokenomics",
          whyChoose: "Por que escolher TPulseFi?",
          airdrops: "Airdrops Diários",
          community: "Comunidade Ativa",
          utility: "Utilidade",
          longTerm: "Visão de Longo Prazo",
          growthStrategy: "Estratégia de Crescimento",
          marketing: "Marketing",
          incentives: "Incentivos",
          governance: "Governança",
          phase1: "Fase 1",
          phase1Completed: "Concluída",
          phase2: "Fase 2",
          phase2Development: "Em Desenvolvimento",
          phase3: "Fase 3",
          phase3Future: "Objetivos Futuros",
          tokenLaunch: "Lançamento do Token",
          websiteDocs: "Website e Documentação",
          communityGrowth: "Crescimento da Comunidade",
          miniApp: "Mini-App (Worldcoin AppStore)",
          airdropCampaigns: "Campanhas de Airdrop",
          fiGames: "Fi Games",
          fiStaking: "FiStaking (12% APY)",
          pulseGame: "Pulse Game",
          fiPay: "FiPay",
          enhancedSecurity: "Segurança Aprimorada",
          exchangeListings: "Listagens em Exchanges",
          ecosystem: "Expansão do Ecossistema TPulseFi",
          partnerships: "Parcerias",
          mobileApp: "App Mobile",
          tokenDetails: "Detalhes do Token",
          holderBenefits: "Vantagens para Holders",
          buyTPF: "Comprar TPF",
        },
        sendToken: {
          title: "Enviar Tokens",
          subtitle: "Envie tokens para outro endereço",
          address: "Endereço",
          amount: "Quantidade",
          selectToken: "Selecione o Token",
          send: "Enviar",
          processing: "Processando...",
          addressRequired: "Endereço é obrigatório",
          invalidAmount: "Quantidade inválida",
          error: "Erro ao enviar tokens. Tente novamente.",
          transactionSuccess: "Transação enviada com sucesso!",
          transactionFailed: "Falha na transação",
          sentTo: "enviado para",
          viewTx: "Ver TX",
          minikitNotInstalled: "MiniKit não está instalado",
          tokenNotSupported: "Token não suportado",
          warning: "Por favor, verifique o endereço do destinatário antes de enviar tokens.",
          warningWorldchain:
            "Não envie para carteiras que não suportem Worldchain, caso contrário poderá perder seus ativos. Não envie para exchanges.",
          hideWarning: "Ocultar aviso",
          transactionPending: "Transação pendente. Por favor, aguarde...",
        },
        connectButton: {
          connect: "Conectar Carteira",
          connecting: "Conectando...",
          connected: "Conectado",
          installMiniKit: "Por favor, instale a Worldcoin App para conectar sua carteira",
          errorConnecting: "Erro ao conectar carteira. Tente novamente.",
        },
        storm: {
          title: "Storm",
          subtitle: "Publique palavras que aparecem na tela por alguns segundos",
          placeholder: "Digite uma palavra...",
          publish: "Publicar",
          connectWallet: "Conecte sua carteira para participar",
          wordPublished: "Palavra publicada!",
          enterWord: "Digite uma palavra",
          publishing: "Publicando...",
        },
        profile: {
          inviteBanner: "Convide amigos e familiares para experimentarem o nosso aplicativo",
          shareButton: "Compartilhar",
          profile: "Perfil",
          logOut: "Sair da conta",
          shareWithFriends: "Compartilhar com amigos e família",
          followUs: "Siga-nos",
          notConnected: "Não conectado",
        },
        dailyCheckIn: {
          title: "Check-in Diário",
          subtitle: "Ganhe 1 ponto por dia",
          checkInButton: "Fazer Check-in",
          alreadyCheckedIn: "Check-in feito hoje!",
          points: "pontos",
          totalPoints: "Total de pontos",
          streak: "Sequência",
          days: "dias",
          checkInSuccess: "Check-in realizado! +1 ponto",
          history: "Histórico",
          showHistory: "Ver histórico",
          hideHistory: "Ocultar histórico",
          noHistory: "Nenhum check-in ainda",
          today: "Hoje",
          yesterday: "Ontem",
          daysAgo: "dias atrás",
          consecutiveDays: "dias consecutivos",
          nextCheckIn: "Próximo check-in em:",
          hours: "h",
          minutes: "m",
          seconds: "s",
          availableNow: "Disponível agora!",
        },
        finances: {
          title: "Finanças",
          subtitle: "Transparência financeira do projeto",
          transparencyMessage:
            "Como a nossa prioridade é a transparência, procuramos alinhar esse princípio com os nossos usuários e investidores",
          incentivesReceived: "Incentivos conseguidos para progressão do projeto",
          transactionFees: "Rendimentos obtidos por taxas de transação",
          tradingRevenue: "Rendimentos obtidos pela nossa equipa de Trading",
          projectExpenses: "Gastos no projeto",
          lastUpdated: "Última atualização",
          overview: "Visão Geral",
          revenue: "Receitas",
          expenses: "Despesas",
          netBalance: "Saldo Líquido",
          financialChart: "Gráfico Financeiro",
          revenueBreakdown: "Detalhamento de Receitas",
          expenseBreakdown: "Detalhamento de Despesas",
          noData: "Sem dados disponíveis",
          totalRevenue: "Total de Receitas",
          totalExpenses: "Total de Despesas",
        },
        partnerships: {
          title: "Parcerias",
          subtitle: "Nossos parceiros estratégicos",
          ourPartners: "Nossos Parceiros",
          holdstationTitle: "HoldStation",
          holdstationDescription: "Plataforma avançada de trading e swap para WorldChain",
          visitApp: "Visitar App",
          poweredBy: "Powered by",
          swapIntegration: "Integração de Swap",
          swapDescription: "Funcionalidade de swap integrada através da API da HoldStation",
          morePartnerships: "Mais parcerias",
          comingSoon: "Em breve...",
        },
        level: {
          title: "Nível",
          multiplier: "Multiplicador",
          progress: "Progresso",
          toNextLevel: "para o próximo nível",
          xpSources: "Fontes de XP",
          dailyCheckIn: "Check-in Diário",
          checkInXP: "XP de check-in atual",
          tpfHolding: "Holding de TPF",
          currentBalance: "Saldo atual",
          totalXP: "XP Total",
          levelBenefits: "Benefícios do Nível",
          eventRewards: "multiplicador de recompensas de eventos",
          level: "Nível",
          viewDetails: "Ver detalhes",
        },
        events: {
          topHoldersEvent: {
            title: "Top 10 Event",
            description: "10% Bônus para Top Holders",
            remaining: "restante",
          },
          snakeTournament: {
            registrationTitle: "Inscrição para o Torneio",
            registrationDescription: "Envie 200.000 TPF para se inscrever no torneio",
            tournamentTitle: "Torneio Jogo da Cobra",
            tournamentDescription: "Consiga mais pontos no jogo da cobra para ganhar o grande prêmio",
            instructions: "Instruções:",
            rules: {
              rule1: "O jogador que conseguir mais pontos no jogo da cobra ganha o grande prêmio",
              rule2:
                "O print do seu score deverá ser enviado para support@tradepulsetoken.com até ao último dia de torneio",
              rule3: "Em caso de empate com qualquer outro jogador o prêmio será dividido",
              rule4: "O prêmio será anunciado na última semana de evento",
              rule5:
                "Só poderá enviar um print para o email, mais que um será desconsiderado, portanto envie com cuidado",
            },
            registrationAddress: "Endereço para inscrição:",
            copyAddress: "Copiar endereço",
            addressCopied: "Endereço copiado!",
            email: "Email para envio do score:",
            remaining: "restante",
            phase: "Fase",
            registration: "Inscrição",
            tournament: "Torneio",
          },
        },
        membership: {
          title: "TPulseFi Membership",
          subtitle: "Membership Premium",
          readyQuestion: "Estás pronto para ser um verdadeiro membership TPulseFi?",
          whatWeOffer: "O que temos para oferecer?",
          benefitDescription:
            "Parte das taxas de transações TPF vai para os nossos membership no dia 9 todos os meses!",
          benefitNote: "E não é assim tão pouco!",
          price: "20 WLD",
          priceForever: "para sempre!",
          priceExplanation: "Ou seja, pagas 20 WLD e tens as taxas para sempre!",
          becomeButton: "Tornar-me Membership",
          processing: "Processando...",
          paymentInfo: "Informações de Pagamento",
          destinationWallet: "Wallet de Destino:",
          afterPayment: "Após o Pagamento",
          contactSupport: "No fim do pagamento, contacta a equipa de suporte com o print para:",
          tip: "Dica:",
          tipDescription: "Inclua o screenshot da transação e o teu endereço de wallet no email.",
        },
      }

    case "en":
    default:
      return {
        airdrop: {
          title: "Airdrop",
          subtitle: "Receive your daily TPF tokens",
          contractBalance: "Contract balance:",
          dailyAirdrop: "Daily airdrop:",
          nextClaimIn: "Next claim in:",
          claimButton: "Claim your TPF",
          processing: "Processing...",
          tokensClaimedSuccess: "Tokens claimed successfully!",
          availableForAirdrop: "Available for Airdrop:",
        },
        history: {
          title: "Transaction History",
          all: "All",
          loading: "Loading...",
          loadMore: "Load more",
          noTransactions: "No transactions found",
          showAllTransactions: "Show all transactions",
          received: "Received",
          sent: "Sent",
          from: "From",
          to: "To",
          block: "Block",
          txHash: "Transaction Hash",
          today: "Today",
          yesterday: "Yesterday",
        },
        nav: {
          home: "Home",
          wallet: "Wallet",
          learn: "Learn",
          profile: "Profile",
          news: "News",
          agenda: "Agenda",
          winners: "Winners",
          games: "Games",
          storm: "Storm",
          about: "About",
          finances: "Finances",
          partnerships: "Partnerships",
          membership: "Membership",
          menu: "Close",
          close: "Close",
        },
        games: {
          title: "FiGames",
          subtitle: "Play and earn TPF",
          allGames: "All",
          action: "Action",
          adventure: "Adventure",
          strategy: "Strategy",
          puzzle: "Puzzle",
          rpg: "RPG",
          comingSoon: "Coming Soon",
          enterNow: "Enter Now",
          moreGames: "More games coming soon",
          featuredGame: "Featured Game",
          back: "Back",
          start: "Start Game",
          score: "Score",
          round: "Round",
          lives: "Lives",
          shots: "Shots",
          gameOver: "Game Over",
          playAgain: "Play Again",
          loading: "Loading",
          developed: "Developed by TPulseFi",
        },
        wallet: {
          title: "Wallet",
          balance: "TPF Balance",
          send: "Send",
          receive: "Receive",
          swap: "Swap",
          otherTokens: "Other Tokens",
          errorMessage: "Could not get real balance. Try setting it manually.",
          address: "Address",
          assets: "Assets",
          activity: "Activity",
          copyAddress: "Copy address",
          addressCopied: "Address copied!",
          refreshBalances: "Refresh balances",
          balancesUpdated: "Balances updated!",
          errorUpdatingBalances: "Error updating balances",
        },
        swap: {
          title: "Swap Tokens",
          subtitle: "Swap tokens quickly and securely",
          from: "From",
          to: "To",
          amount: "Amount",
          estimatedOutput: "Estimated output",
          slippage: "Slippage",
          slippageTooltip: "Maximum price variation tolerance",
          swapButton: "Swap",
          processing: "Processing...",
          success: "Swap completed successfully!",
          error: "Error performing swap",
          insufficientBalance: "Insufficient balance",
          selectToken: "Select token",
          enterAmount: "Enter amount",
          gettingQuote: "Getting quote...",
          noQuoteAvailable: "Quote not available",
          swapTokens: "Swap tokens",
          maxSlippage: "Max slippage",
          priceImpact: "Price impact",
          minimumReceived: "Minimum received",
          networkFee: "Network fee",
          route: "Route",
        },
        winners: {
          title: "Winners",
          subtitle: "Participants rewarded in our events",
          noWinners: "No winners yet",
          noWinnersDesc: "Winners of our events will be displayed here. Stay tuned for upcoming events to participate!",
        },
        agenda: {
          title: "Agenda",
          subtitle: "Events and community activities",
          today: "Today",
          event: "Event",
          noEvents: "No events for this date",
          howToParticipate: "How to participate:",
          incentivePeriod: "Incentive Period",
          eventsAndActivities: "Events and community activities",
          online: "Online",
          participants: "participants",
          days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          months: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
          eventTypes: {
            airdrop: "Airdrop",
            community: "Community",
            competition: "Competition",
            education: "Education",
          },
          events: {
            topHoldersIncentive: {
              title: "10% Incentive for Top 10 TPF Holders",
              description:
                "Earn 10% bonus tokens if you are among the top 10 TPF holders during the event period. Example: 10M TPF = 1M bonus tokens",
              howToParticipate: [
                "Buy and hold TPF tokens",
                "Reach a position among the top 10 holders",
                "Maintain the position until June 9th",
              ],
            },
          },
        },
        furnace: {
          title: "Furnace",
          subtitle: "Burn TPF tokens and contribute to token stability",
          totalBurned: "Total burned",
          amountToBurn: "Amount of TPF to burn",
          startBurn: "Start Burn",
          openFurnace: "Open the Furnace",
          burning: "Burning...",
          burnCompleted: "Burn Completed!",
          instructions: "Click the button to open the furnace",
          furnaceInfo: "Furnace Information",
          deflation:
            "Deflation: Each burned token is sent to a dead wallet (0x000...dEaD) and permanently removed from circulation.",
          lastTransaction: "Last Transaction",
        },
        learn: {
          title: "Learn",
          search: "Search content...",
          searchTerms: "Search terms...",
          searchInGlossary: "Search in Glossary",
          didYouKnow: "Did you know?",
          bitcoinPizza:
            "On May 22, 2010, Laszlo Hanyecz made the first Bitcoin purchase: two pizzas for 10,000 BTC. Today, that amount would be worth millions of dollars!",
          tokenomics: "Tokenomics",
          tokenomicsDesc: "Understand token economics and how it affects the value and utility of crypto projects.",
          glossary: "Crypto Glossary",
          glossaryDesc: "Complete guide to terms and concepts from the cryptocurrency world for beginners and experts.",
          glossaryTitle: "Crypto Glossary",
          tokenomicsTitle: "Tokenomics",
          tokenomicsIntro:
            "Tokenomics refers to the economics of cryptocurrency tokens. Understanding a project's tokenomics is essential for evaluating its value and long-term potential.",
          supplyDistribution: "Supply and Distribution",
          supplyDistributionDesc:
            "The total, circulating, and maximum supply of tokens, as well as their distribution among team, investors, and community.",
          tokenUtility: "Token Utility",
          tokenUtilityDesc: "How the token is used within the ecosystem and what benefits it offers to holders.",
          valueMechanisms: "Value Mechanisms",
          valueMechanismsDesc:
            "Token burning, staking, governance, and other mechanisms that affect the token's value.",
          tpfTokenomics: "TPF Tokenomics",
          totalSupply: "Total Supply:",
          liquidity: "Liquidity:",
          staking: "Staking:",
          team: "Team:",
          marketing: "Marketing:",
          reserve: "Reserve:",
          tradingSimulator: "Trading Simulator",
        },
        about: {
          title: "About Us",
          subtitle: "Learn about the TPulseFi project",
          about: "About",
          roadmap: "Roadmap",
          tokenomics: "Tokenomics",
          whyChoose: "Why choose TPulseFi?",
          airdrops: "Daily Airdrops",
          community: "Active Community",
          utility: "Utility",
          longTerm: "Long-Term Vision",
          growthStrategy: "Growth Strategy",
          marketing: "Marketing",
          incentives: "Incentives",
          governance: "Governance",
          phase1: "Phase 1",
          phase1Completed: "Completed",
          phase2: "Phase 2",
          phase2Development: "In Development",
          phase3: "Phase 3",
          phase3Future: "Future Goals",
          tokenLaunch: "Token Launch",
          websiteDocs: "Website and Documentation",
          communityGrowth: "Community Growth",
          miniApp: "Mini-App (Worldcoin AppStore)",
          airdropCampaigns: "Airdrop Campaigns",
          fiGames: "Fi Games",
          fiStaking: "FiStaking (12% APY)",
          pulseGame: "Pulse Game",
          fiPay: "FiPay",
          enhancedSecurity: "Enhanced Security",
          exchangeListings: "Exchange Listings",
          ecosystem: "TPulseFi Ecosystem Expansion",
          partnerships: "Partnerships",
          mobileApp: "Mobile App",
          tokenDetails: "Token Details",
          holderBenefits: "Holder Benefits",
          buyTPF: "Buy TPF",
        },
        sendToken: {
          title: "Send Tokens",
          subtitle: "Send tokens to another address",
          address: "Address",
          amount: "Amount",
          selectToken: "Select Token",
          send: "Send",
          processing: "Processing...",
          addressRequired: "Address is required",
          invalidAmount: "Invalid amount",
          error: "Error sending tokens. Please try again.",
          transactionSuccess: "Transaction sent successfully!",
          transactionFailed: "Transaction failed",
          sentTo: "sent to",
          viewTx: "View TX",
          minikitNotInstalled: "MiniKit is not installed",
          tokenNotSupported: "Token not supported",
          warning: "Please verify the recipient address before sending tokens.",
          warningWorldchain:
            "Do not send to wallets that don't support Worldchain, otherwise you may lose your assets. Do not send to exchanges.",
          hideWarning: "Hide warning",
          transactionPending: "Transaction pending. Please wait...",
        },
        connectButton: {
          connect: "Connect Wallet",
          connecting: "Connecting...",
          connected: "Connected",
          installMiniKit: "Please install the Worldcoin App to connect your wallet",
          errorConnecting: "Error connecting wallet. Please try again.",
        },
        storm: {
          title: "Storm",
          subtitle: "Publish words that appear on screen for a few seconds",
          placeholder: "Type a word...",
          publish: "Publish",
          connectWallet: "Connect your wallet to participate",
          wordPublished: "Word published!",
          enterWord: "Enter a word",
          publishing: "Publishing...",
        },
        profile: {
          inviteBanner: "Invite friends and family to try our app",
          shareButton: "Share",
          profile: "Profile",
          logOut: "Log out",
          shareWithFriends: "Share with friends and family",
          followUs: "Follow us",
          notConnected: "Not connected",
        },
        dailyCheckIn: {
          title: "Daily Check-in",
          subtitle: "Earn 1 point per day",
          checkInButton: "Check In",
          alreadyCheckedIn: "Already checked in today!",
          points: "points",
          totalPoints: "Total points",
          streak: "Streak",
          days: "days",
          checkInSuccess: "Check-in completed! +1 point",
          history: "History",
          showHistory: "Show history",
          hideHistory: "Hide history",
          noHistory: "No check-ins yet",
          today: "Today",
          yesterday: "Yesterday",
          daysAgo: "days ago",
          consecutiveDays: "consecutive days",
          nextCheckIn: "Next Check-in in:",
          hours: "h",
          minutes: "m",
          seconds: "s",
          availableNow: "Available now!",
        },
        finances: {
          title: "Finances",
          subtitle: "Project financial transparency",
          transparencyMessage:
            "As our priority is transparency, we seek to align this principle with our users and investors",
          incentivesReceived: "Incentives received for project progression",
          transactionFees: "Revenue obtained from transaction fees",
          tradingRevenue: "Revenue obtained by our Trading team",
          projectExpenses: "Project expenses",
          lastUpdated: "Last updated",
          overview: "Overview",
          revenue: "Revenue",
          expenses: "Expenses",
          netBalance: "Net Balance",
          financialChart: "Financial Chart",
          revenueBreakdown: "Revenue Breakdown",
          expenseBreakdown: "Expense Breakdown",
          noData: "No data available",
          totalRevenue: "Total Revenue",
          totalExpenses: "Total Expenses",
        },
        partnerships: {
          title: "Partnerships",
          subtitle: "Our strategic partners",
          ourPartners: "Our Partners",
          holdstationTitle: "HoldStation",
          holdstationDescription: "Advanced trading and swap platform for WorldChain",
          visitApp: "Visit App",
          poweredBy: "Powered by",
          swapIntegration: "Swap Integration",
          swapDescription: "Swap functionality integrated through HoldStation API",
          morePartnerships: "More Partnerships",
          comingSoon: "Coming soon...",
        },
        level: {
          title: "Level",
          multiplier: "Multiplier",
          progress: "Progress",
          toNextLevel: "to next level",
          xpSources: "XP Sources",
          dailyCheckIn: "Daily Check-in",
          checkInXP: "Check-in XP",
          tpfHolding: "TPF Holding",
          currentBalance: "Current balance",
          totalXP: "Total XP",
          levelBenefits: "Level Benefits",
          eventRewards: "event rewards multiplier",
          level: "Level",
          viewDetails: "View details",
        },
        events: {
          topHoldersEvent: {
            title: "Top 10 Event",
            description: "10% Bonus for Top Holders",
            remaining: "remaining",
          },
          snakeTournament: {
            registrationTitle: "Tournament Registration",
            registrationDescription: "Send 200,000 TPF to register for the tournament",
            tournamentTitle: "Snake Game Tournament",
            tournamentDescription: "Get the highest score in the snake game to win the grand prize",
            instructions: "Instructions:",
            rules: {
              rule1: "The player who achieves the highest score in the snake game wins the grand prize",
              rule2:
                "Screenshot of your score must be sent to support@tradepulsetoken.com by the last day of the tournament",
              rule3: "In case of a tie with any other player, the prize will be divided",
              rule4: "The prize will be announced in the last week of the event",
              rule5:
                "You can only send one screenshot to the email, more than one will be disregarded, so send carefully",
            },
            registrationAddress: "Registration address:",
            copyAddress: "Copy address",
            addressCopied: "Address copied!",
            email: "Email for score submission:",
            remaining: "remaining",
            phase: "Phase",
            registration: "Registration",
            tournament: "Tournament",
          },
        },
        membership: {
          title: "TPulseFi Membership",
          subtitle: "Premium Membership",
          readyQuestion: "Are you ready to become a true TPulseFi membership?",
          whatWeOffer: "What do we have to offer?",
          benefitDescription: "Part of TPF transaction fees goes to our members on the 9th of every month!",
          benefitNote: "And it's not that little!",
          price: "20 WLD",
          priceForever: "forever!",
          priceExplanation: "That means you pay 20 WLD and get the fees forever!",
          becomeButton: "Become Membership",
          processing: "Processing...",
          paymentInfo: "Payment Information",
          destinationWallet: "Destination Wallet:",
          afterPayment: "After Payment",
          contactSupport: "After payment, contact the support team with the screenshot to:",
          tip: "Tip:",
          tipDescription: "Include the transaction screenshot and your wallet address in the email.",
        },
      }
  }
}

// Hook para usar traduções em componentes
export function useTranslation() {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    setLanguage(getCurrentLanguage())

    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  const translations = getTranslations(language)

  return {
    language,
    setLanguage: setCurrentLanguage,
    t: translations,
  }
}

// Alias para compatibilidade
export const useTranslations = useTranslation
