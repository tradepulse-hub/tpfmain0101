// Constantes centralizadas
export const WORLDCHAIN_CONFIG = {
  chainId: 480,
  name: "World Chain Mainnet",
  shortName: "wc",
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  blockExplorer: "https://worldscan.org",
}

export const KNOWN_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

export const TOKENS_INFO = {
  TPF: {
    symbol: "TPF",
    name: "TPulseFi",
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    logo: "/logo-tpf.png",
    decimals: 18,
  },
  WLD: {
    symbol: "WLD",
    name: "Worldcoin",
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    logo: "/worldcoin.jpeg",
    decimals: 18,
  },
  DNA: {
    symbol: "DNA",
    name: "DNA Token",
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    logo: "/dna-token.png",
    decimals: 18,
  },
  WDD: {
    symbol: "WDD",
    name: "Drachma Token",
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    logo: "/drachma-token.png",
    decimals: 18,
  },
}
