import { useState, type ReactNode } from 'react'
import './App.css'

type IconName =
  | 'home'
  | 'folder'
  | 'person'
  | 'trophy'
  | 'document'
  | 'timer'
  | 'cap'
  | 'board'
  | 'check'
  | 'arrow'

type Hackathon = {
  name: string
  location: string
  mode: 'online' | 'in person'
  prize: string
  stage: 'SUBMISSION OPEN' | 'JUDGING' | 'JUDGING CLOSED'
  closes: string
  openNow?: boolean
  entries: number
}

const hackathons: Hackathon[] = [
  { name: 'BB101 - DEMO/PITCH FINAL(MX)', location: '—', mode: 'online', prize: '$0.00', stage: 'SUBMISSION OPEN', closes: 'Oct 20, 2026', openNow: true, entries: 0 },
  { name: 'BB101 - DEMO/PITCH FINAL(CO)', location: '—', mode: 'online', prize: '$0.00', stage: 'SUBMISSION OPEN', closes: 'Oct 20, 2026', openNow: true, entries: 6 },
  { name: 'Bootcamp Tesh', location: 'MEXICO', mode: 'in person', prize: '$30.00', stage: 'SUBMISSION OPEN', closes: 'Oct 18, 2026', openNow: true, entries: 7 },
  { name: 'Ideathon Bolivia 2026', location: '—', mode: 'online', prize: '$600.00', stage: 'SUBMISSION OPEN', closes: 'Oct 18, 2026', openNow: true, entries: 10 },
  { name: 'NEA TECH 2026', location: 'Corrientes, Argentina', mode: 'in person', prize: '$1,000.00', stage: 'JUDGING', closes: 'Oct 17, 2026', entries: 6 },
  { name: 'Argentina Builder Challenge', location: '—', mode: 'online', prize: '$0.00', stage: 'JUDGING CLOSED', closes: 'Sep 28, 2026', entries: 20 },
  { name: 'GOYA HACK', location: 'CDMX, UNAM Facultad de Ingeniería', mode: 'in person', prize: '$330.00', stage: 'JUDGING CLOSED', closes: 'Sep 28, 2026', entries: 26 },
]

function LineIcon({ name }: { name: IconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.35,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  const paths: Record<IconName, ReactNode> = {
    home: <><path {...common} d="M3 10.2 12 3l9 7.2"/><path {...common} d="M5.5 9.2V21h13V9.2M9.2 21v-7h5.6v7"/></>,
    folder: <path {...common} d="M2.5 7h7l2-2h10v15h-19z"/>,
    person: <><circle {...common} cx="12" cy="6" r="2.2"/><path {...common} d="M9.5 10h5v11h-5zM7 11.5v5M17 11.5v5M12 10v11"/></>,
    trophy: <><path {...common} d="M7 4h10v5c0 3-2.2 5-5 5S7 12 7 9zM9.5 14v3h5v-3M7.5 20h9"/><path {...common} d="M7 6H3.5v2c0 2 1.2 3 3.7 3M17 6h3.5v2c0 2-1.2 3-3.7 3"/></>,
    document: <><path {...common} d="M5 2.5h10l4 4V21.5H5z"/><path {...common} d="M15 2.5v4h4M8 11h8M8 14h8M8 17h6"/></>,
    timer: <><circle {...common} cx="12" cy="13" r="7.5"/><path {...common} d="M12 13V8.5M9 2.5h6M17.5 6.5l1.5-1.5"/></>,
    cap: <><path {...common} d="m2.5 9.5 9.5-5 9.5 5-9.5 5z"/><path {...common} d="M6.5 11.8v4.5c3.5 2.5 7.5 2.5 11 0v-4.5M21.5 9.5v6"/></>,
    board: <><path {...common} d="M4 5h16v11H4zM2 5h20M8 20l4-4 4 4M12 2v3"/></>,
    check: <><circle {...common} cx="12" cy="12" r="8.5"/><path {...common} d="m8 12.2 2.6 2.6 5.8-6"/></>,
    arrow: <><path {...common} d="M20 12H5M10 7l-5 5 5 5"/></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Stellar Apex home">
      <span>Stellar Apex</span>
      <span className="brand-mark" aria-hidden="true" />
    </a>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Bounties')
  const [activeTool, setActiveTool] = useState<IconName>('document')
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedHackathon, setSelectedHackathon] = useState<string | null>(null)

  const navItems = ['Instawards', 'Bounties', 'Community', 'Education']
  const primaryTools: IconName[] = ['home', 'folder', 'person', 'trophy', 'document', 'timer']
  const learningTools: IconName[] = ['cap', 'board', 'check']

  return (
    <div className="site-shell" id="top">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button className={activeNav === item ? 'is-active' : ''} key={item} onClick={() => setActiveNav(item)} type="button">
                {item}
              </button>
            ))}
          </nav>
          <div className="profile-wrap">
            <button className="profile-button" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
              <span className="profile-orb" aria-hidden="true">◩</span>
              <span>Jhamil</span>
              <span className="chevron" aria-hidden="true">⌄</span>
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <button type="button">Profile</button>
                <button type="button">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Workspace tools">
          <div className="tool-group">
            {primaryTools.map((tool) => (
              <button type="button" key={tool} className={activeTool === tool ? 'tool-button is-active' : 'tool-button'} onClick={() => setActiveTool(tool)} aria-label={`Open ${tool}`}>
                <LineIcon name={tool} />
              </button>
            ))}
          </div>
          <div className="tool-group tool-group-secondary">
            {learningTools.map((tool) => (
              <button type="button" key={tool} className={activeTool === tool ? 'tool-button is-active' : 'tool-button'} onClick={() => setActiveTool(tool)} aria-label={`Open ${tool}`}>
                <LineIcon name={tool} />
              </button>
            ))}
          </div>
          <button type="button" className="tool-button back-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Go back">
            <LineIcon name="arrow" />
          </button>
        </aside>

        <main className="content-panel">
          <div className="page-title">
            <span className="title-glyph" aria-hidden="true"><i /></span>
            <h1>Hackathons</h1>
          </div>
          <div className="instruction-bar">ENTER A PROJECT YOU ALREADY OWN INTO AN OPEN TRACK.</div>
          <div className="table-region">
            <div className="hackathon-table" role="table" aria-label="Hackathons">
              <div className="table-row table-head" role="row">
                <span role="columnheader">HACKATHON</span>
                <span role="columnheader">MODE</span>
                <span role="columnheader">PRIZE POOL</span>
                <span role="columnheader">STAGE</span>
                <span role="columnheader">SUBMISSIONS CLOSE</span>
                <span role="columnheader">ENTRIES</span>
              </div>
              {hackathons.map((hackathon) => (
                <button
                  type="button"
                  className={selectedHackathon === hackathon.name ? 'table-row data-row is-selected' : 'table-row data-row'}
                  role="row"
                  key={hackathon.name}
                  onClick={() => setSelectedHackathon(hackathon.name)}
                >
                  <span className="hackathon-name" role="cell"><strong>{hackathon.name}</strong><small>{hackathon.location}</small></span>
                  <span role="cell">{hackathon.mode}</span>
                  <span role="cell">{hackathon.prize}</span>
                  <span role="cell"><em className="stage-pill">{hackathon.stage}</em></span>
                  <span className="closing-date" role="cell"><b>{hackathon.closes}</b>{hackathon.openNow && <small>open now</small>}</span>
                  <span role="cell">{hackathon.entries}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      <button className="drift-tab" type="button" aria-label="Open Drift support">DRFT</button>
      <footer className="footer">
        <div className="footer-inner">
          <Brand />
          <nav aria-label="Footer navigation">
            <a href="#documentation">Documentation</a>
            <a href="#community">Community Guidelines</a>
            <a href="#privacy">Privacy Policy</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default App
