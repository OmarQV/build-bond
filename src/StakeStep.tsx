import { useState } from 'react'
import './StakeStep.css'

type Asset = 'XLM' | 'USDC'
type Phase = 'connect' | 'connecting' | 'ready' | 'signing' | 'sending' | 'done'

const wallets = [
  { id: 'Freighter', note: 'Extensión oficial de Stellar' },
  { id: 'xBull', note: 'Wallet web y extensión' },
  { id: 'Albedo', note: 'Firma desde el navegador' },
  { id: 'LOBSTR', note: 'Conecta con WalletConnect' },
]

const stakeAmounts: Record<Asset, { amount: string; balance: string }> = {
  XLM: { amount: '50', balance: '1,250.00' },
  USDC: { amount: '10', balance: '84.50' },
}

const stakeRules = [
  { ok: true, text: 'Tu stake se devuelve completo al hacer check-in y enviar tu proyecto' },
  { ok: true, text: 'Si no puedes asistir, cancela hasta 48 h antes y recupera tu stake' },
  { ok: false, text: 'Si no te presentas sin avisar, el stake se suma al pool de premios' },
]

const demoWallet = { address: 'GBX7QK2M4WZT5NLE3RYH6PVA9DCJ8SUF2KXQ7B4MZT3LWYQ4K4QZ', short: 'GBX7…K4QZ' }
const demoTx = '7f3c9a1e5b2d48c6a0e9f17d3b5c2a8e4f6d1b9c7a3e5f2d8b4c6a1e9f3d7b5c'

const steps = ['Conectar wallet', 'Hacer stake', 'Confirmado']

export function StakeStep({ eventName, onFinish }: { eventName: string; onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>('connect')
  const [wallet, setWallet] = useState('Freighter')
  const [asset, setAsset] = useState<Asset>('XLM')

  const stepIndex = phase === 'done' ? 3 : phase === 'connect' || phase === 'connecting' ? 0 : 1
  const { amount, balance } = stakeAmounts[asset]

  const connect = (id: string) => {
    setWallet(id)
    setPhase('connecting')
    window.setTimeout(() => setPhase('ready'), 900)
  }

  const stake = () => {
    setPhase('signing')
    window.setTimeout(() => setPhase('sending'), 1100)
    window.setTimeout(() => {
      setPhase('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 2300)
  }

  return (
    <section className="application-region stake-region">
      <h2>{phase === 'done' ? '¡Lugar confirmado!' : 'Stake para asistir'}</h2>
      <p className="application-lead">
        {phase === 'done'
          ? <>Tu stake quedó bloqueado en el contrato del evento. Nos vemos en <b>{eventName}</b>.</>
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
            <div><dt>CONTRATO</dt><dd className="mono-ellipsis">CDLZ…X7QH · Soroban</dd></div>
            <div><dt>REEMBOLSO</dt><dd>Al hacer check-in y enviar tu proyecto</dd></div>
          </dl>

          <ul className="track-rules">
            {stakeRules.map((rule) => (
              <li key={rule.text}><span className={rule.ok ? 'rule-dot ok' : 'rule-dot no'} aria-hidden="true">{rule.ok ? '✓' : '×'}</span>{rule.text}</li>
            ))}
          </ul>
        </>
      )}

      {(phase === 'connect' || phase === 'connecting') && (
        <div className="app-field">
          <span className="app-label">Elige tu wallet de Stellar</span>
          <span className="app-hint">Conectaremos tu cuenta para firmar el stake. No movemos fondos sin tu firma.</span>
          <div className="wallet-grid">
            {wallets.map((w) => (
              <button
                type="button"
                key={w.id}
                className={wallet === w.id && phase === 'connecting' ? 'wallet-card is-loading' : 'wallet-card'}
                disabled={phase === 'connecting'}
                onClick={() => connect(w.id)}
              >
                <span className="wallet-logo" aria-hidden="true">{w.id[0]}</span>
                <span className="track-text">
                  <strong>{w.id}</strong>
                  <span>{wallet === w.id && phase === 'connecting' ? 'Conectando…' : w.note}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'ready' || phase === 'signing' || phase === 'sending') && (
        <>
          <div className="wallet-connected">
            <span className="wallet-logo" aria-hidden="true">{wallet[0]}</span>
            <span className="track-text">
              <strong>{wallet} conectada</strong>
              <span className="mono-ellipsis" title={demoWallet.address}>{demoWallet.short} · Saldo {balance} {asset}</span>
            </span>
            <button type="button" className="link-button" disabled={phase !== 'ready'} onClick={() => setPhase('connect')}>Cambiar</button>
          </div>

          <div className="app-field">
            <span className="app-label">Activo para el stake</span>
            <div className="chip-picker">
              {(Object.keys(stakeAmounts) as Asset[]).map((a) => (
                <button
                  type="button"
                  key={a}
                  className={asset === a ? 'chip is-active' : 'chip'}
                  aria-pressed={asset === a}
                  disabled={phase !== 'ready'}
                  onClick={() => setAsset(a)}
                >
                  {stakeAmounts[a].amount} {a}
                </button>
              ))}
            </div>
          </div>

          {phase === 'ready'
            ? <div className="form-alert is-ready">✓ Saldo suficiente — se bloquearán {amount} {asset} hasta el final del evento</div>
            : <div className="form-alert is-warning stake-progress">
                <span className="spinner" aria-hidden="true" />
                {phase === 'signing' ? `Esperando tu firma en ${wallet}…` : 'Enviando transacción a la red Stellar…'}
              </div>}

          <div className="application-actions">
            <button type="button" className="btn-ghost" disabled={phase !== 'ready'} onClick={() => setPhase('connect')}>Anterior</button>
            <button type="button" className="btn-primary" disabled={phase !== 'ready'} onClick={stake}>
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
            <div><dt>WALLET</dt><dd>{wallet} · {demoWallet.short}</dd></div>
            <div><dt>TRANSACCIÓN</dt><dd className="mono-ellipsis" title={demoTx}>{demoTx.slice(0, 10)}…{demoTx.slice(-6)}</dd></div>
            <div><dt>ESTADO</dt><dd className="status-ok">CONFIRMADO · REEMBOLSABLE</dd></div>
          </dl>

          <div className="application-actions">
            <button type="button" className="btn-ghost" onClick={() => setPhase('connect')}>Ver de nuevo</button>
            <button type="button" className="btn-primary" onClick={onFinish}>Volver a hackathons</button>
          </div>
        </>
      )}
    </section>
  )
}
