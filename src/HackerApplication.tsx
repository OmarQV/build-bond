import { useState, type FormEvent, type ReactNode } from 'react'
import './HackerApplication.css'

type Track = 'scratch' | 'existing'

const trackOptions: { id: Track; title: string; description: string }[] = [
  { id: 'scratch', title: 'Empezar desde cero', description: 'Empieza desde cero y construye un proyecto nuevo desde la base.' },
  { id: 'existing', title: 'Proyecto existente', description: 'Trabaja sobre un proyecto existente que ya fue enviado al hackathon.' },
]

const trackRules = [
  { ok: true, text: 'Cada track tiene sus propios premios y solo podrás optar a los premios de tu track' },
  { ok: false, text: 'Solo puedes elegir un track y no podrás cambiarlo después' },
  { ok: true, text: 'Puedes agregar funciones a proyectos/código existentes siempre que los cambios nuevos sean open-source' },
]

const motivationOptions = ['Ganar premios', 'Aprender nuevas habilidades', 'Conocer builders', 'Encontrar co-founder', 'Conseguir empleo', 'Lanzar una startup']
const languageOptions = ['HTML/CSS', 'Python', 'Node.js', 'TypeScript', 'Rust', 'Solidity', 'Go', 'Java']
const areaOptions = ['DeFi', 'Pagos', 'Smart Contracts', 'Agentes de IA', 'Identidad', 'Gaming', 'Infraestructura', 'Bienes públicos']
const describeOptions = ['Desarrollador Frontend', 'Desarrollador Backend', 'Desarrollador Full-stack', 'Diseñador', 'Product Manager', 'Estudiante']
const ethereumLevels = ['Soy nuevo en Ethereum', 'He construido algunas dApps', 'Despliego en mainnet seguido']
const teamOptions = ['Hackeo solo', 'Con un equipo', 'Buscando equipo']

const demoProfile = {
  track: 'scratch' as Track,
  web2: 'Desarrollador full-stack de Bolivia. Construí una plataforma de tickets para eventos universitarios (React + Node.js, 4k usuarios) y un sistema de inventario para tiendas locales con Python y PostgreSQL.',
  building: 'Una dApp de pagos transfronterizos en Stellar: freelancers de LATAM cobran en USDC y retiran en moneda local. Quiero aprender smart contracts con Soroban y UX de wallets.',
  motivations: ['Aprender nuevas habilidades', 'Conocer builders'],
  years: '2',
  ethLevel: ethereumLevels[0],
  languages: ['HTML/CSS', 'Python', 'Node.js', 'TypeScript'],
  areas: ['Pagos', 'Smart Contracts'],
  describe: describeOptions[2],
  team: teamOptions[0],
  firstEvent: true,
  conduct: true,
  privacy: true,
}

function ChipPicker({ options, value, onChange }: { options: string[]; value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="chip-picker">
      {options.map((option) => {
        const active = value.includes(option)
        return (
          <button
            type="button"
            key={option}
            className={active ? 'chip is-active' : 'chip'}
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((item) => item !== option) : [...value, option])}
          >
            {option}{active && <span aria-hidden="true"> ×</span>}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="app-field">
      <span className="app-label">{label}</span>
      {hint && <span className="app-hint">{hint}</span>}
      {children}
    </div>
  )
}

export function HackerApplication({ eventName, onBack }: { eventName: string; onBack: () => void }) {
  const [form, setForm] = useState(demoProfile)
  const [submitted, setSubmitted] = useState(false)
  const set = <K extends keyof typeof demoProfile>(key: K, value: (typeof demoProfile)[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const missing = !form.track
    ? 'Selecciona un track del hackathon para continuar con tu solicitud'
    : !form.conduct || !form.privacy
      ? 'Acepta el código de conducta y la política de privacidad'
      : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!missing) {
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (submitted) {
    return (
      <section className="application-region application-done">
        <span className="done-badge" aria-hidden="true">✓</span>
        <h2>Solicitud enviada</h2>
        <p className="application-lead">
          ¡Gracias, Jhamil! Tu solicitud de hacker para <b>{eventName}</b> está en revisión.
          Cuando sea aceptada tendrás que hacer stake para confirmar tu lugar.
        </p>
        <dl className="done-summary">
          <div><dt>TRACK</dt><dd>{trackOptions.find((t) => t.id === form.track)?.title}</dd></div>
          <div><dt>EQUIPO</dt><dd>{form.team}</dd></div>
          <div><dt>LENGUAJES</dt><dd>{form.languages.join(', ') || '—'}</dd></div>
          <div><dt>ESTADO</dt><dd className="status-pending">EN REVISIÓN</dd></div>
        </dl>
        <div className="application-actions">
          <button type="button" className="btn-ghost" onClick={() => setSubmitted(false)}>Editar solicitud</button>
          <button type="button" className="btn-primary" onClick={onBack}>Volver a roles</button>
        </div>
      </section>
    )
  }

  return (
    <form className="application-region" onSubmit={handleSubmit}>
      <h2>Solicitud de Hacker</h2>
      <p className="application-lead">
        Cuando tu solicitud sea aceptada, tendrás que hacer stake para asistir al evento.
        Los compañeros con los que planeas trabajar también deben postular individualmente.
      </p>
      <div className="demo-note">DATOS DE DEMO PRECARGADOS — EDITA CUALQUIER CAMPO O ENVÍA DIRECTAMENTE.</div>

      <Field label="Track del hackathon *" hint="Selecciona el track en el que quieres participar. No podrás cambiar de track después de elegirlo.">
        <div className="track-grid" role="radiogroup" aria-label="Track del hackathon">
          {trackOptions.map((track) => (
            <button
              type="button"
              role="radio"
              aria-checked={form.track === track.id}
              key={track.id}
              className={form.track === track.id ? 'track-card is-selected' : 'track-card'}
              onClick={() => set('track', track.id)}
            >
              <span className="track-text"><strong>{track.title}</strong><span>{track.description}</span></span>
              <span className="track-radio" aria-hidden="true" />
            </button>
          ))}
        </div>
        <ul className="track-rules">
          {trackRules.map((rule) => (
            <li key={rule.text}><span className={rule.ok ? 'rule-dot ok' : 'rule-dot no'} aria-hidden="true">{rule.ok ? '✓' : '×'}</span>{rule.text}</li>
          ))}
        </ul>
      </Field>

      <Field label="Cuéntanos sobre tu experiencia en Web2" hint="¿En qué has trabajado fuera de cripto de lo que te sientas orgulloso? ¿Qué cosas has construido?">
        <textarea rows={4} value={form.web2} onChange={(e) => set('web2', e.target.value)} />
      </Field>

      <Field label="¿Qué vas a desarrollar/construir en el evento?" hint="¿Qué te interesa de Web3 y qué te gustaría construir en el hackathon?">
        <textarea rows={4} value={form.building} onChange={(e) => set('building', e.target.value)} />
      </Field>

      <Field label="¿Qué te motiva a postular a este evento?">
        <ChipPicker options={motivationOptions} value={form.motivations} onChange={(v) => set('motivations', v)} />
      </Field>

      <div className="field-pair">
        <Field label="Años de experiencia programando">
          <select value={form.years} onChange={(e) => set('years', e.target.value)}>
            {['<1', '1', '2', '3', '4', '5+'].map((y) => <option key={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Nivel de experiencia en Ethereum">
          <select value={form.ethLevel} onChange={(e) => set('ethLevel', e.target.value)}>
            {ethereumLevels.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
      </div>

      <Field label="¿Con qué lenguajes de programación tienes experiencia?" hint="Selecciona todos los que apliquen.">
        <ChipPicker options={languageOptions} value={form.languages} onChange={(v) => set('languages', v)} />
      </Field>

      <Field label="¿Qué áreas te interesan para este evento?">
        <ChipPicker options={areaOptions} value={form.areas} onChange={(v) => set('areas', v)} />
      </Field>

      <div className="field-pair">
        <Field label="¿Cómo te describirías?">
          <select value={form.describe} onChange={(e) => set('describe', e.target.value)}>
            {describeOptions.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="¿Planeas hackear solo o en equipo?">
          <select value={form.team} onChange={(e) => set('team', e.target.value)}>
            {teamOptions.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="check-list">
        <label className="check-row">
          <input type="checkbox" checked={form.firstEvent} onChange={(e) => set('firstEvent', e.target.checked)} />
          <span><b>Sí, este es mi primer hackathon de Stellar Apex</b></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.conduct} onChange={(e) => set('conduct', e.target.checked)} />
          <span><b>Acepto el código de conducta</b><small>Confirmo que leí y acepto el <a href="#documentation">"Código de conducta" y las "Reglas y condiciones"</a> de la competencia.</small></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.privacy} onChange={(e) => set('privacy', e.target.checked)} />
          <span><b>Acepto la política de privacidad</b><small>Confirmo que leí y acepto la <a href="#privacy">"Política de privacidad"</a>.</small></span>
        </label>
      </div>

      {missing
        ? <div className="form-alert is-warning">⚠ {missing}</div>
        : <div className="form-alert is-ready">✓ Todo listo — puedes enviar tu solicitud</div>}

      <div className="application-actions">
        <button type="button" className="btn-ghost" onClick={onBack}>Anterior</button>
        <button type="submit" className="btn-primary" disabled={Boolean(missing)}>Enviar</button>
      </div>
    </form>
  )
}
