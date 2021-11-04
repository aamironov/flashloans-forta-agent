import { 
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  createTransactionEvent
} from "forta-agent"
import agent from "./agent"

describe("flash loan agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEvent = ({ gasUsed, addresses, logs, blockNumber }: any) => createTransactionEvent({
    transaction: {} as any,
    receipt: { gasUsed, logs } as any,
    block: { number: blockNumber } as any,
    addresses
  })

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe("handleTransaction", () => {
    it("returns empty findings if gas used is below threshold", async () => {
      const txEvent = createTxEvent({ gasUsed: "1" })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding if a flash loan arbitrage on UniswapV2 is detected", async () => {
      const flashLoanTopic = "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac"
      const flashLoanEvent = {
        topics: [flashLoanTopic]
      }
      const protocolAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
      const blockNumber = 100
      const txEvent = createTxEvent({ 
        gasUsed: "7000001",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true
        },
        blockNumber
      })
      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Flash Loan to arbitrage UniSwap",
          description: `Flash Loan detected to arbitrage ${protocolAddress}`,
          alertId: "FORTA-5",
          protocol: "aave",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            protocolAddress,
            loans: JSON.stringify([flashLoanEvent])
          },
        })
      ])
    })

    it("returns a finding if a flash loan arbitrage on UniswapV3 is detected", async () => {
      const flashLoanTopic = "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac"
      const flashLoanEvent = {
        topics: [flashLoanTopic]
      }
      const protocolAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
      const blockNumber = 100
      const txEvent = createTxEvent({
        gasUsed: "7000001",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true
        },
        blockNumber
      })
      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Flash Loan to arbitrage UniSwap",
          description: `Flash Loan detected to arbitrage ${protocolAddress}`,
          alertId: "FORTA-5",
          protocol: "aave",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            protocolAddress,
            loans: JSON.stringify([flashLoanEvent])
          },
        })
      ])
    })
  })
})
