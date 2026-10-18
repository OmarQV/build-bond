import { useState } from 'react'
import {
  BUILD_BOND_AMOUNT_XLM,
  BUILD_BOND_CONTRACT_ID,
  connectFreighter,
  ContractError,
  EXPLORER_TX_URL,
  findExistingBond,
  fundWithFriendbot,
  joinBuildBond,
  loadBalances,
  shortAddress,
  type Balances,
  type ExistingBond,
  type StakeAsset,
} from './lib/stellar'
import './StakeStep.css'

type Phase = 'connect' | 'connecting' | 'ready' | 'signing' | 'sending' | 'done'

const wallets = [
  { id: 'Freighter', note: 'Extensión oficial de Stellar', available: true },
  { id: 'xBull', note: 'Próximamente', available: false },
  { id: 'Albedo', note: 'Próximamente', available: false },
  { id: 'LOBSTR', note: 'Próximamente', available: false },
]

const stakeAmounts: Record<StakeAsset, string> = { XLM: BUILD_BOND_AMOUNT_XLM, USDC: '10' }

// Reserva mínima que la cuenta debe conservar además del stake (base + comisiones)
const XLM_RESERVE = 1.5

const stakeRules = [
  { ok: true, text: 'Tu stake se devuelve completo al hacer check-in y enviar tu proyecto' },
  { ok: true, text: 'Si no puedes asistir, cancela hasta 48 h antes y recupera tu stake' },
  { ok: false, text: 'Si no te presentas, tu stake queda congelado y lo recuperas al completar otro evento' },
]

const demoAddress = 'GBX7QK2M4WZT5NLE3RYH6PVA9DCJ8SUF2KXQ7B4MZT3LWYQ4K4QZ'
const demoBalances: Balances = { funded: true, XLM: '1250.00', USDC: '84.50' }
const demoTx = '7f3c9a1e5b2d48c6a0e9f17d3b5c2a8e4f6d1b9c7a3e5f2d8b4c6a1e9f3d7b5c'

const steps = ['Conectar wallet', 'Hacer stake', 'Confirmado']

const formatAmount = (value: string) => Number(value).toLocaleString('es', { maximumFractionDigits: 2 })

export function StakeStep({ eventName, onFinish }: { eventName: string; onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>('connect')
  const [asset, setAsset] = useState<StakeAsset>('XLM')
  const [address, setAddress] = useState('')
  const [balances, setBalances] = useState<Balances | null>(null)
  const [demo, setDemo] = useState(false)
  const [funding, setFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState('')
  const [existing, setExisting] = useState<ExistingBond | null>(null)

  const stepIndex = phase === 'done' ? 3 : phase === 'connect' || phase === 'connecting' ? 0 : 1
  const amount = existing ? existing.amountXlm : stakeAmounts[asset]
  const balance = balances ? (asset === 'XLM' ? balances.XLM : balances.USDC) : null
  const needed = Number(amount) + (asset === 'XLM' ? XLM_RESERVE : 0)
  const enoughFunds = balance !== null && Number(balance) >= needed

  const refreshBalances = async (account: string) => {
    const next = await loadBalances(account)
    setBalances(next)
    if (next.USDC === null) setAsset('XLM')
  }

  const connect = async () => {
    setError(null)
    setPhase('connecting')
    try {
      const account = await connectFreighter()
      setAddress(account)
      setDemo(false)
      await refreshBalances(account)
      if (await showExistingBond(account)) return
      setPhase('ready')
    } catch (err) {
      setError((err as Error).message)
      setPhase('connect')
    }
  }

  // Si la wallet ya depositó en este evento, el contrato rechaza otro join (error 303):
  // mostramos su bond en lugar de pedirle que firme de nuevo.
  const showExistingBond = async (account: string) => {
    const bond = await findExistingBond(account).catch(() => null)
    if (!bond) return false
    setExisting(bond)
    setAsset('XLM')
    setTxHash('')
    setPhase('done')
    return true
  }

  const startDemo = () => {
    setError(null)
    setDemo(true)
    setAddress(demoAddress)
    setBalances(demoBalances)
    setPhase('ready')
  }

  const fund = async () => {
    setFunding(true)
    setError(null)
    try {
      await fundWithFriendbot(address)
      await refreshBalances(address)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setFunding(false)
    }
  }

  const finish = (hash: string) => {
    setTxHash(hash)
    setPhase('done')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stake = async () => {
    setError(null)
    setPhase('signing')

    if (demo) {
      window.setTimeout(() => setPhase('sending'), 1100)
      window.setTimeout(() => finish(demoTx), 2300)
      return
    }

    try {
      const { hash } = await joinBuildBond({ address, onSigned: () => setPhase('sending') })
      finish(hash)
    } catch (err) {
      if (err instanceof ContractError && err.code === 303 && (await showExistingBond(address))) return
      setError((err as Error).message)
      setPhase('ready')
    }
  }

  const disconnect = () => {
    setPhase('connect')
    setAddress('')
    setBalances(null)
    setDemo(false)
    setError(null)
    setExisting(null)
  }

  return (
    <section className="application-region stake-region">
      <h2>{phase === 'done' ? (existing ? 'Ya tienes tu Build Bond' : '¡Lugar confirmado!') : 'Stake para asistir'}</h2>
      <p className="application-lead">
        {phase === 'done'
          ? existing
            ? <>Esta wallet ya depositó en el evento de demo, así que no necesitas firmar de nuevo. Nos vemos en <b>{eventName}</b>.</>
            : <>Tu stake quedó registrado en Stellar Testnet. Nos vemos en <b>{eventName}</b>.</>
          : <>Tu solicitud fue aceptada. Para confirmar tu lugar en <b>{eventName}</b> deposita un stake reembolsable en la red Stellar.</>}
      </p>

      <ol className="stake-steps" aria-label="Progreso del stake">
        {steps.map((step, index) => (
          <li key={step} className={index < stepIndex ? 'is-done' : index === stepIndex ? 'is-current' : ''}>
            <span className="step-num">{index < stepIndex ? '✓' : index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      {phase !== 'done' && (
        <>
          <dl className="stake-info">
            <div><dt>RED</dt><dd>Stellar Testnet</dd></div>
            <div><dt>MONTO</dt><dd className="stake-amount">{amount} {asset}</dd></div>
            <div><dt>CONTRATO</dt><dd className="mono-ellipsis" title={BUILD_BOND_CONTRACT_ID}>{shortAddress(BUILD_BOND_CONTRACT_ID)} · Soroban</dd></div>
            <div><dt>REEMBOLSO</dt><dd>Al hacer check-in y enviar tu proyecto</dd></div>
          </dl>

          <ul className="track-rules">
            {stakeRules.map((rule) => (
              <li key={rule.text}><span className={rule.ok ? 'rule-dot ok' : 'rule-dot no'} aria-hidden="true">{rule.ok ? '✓' : '×'}</span>{rule.text}</li>
            ))}
          </ul>
        </>
      )}

      {error && <div className="form-alert is-error">✕ {error}</div>}

      {(phase === 'connect' || phase === 'connecting') && (
        <div className="app-field">
          <span className="app-label">Elige tu wallet de Stellar</span>
          <span className="app-hint">Conectaremos tu cuenta para firmar el stake. No movemos fondos sin tu firma.</span>
          <div className="wallet-grid">
            {wallets.map((w) => (
              <button
                type="button"
                key={w.id}
                className={w.available && phase === 'connecting' ? 'wallet-card is-loading' : 'wallet-card'}
                disabled={!w.available || phase === 'connecting'}
                onClick={connect}
              >
                <span className="wallet-logo" aria-hidden="true">{w.id[0]}</span>
                <span className="track-text">
                  <strong>{w.id}</strong>
                  <span>{w.available && phase === 'connecting' ? 'Revisa la ventana de Freighter…' : w.note}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="link-button demo-link" disabled={phase === 'connecting'} onClick={startDemo}>
            ¿Sin Freighter? Continuar en modo demo →
          </button>
        </div>
      )}

      {(phase === 'ready' || phase === 'signing' || phase === 'sending') && balances && (
        <>
          <div className="wallet-connected">
            <span className="wallet-logo" aria-hidden="true">F</span>
            <span className="track-text">
              <strong>{demo ? 'Freighter (demo)' : 'Freighter conectada'}</strong>
              <span className="mono-ellipsis" title={address}>
                {shortAddress(address)} · {formatAmount(balances.XLM)} XLM{balances.USDC !== null && ` · ${formatAmount(balances.USDC)} USDC`}
              </span>
            </span>
            <button type="button" className="link-button" disabled={phase !== 'ready'} onClick={disconnect}>Cambiar</button>
          </div>

          {!balances.funded ? (
            <div className="form-alert is-warning fund-alert">
              <span>⚠ Tu cuenta aún no existe en Testnet. Fondéala gratis con Friendbot (10,000 XLM de prueba).</span>
              <button type="button" className="btn-primary" disabled={funding} onClick={fund}>
                {funding ? 'Fondeando…' : 'Fondear con Friendbot'}
              </button>
            </div>
          ) : (
            <>
              <div className="app-field">
                <span className="app-label">Activo para el stake</span>
                <span className="app-hint">Este evento de demo solo acepta XLM en el contrato BuildBond.</span>
                <div className="chip-picker">
                  {(Object.keys(stakeAmounts) as StakeAsset[]).map((a) => (
                    <button
                      type="button"
                      key={a}
                      className={asset === a ? 'chip is-active' : 'chip'}
                      aria-pressed={asset === a}
                      disabled={phase !== 'ready' || a !== 'XLM'}
                      onClick={() => setAsset(a)}
                    >
                      {stakeAmounts[a]} {a}
                    </button>
                  ))}
                </div>
              </div>

              {phase === 'ready'
                ? enoughFunds
                  ? <div className="form-alert is-ready">✓ Saldo suficiente — se bloquearán {amount} {asset} en el contrato BuildBond</div>
                  : <div className="form-alert is-warning">⚠ Saldo insuficiente: necesitas al menos {needed} {asset}</div>
                : <div className="form-alert is-warning stake-progress">
                    <span className="spinner" aria-hidden="true" />
                    {phase === 'signing' ? 'Esperando tu firma en Freighter…' : 'Enviando transacción a la red Stellar…'}
                  </div>}
            </>
          )}

          <div className="application-actions">
            <button type="button" className="btn-ghost" disabled={phase !== 'ready'} onClick={disconnect}>Anterior</button>
            <button type="button" className="btn-primary" disabled={phase !== 'ready' || !balances.funded || !enoughFunds} onClick={stake}>
              {phase === 'ready' ? `Hacer stake de ${amount} ${asset}` : 'Procesando…'}
            </button>
          </div>
        </>
      )}

      {phase === 'done' && (
        <>
          <div className="stake-ticket">
            <div className="ticket-main">
              <span className="ticket-kicker">TICKET DE HACKER</span>
              <strong>{eventName}</strong>
              <span>Jhamil · Empezar desde cero</span>
            </div>
            <div className="ticket-stub">
              <span className="ticket-kicker">Nº</span>
              <strong>SA-2026-0147</strong>
            </div>
          </div>

          <dl className="done-summary">
            <div><dt>STAKE</dt><dd>{amount} {asset}</dd></div>
            <div><dt>WALLET</dt><dd>Freighter · {shortAddress(address)}</dd></div>
            <div>
              <dt>{existing ? 'BOND' : 'TRANSACCIÓN'}</dt>
              <dd className="mono-ellipsis" title={txHash}>
                {existing
                  ? `#${existing.bondId} · contrato ${shortAddress(BUILD_BOND_CONTRACT_ID)}`
                  : demo
                  ? `${txHash.slice(0, 10)}…${txHash.slice(-6)} (demo)`
                  : <a className="tx-link" href={`${EXPLORER_TX_URL}${txHash}`} target="_blank" rel="noreferrer">{txHash.slice(0, 10)}…{txHash.slice(-6)} ↗</a>}
              </dd>
            </div>
            <div><dt>ESTADO</dt><dd className="status-ok">{existing ? existing.state : 'CONFIRMADO · REEMBOLSABLE'}</dd></div>
          </dl>

          <div className="application-actions">
            <button type="button" className="btn-ghost" onClick={disconnect}>Ver de nuevo</button>
            <button type="button" className="btn-primary" onClick={onFinish}>Volver a hackathons</button>
          </div>
        </>
      )}
    </section>
  )
}
