import ERC20_ABI from "../abi/ERC20.json"
import PERMIT2_ABI from "../abi/Permit2.json"

export class AbiService {
  static getERC20ABI() {
    return ERC20_ABI
  }

  static getPermit2ABI() {
    return PERMIT2_ABI
  }

  // Função helper para obter apenas as funções necessárias
  static getERC20TransferABI() {
    return ERC20_ABI.filter(
      (item) =>
        item.name === "transfer" ||
        item.name === "balanceOf" ||
        item.name === "decimals" ||
        item.name === "symbol" ||
        item.name === "name",
    )
  }

  // Função helper para criar interface do ethers
  static createERC20Interface() {
    return [
      "function transfer(address _to, uint256 _value) returns (bool)",
      "function balanceOf(address _owner) view returns (uint256 balance)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)",
      "function totalSupply() view returns (uint256)",
      "function approve(address _spender, uint256 _value) returns (bool)",
      "function allowance(address _owner, address _spender) view returns (uint256)",
    ]
  }

  // Constantes de endereços conhecidos
  static readonly PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3"

  static readonly KNOWN_TOKENS = {
    WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
  }
}
