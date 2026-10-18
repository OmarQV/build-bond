import { getNetwork, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api'

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'
export const EXPLORER_TX_URL = 'https://stellar.expert/explorer/testnet/tx/'

// USDC de prueba emitido por Circle en Testnet
export const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// Cuenta que recibe el stake mientras el contrato BUILD BOND no esté desplegado.
// Si no se define, la transacción solo registra el stake en la cuenta del usuario (no mueve fondos).
export const ESCROW_ADDRESS = import.meta.env.VITE_STAKE_ESCROW as string | undefined

export type StakeAsset = 'XLM' | 'USDC'

export type Balances = { funded: boolean; XLM: string; USDC: string | null }

export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`

export async function connectFreighter(): Promise<string> {
  const installed = await isConnected()
  if (!installed.isConnected) {
    throw new Error('No encontramos Freighter. Instala la extensión desde freighter.app y recarga la página.')
  }

  const access = await requestAccess()
  if (access.error || !access.address) {
    throw new Error(access.error?.message || 'Rechazaste la conexión en Freighter.')
  }

  const network = await getNetwork()
  if (network.error) throw new Error(network.error.message)
  if (network.network !== 'TESTNET') {
    throw new Error(`Freighter está en ${network.network}. Cámbiala a Testnet para continuar.`)
  }

  return access.address
}

export async function loadBalances(address: string): Promise<Balances> {
  const response = await fetch(`${HORIZON_URL}/accounts/${address}`)
  if (response.status === 404) return { funded: false, XLM: '0', USDC: null }
  if (!response.ok) throw new Error('No pudimos leer tu saldo en Horizon.')

  const account: { balances: { asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }[] } = await response.json()
  const xlm = account.balances.find((b) => b.asset_type === 'native')
  const usdc = account.balances.find((b) => b.asset_code === 'USDC' && b.asset_issuer === USDC_TESTNET_ISSUER)
  return { funded: true, XLM: xlm?.balance ?? '0', USDC: usdc?.balance ?? null }
}

export async function fundWithFriendbot(address: string) {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`)
  if (!response.ok) throw new Error('Friendbot no pudo fondear la cuenta. Intenta de nuevo en unos segundos.')
}

export async function stakeWithFreighter({
  address,
  asset,
  amount,
  onSigned,
}: {
  address: string
  asset: StakeAsset
  amount: string
  onSigned?: () => void
}): Promise<string> {
  const { Asset, BASE_FEE, Horizon, Memo, Networks, Operation, TransactionBuilder } = await import('@stellar/stellar-sdk')
  const server = new Horizon.Server(HORIZON_URL)
  const account = await server.loadAccount(address)

  const operation = ESCROW_ADDRESS
    ? Operation.payment({
        destination: ESCROW_ADDRESS,
        asset: asset === 'XLM' ? Asset.native() : new Asset('USDC', USDC_TESTNET_ISSUER),
        amount,
      })
    : Operation.manageData({ name: 'buildbond_stake', value: `${amount} ${asset}` })

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(operation)
    .addMemo(Memo.text('BUILD BOND stake'))
    .setTimeout(180)
    .build()

  const signed = await signTransaction(tx.toXDR(), { networkPassphrase: Networks.TESTNET, address })
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message || 'Rechazaste la firma en Freighter.')
  }
  onSigned?.()

  try {
    const result = await server.submitTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET))
    return result.hash
  } catch (error) {
    const codes = (error as { response?: { data?: { extras?: { result_codes?: unknown } } } }).response?.data?.extras?.result_codes
    throw new Error(codes ? `La red rechazó la transacción: ${JSON.stringify(codes)}` : 'No pudimos enviar la transacción a Stellar.')
  }
}
