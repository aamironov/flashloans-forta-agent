import BigNumber from 'bignumber.js'
import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType
} from 'forta-agent'

const HIGH_GAS_THRESHOLD = "7000000"
const AAVE_V2_ADDRESS = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9"
const FLASH_LOAN_EVENT = "event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 referralCode)"
const INTERESTING_PROTOCOLS = ["0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xE592427A0AEce92De3Edee1F18E0157C05861564"] // UniSwap V2 and V3 routers

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    // report finding if detected a flash loan attack on Yearn Dai vault
    const findings: Finding[] = []
    
    // if gas too low
    if (new BigNumber(txEvent.gasUsed).isLessThan(HIGH_GAS_THRESHOLD)) return findings
  
    // if aave not involved
    if (!txEvent.addresses[AAVE_V2_ADDRESS]) return findings
  
    // if no flash loan events found
    const flashLoanEvents = txEvent.filterLog(FLASH_LOAN_EVENT)
    if (!flashLoanEvents.length) return findings
  
    // if does not involve a protocol we are interested in
    const protocolAddress = INTERESTING_PROTOCOLS.find((address) => txEvent.addresses[address])
    if (!protocolAddress) return findings

    findings.push(
	  Finding.fromObject({
		name: "Flash Loan to arbitrage UniSwap",
		description: `Flash Loan detected to arbitrage ${protocolAddress}`,
		alertId: "FORTA-5",
		protocol: "aave",
		type: FindingType.Suspicious,
		severity: FindingSeverity.High,
		metadata: {
		  protocolAddress,
		  loans: JSON.stringify(flashLoanEvents)
		},
	  }
	))
    return findings
}

export default {
  handleTransaction
}
