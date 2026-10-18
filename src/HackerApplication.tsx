import { useState, type FormEvent, type ReactNode } from 'react'
import './HackerApplication.css'

type Track = 'scratch' | 'existing'

const trackOptions: { id: Track; title: string; description: string }[] = [
  { id: 'scratch', title: 'Start from Scratch', description: 'Start from scratch and build a new project from the ground up.' },
  { id: 'existing', title: 'Hack on Existing Project', description: 'Hack on an existing project that has been submitted to the hackathon.' },
]

const trackRules = [
  { ok: true, text: 'Each track has its own prizes and you will only be eligible for track specific prizes' },
  { ok: false, text: 'You can only select one track and will not be allowed to switch tracks' },
  { ok: true, text: 'You are allowed to add features to existing projects/codebases as long as the new changes are open-source' },
]

const motivationOptions = ['Win prizes', 'Learn new skills', 'Meet builders', 'Find a co-founder', 'Get hired', 'Launch a startup']
const languageOptions = ['HTML/CSS', 'Python', 'Node.js', 'TypeScript', 'Rust', 'Solidity', 'Go', 'Java']
const areaOptions = ['DeFi', 'Payments', 'Smart Contracts', 'AI Agents', 'Identity', 'Gaming', 'Infrastructure', 'Public Goods']
const describeOptions = ['Frontend Developer', 'Backend Developer', 'Full-stack Developer', 'Designer', 'Product Manager', 'Student']
const ethereumLevels = ["I'm new to Ethereum", 'I have built a few dApps', 'I ship to mainnet regularly']
const teamOptions = ['Hacking Solo', 'With a team', 'Looking for a team']

const demoProfile = {
  track: 'scratch' as Track,
  web2: 'Full-stack developer from Bolivia. I built a ticketing platform for university events (React + Node.js, 4k users) and a small inventory system for local shops with Python and PostgreSQL.',
  building: 'A cross-border payments dApp on Stellar: freelancers in LATAM get paid in USDC and cash out to local currency. I want to learn Soroban smart contracts and wallet UX.',
  motivations: ['Learn new skills', 'Meet builders'],
  years: '2',
  ethLevel: ethereumLevels[0],
  languages: ['HTML/CSS', 'Python', 'Node.js', 'TypeScript'],
  areas: ['Payments', 'Smart Contracts'],
  describe: describeOptions[2],
  team: teamOptions[0],
  resume: 'Jhamil_CV_2026.pdf',
  under18: false,
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
    ? 'Please select a hackathon track to continue your application'
    : !form.conduct || !form.privacy
      ? 'Please accept the code of conduct and privacy policy'
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
        <h2>Application submitted</h2>
        <p className="application-lead">
          Thanks, Jhamil! Your hacker application for <b>{eventName}</b> is under review.
          Once accepted you will need to stake to confirm your spot.
        </p>
        <dl className="done-summary">
          <div><dt>TRACK</dt><dd>{trackOptions.find((t) => t.id === form.track)?.title}</dd></div>
          <div><dt>TEAM</dt><dd>{form.team}</dd></div>
          <div><dt>LANGUAGES</dt><dd>{form.languages.join(', ') || '—'}</dd></div>
          <div><dt>STATUS</dt><dd className="status-pending">PENDING REVIEW</dd></div>
        </dl>
        <div className="application-actions">
          <button type="button" className="btn-ghost" onClick={() => setSubmitted(false)}>Edit application</button>
          <button type="button" className="btn-primary" onClick={onBack}>Back to roles</button>
        </div>
      </section>
    )
  }

  return (
    <form className="application-region" onSubmit={handleSubmit}>
      <h2>Hacker Application</h2>
      <p className="application-lead">
        After your application has been accepted, you will need to stake to attend the event.
        Any teammates you plan to work with will also need to apply individually.
      </p>
      <div className="demo-note">DEMO DATA PRE-FILLED — EDIT ANY FIELD OR SUBMIT DIRECTLY.</div>

      <Field label="Hackathon Track *" hint="Please select the track you'd like to participate in. You will not be able to switch tracks after you've selected one.">
        <div className="track-grid" role="radiogroup" aria-label="Hackathon track">
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

      <Field label="Tell us about your background in Web2" hint="What have you worked on outside of crypto that you're particularly proud of?">
        <textarea rows={4} value={form.web2} onChange={(e) => set('web2', e.target.value)} />
      </Field>

      <Field label="What will you be developing/building at the event?" hint="What about Web3 is interesting to you and what would you like to build at the hackathon?">
        <textarea rows={4} value={form.building} onChange={(e) => set('building', e.target.value)} />
      </Field>

      <Field label="Which of these are motivating you to apply to the event?">
        <ChipPicker options={motivationOptions} value={form.motivations} onChange={(v) => set('motivations', v)} />
      </Field>

      <div className="field-pair">
        <Field label="Years of Coding Experience">
          <select value={form.years} onChange={(e) => set('years', e.target.value)}>
            {['<1', '1', '2', '3', '4', '5+'].map((y) => <option key={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Ethereum Experience Level">
          <select value={form.ethLevel} onChange={(e) => set('ethLevel', e.target.value)}>
            {ethereumLevels.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Which programming languages do you have experience with?" hint="Select all that are applicable.">
        <ChipPicker options={languageOptions} value={form.languages} onChange={(v) => set('languages', v)} />
      </Field>

      <Field label="Which of these particular areas are you interested in going into this event?">
        <ChipPicker options={areaOptions} value={form.areas} onChange={(v) => set('areas', v)} />
      </Field>

      <div className="field-pair">
        <Field label="How would you describe yourself?">
          <select value={form.describe} onChange={(e) => set('describe', e.target.value)}>
            {describeOptions.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Do you plan on hacking solo or with a team?">
          <select value={form.team} onChange={(e) => set('team', e.target.value)}>
            {teamOptions.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Resume / CV">
        <label className="upload-box">
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) set('resume', file.name) }}
          />
          {form.resume ? (
            <span className="upload-file">
              <span className="file-tag">PDF</span>
              <span><b>{form.resume}</b><small>Uploaded · click to replace</small></span>
            </span>
          ) : (
            <span className="upload-empty"><b>Click to upload</b> or drag and drop<small>Accepted file types: .pdf, .doc, .docx, images</small></span>
          )}
        </label>
      </Field>

      <div className="check-list">
        <label className="check-row">
          <input type="checkbox" checked={form.under18} onChange={(e) => set('under18', e.target.checked)} />
          <span><b>Yes, I will be under 18 years old on the event date</b><small>Don't worry, we just need a waiver signed by a parent/guardian.</small></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.firstEvent} onChange={(e) => set('firstEvent', e.target.checked)} />
          <span><b>Yes, this is the first Stellar Apex hackathon I'm attending</b></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.conduct} onChange={(e) => set('conduct', e.target.checked)} />
          <span><b>I agree to the code of conduct</b><small>I confirm that I have read and agreed to the <a href="#documentation">"Code of conduct" &amp; "Rules and conditions"</a> of the competition.</small></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.privacy} onChange={(e) => set('privacy', e.target.checked)} />
          <span><b>I agree to the privacy policy</b><small>I confirm that I have read and agreed to the <a href="#privacy">"Privacy Policy"</a>.</small></span>
        </label>
      </div>

      {missing
        ? <div className="form-alert is-warning">⚠ {missing}</div>
        : <div className="form-alert is-ready">✓ Everything looks good — ready to submit</div>}

      <div className="application-actions">
        <button type="button" className="btn-ghost" onClick={onBack}>Previous</button>
        <button type="submit" className="btn-primary" disabled={Boolean(missing)}>Submit</button>
      </div>
    </form>
  )
}
