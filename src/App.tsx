import { useState, type ReactNode } from 'react'
import './App.css'
import { HackerApplication } from './HackerApplication'
import { Landing } from './Landing'

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
  mode: 'online' | 'presencial'
  prize: string
  stage: 'ENVÍOS ABIERTOS' | 'EN EVALUACIÓN' | 'EVALUACIÓN CERRADA'
  closes: string
  openNow?: boolean
  entries: number
}

type Role = {
  name: 'Hacker' | 'Voluntario' | 'Mentor'
  tone: 'yellow' | 'purple' | 'cyan'
  description: string
}

const roles: Role[] = [
  { name: 'Hacker', tone: 'yellow', description: 'Hackea y envía un proyecto con hasta 5 integrantes para competir por nuestros increíbles premios.' },
  { name: 'Voluntario', tone: 'purple', description: '¡Únete a nuestros hackathons y eventos Pragma! Ayuda con logística, registro, operaciones de evaluación y más para crear una experiencia inolvidable para todos los asistentes.' },
  { name: 'Mentor', tone: 'cyan', description: 'Los mentores técnicos cumplen un rol clave apoyando y acompañando a los hackers que necesitan ayuda.' },
]

const hackathons: Hackathon[] = [
  { name: 'BB101 - DEMO/PITCH FINAL(MX)', location: '—', mode: 'online', prize: '$0.00', stage: 'ENVÍOS ABIERTOS', closes: '20 oct 2026', openNow: true, entries: 0 },
  { name: 'BB101 - DEMO/PITCH FINAL(CO)', location: '—', mode: 'online', prize: '$0.00', stage: 'ENVÍOS ABIERTOS', closes: '20 oct 2026', openNow: true, entries: 6 },
  { name: 'Bootcamp Tesh', location: 'MEXICO', mode: 'presencial', prize: '$30.00', stage: 'ENVÍOS ABIERTOS', closes: '18 oct 2026', openNow: true, entries: 7 },
  { name: 'Ideathon Bolivia 2026', location: '—', mode: 'online', prize: '$600.00', stage: 'ENVÍOS ABIERTOS', closes: '18 oct 2026', openNow: true, entries: 10 },
  { name: 'NEA TECH 2026', location: 'Corrientes, Argentina', mode: 'presencial', prize: '$1,000.00', stage: 'EN EVALUACIÓN', closes: '17 oct 2026', entries: 6 },
  { name: 'Argentina Builder Challenge', location: '—', mode: 'online', prize: '$0.00', stage: 'EVALUACIÓN CERRADA', closes: '28 sep 2026', entries: 20 },
  { name: 'GOYA HACK', location: 'CDMX, UNAM Facultad de Ingeniería', mode: 'presencial', prize: '$330.00', stage: 'EVALUACIÓN CERRADA', closes: '28 sep 2026', entries: 26 },
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

function RoleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.35">
        <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(45 12 12)" />
        <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-45 12 12)" />
        <path d="M12 6.8 15.2 12 12 17.2 8.8 12z" />
      </g>
    </svg>
  )
}

function PageBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="page-back" aria-label={label} onClick={() => { onClick(); window.scrollTo({ top: 0 }) }}>
      <LineIcon name="arrow" />
      <span>{label}</span>
    </button>
  )
}

function HackathonWelcome({ name, onBack }: { name: string; onBack: () => void }) {
  const [selectedRole, setSelectedRole] = useState<Role['name'] | null>(null)

  if (selectedRole === 'Hacker') {
    return (
      <>
        <div className="page-title">
          <span className="title-glyph" aria-hidden="true"><i /></span>
          <h1>{name}</h1>
          <PageBack label="Volver a roles" onClick={() => setSelectedRole(null)} />
        </div>
        <div className="instruction-bar">SOLICITUD DE HACKER — REVISA TUS DATOS Y ENVÍA.</div>
        <HackerApplication eventName={name} onBack={() => setSelectedRole(null)} />
      </>
    )
  }

  return (
    <>
      <div className="page-title">
        <span className="title-glyph" aria-hidden="true"><i /></span>
        <h1>{name}</h1>
        <PageBack label="Volver a hackathons" onClick={onBack} />
      </div>
      <div className="instruction-bar">ELIGE TU ROL PREFERIDO PARA ESTE EVENTO.</div>
      <section className="welcome-region" aria-labelledby="welcome-title">
        <h2 id="welcome-title">¡Bienvenido!</h2>
        <p className="welcome-lead">Elige tu rol preferido para este evento.</p>
        <div className="role-list">
          {roles.map((role) => (
            <button
              type="button"
              key={role.name}
              className={selectedRole === role.name ? 'role-card is-selected' : 'role-card'}
              aria-pressed={selectedRole === role.name}
              onClick={() => {
                setSelectedRole(role.name)
                if (role.name === 'Hacker') window.scrollTo({ top: 0 })
              }}
            >
              <span className={`role-icon role-icon-${role.tone}`}><RoleIcon /></span>
              <strong>{role.name}</strong>
              <span className="role-description">{role.description}</span>
            </button>
          ))}
        </div>
        <button type="button" className="welcome-back" onClick={onBack}>← VOLVER A HACKATHONS</button>
      </section>
    </>
  )
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Inicio de Stellar Apex">
      <span>Stellar Apex</span>
      <span className="brand-mark" aria-hidden="true" />
    </a>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Recompensas')
  const [activeTool, setActiveTool] = useState<IconName>('document')
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedHackathon, setSelectedHackathon] = useState<string | null>(null)
  const [showLanding, setShowLanding] = useState(true)

  const navItems = ['Instawards', 'Recompensas', 'Comunidad', 'Educación']
  const primaryTools: IconName[] = ['home', 'folder', 'person', 'trophy', 'document', 'timer']
  const learningTools: IconName[] = ['cap', 'board', 'check']

  const toggleLanding = (next: boolean) => {
    setShowLanding(next)
    setProfileOpen(false)
    window.scrollTo({ top: 0 })
  }

  if (showLanding) return <Landing onEnter={() => toggleLanding(false)} />

  return (
    <div className="site-shell" id="top">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <nav className="main-nav" aria-label="Navegación principal">
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
                <button type="button" onClick={() => toggleLanding(true)}>Ver presentación</button>
                <button type="button">Perfil</button>
                <button type="button">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Herramientas">
          <div className="tool-group">
            {primaryTools.map((tool) => (
              <button type="button" key={tool} className={activeTool === tool ? 'tool-button is-active' : 'tool-button'} onClick={() => setActiveTool(tool)} aria-label={`Abrir ${tool}`}>
                <LineIcon name={tool} />
              </button>
            ))}
          </div>
          <div className="tool-group tool-group-secondary">
            {learningTools.map((tool) => (
              <button type="button" key={tool} className={activeTool === tool ? 'tool-button is-active' : 'tool-button'} onClick={() => setActiveTool(tool)} aria-label={`Abrir ${tool}`}>
                <LineIcon name={tool} />
              </button>
            ))}
          </div>
          <button type="button" className="tool-button back-button" onClick={() => (selectedHackathon ? setSelectedHackathon(null) : toggleLanding(true))} aria-label={selectedHackathon ? 'Volver a hackathons' : 'Volver a la presentación'}>
            <LineIcon name="arrow" />
          </button>
        </aside>

        <main className="content-panel">
          {selectedHackathon ? (
            <HackathonWelcome name={selectedHackathon} onBack={() => setSelectedHackathon(null)} />
          ) : (<>
          <div className="page-title">
            <span className="title-glyph" aria-hidden="true"><i /></span>
            <h1>Hackathons</h1>
            <PageBack label="Volver a la presentación" onClick={() => toggleLanding(true)} />
          </div>
          <div className="instruction-bar">INSCRIBE UN PROYECTO TUYO EN UN TRACK ABIERTO.</div>
          <div className="table-region">
            <div className="hackathon-table" role="table" aria-label="Hackathons">
              <div className="table-row table-head" role="row">
                <span role="columnheader">HACKATHON</span>
                <span role="columnheader">MODALIDAD</span>
                <span role="columnheader">PREMIOS</span>
                <span role="columnheader">ETAPA</span>
                <span role="columnheader">CIERRE DE ENVÍOS</span>
                <span role="columnheader">PROYECTOS</span>
              </div>
              {hackathons.map((hackathon) => (
                <button
                  type="button"
                  className="table-row data-row"
                  role="row"
                  key={hackathon.name}
                  onClick={() => {
                    setSelectedHackathon(hackathon.name)
                    window.scrollTo({ top: 0 })
                  }}
                >
                  <span className="hackathon-name" role="cell"><strong>{hackathon.name}</strong><small>{hackathon.location}</small></span>
                  <span role="cell">{hackathon.mode}</span>
                  <span role="cell">{hackathon.prize}</span>
                  <span role="cell"><em className="stage-pill">{hackathon.stage}</em></span>
                  <span className="closing-date" role="cell"><b>{hackathon.closes}</b>{hackathon.openNow && <small>abierto ahora</small>}</span>
                  <span role="cell">{hackathon.entries}</span>
                </button>
              ))}
            </div>
          </div>
          </>)}
        </main>
      </div>

      <button className="drift-tab" type="button" aria-label="Abrir soporte Drift">DRFT</button>
      <footer className="footer">
        <div className="footer-inner">
          <Brand />
          <nav aria-label="Navegación del pie de página">
            <a href="#documentation">Documentación</a>
            <a href="#community">Normas de la comunidad</a>
            <a href="#privacy">Política de privacidad</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default App
