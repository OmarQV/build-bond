import { getNetwork, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api'

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'
export const EXPLORER_TX_URL = 'https://stellar.expert/explorer/testnet/tx/'

// USDC de prueba emitido por Circle en Testnet
export const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// Contrato BuildBond desplegado en Testnet (ver Contracts/build-bond/DEPLOYMENTS.md).
// El evento 1 es el evento público de demo: open_admission = true, así que
// cualquier wallet puede depositar sin que un organizador la autorice antes.
export const BUILD_BOND_CONTRACT_ID =
  (import.meta.env.VITE_BUILD_BOND_CONTRACT_ID as string | undefined) ||
  'CCLJNTWWDKPVT4LFXH7QLZSLV3FKOTRC5DZX3MVPW3C5Y5PFKUH7AVHQ'
export const BUILD_BOND_EVENT_ID = BigInt(import.meta.env.VITE_BUILD_BOND_EVENT_ID || '1')
// sha256("buildbond-public-demo-v1"), debe coincidir con el rules_hash fijado al crear el evento.
export const BUILD_BOND_RULES_HASH =
  (import.meta.env.VITE_BUILD_BOND_RULES_HASH as string | undefined) ||
  '9816a8765addc874a8ea0763bcc2ca1a3226188a0ca214103c153b2301809288'
// Monto fijo del evento de demo: 50 XLM, en stroops (1 XLM = 10^7 stroops).
export const BUILD_BOND_AMOUNT_XLM = '50'

export type StakeAsset = 'XLM' | 'USDC'

export type Balances = { funded: boolean; XLM: string; USDC: string | null }

export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

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

export type JoinResult = { bondId: number; hash: string }

/**
 * Invoca `join` en el contrato BuildBond: deposita BUILD_BOND_AMOUNT_XLM en
 * el evento de demo (open_admission = true) desde la propia wallet del
 * hacker, firmado con Freighter. No requiere backend ni autorización previa
 * del organizador — ver Contracts/build-bond/DEPLOYMENTS.md.
 */
export async function joinBuildBond({
  address,
  onSigned,
}: {
  address: string
  onSigned?: () => void
}): Promise<JoinResult> {
  const { Address, Contract, Networks, TransactionBuilder, nativeToScVal, scValToNative, rpc } = await import(
    '@stellar/stellar-sdk'
  )
  const server = new rpc.Server(SOROBAN_RPC_URL)
  const contract = new Contract(BUILD_BOND_CONTRACT_ID)
  const account = await server.getAccount(address)

  const rulesHash = hexToBytes(BUILD_BOND_RULES_HASH)
  const operation = contract.call(
    'join',
    nativeToScVal(BUILD_BOND_EVENT_ID, { type: 'u64' }),
    new Address(address).toScVal(),
    nativeToScVal(rulesHash, { type: 'bytes' }),
    nativeToScVal([], { type: 'u64' }),
  )

  const tx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: Networks.TESTNET })
    .addOperation(operation)
    .setTimeout(180)
    .build()

  const prepared = await server.prepareTransaction(tx)

  const signed = await signTransaction(prepared.toXDR(), { networkPassphrase: Networks.TESTNET, address })
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message || 'Rechazaste la firma en Freighter.')
  }
  onSigned?.()

  const sendResponse = await server.sendTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET))
  if (sendResponse.status === 'ERROR') {
    throw new Error('La red rechazó la transacción de stake.')
  }

  const result = await server.pollTransaction(sendResponse.hash, { attempts: 20 })
  if (result.status !== 'SUCCESS') {
    throw new Error(
      result.status === 'FAILED'
        ? 'La transacción de stake falló al ejecutarse on-chain. Revisa tu saldo y vuelve a intentar.'
        : 'No pudimos confirmar la transacción a tiempo. Revísala en el explorador con el hash.',
    )
  }

  const parsed = result.returnValue ? (scValToNative(result.returnValue) as { bond_id: number }) : null
  return { bondId: parsed?.bond_id ?? 0, hash: sendResponse.hash }
}
