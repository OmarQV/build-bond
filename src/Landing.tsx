import './Landing.css'

const stats = [
  { value: '20', unit: 'USDC', label: 'Depósito de referencia por hacker' },
  { value: '100', unit: '%', label: 'Devuelto al entregar un proyecto válido' },
  { value: '0', unit: 'USD', label: 'Comisión al participante' },
  { value: '0', unit: '%', label: 'Intereses: no es una inversión' },
]

const journey = [
  { title: 'Postula', text: 'Explora hackathons en APEX, elige tu rol y envía tu solicitud. Postular no cuesta nada.' },
  { title: 'Aprende', text: 'Conecta tu primera wallet, distingue XLM de USDC y presupuesta depósito, comisiones y saldo libre.' },
  { title: 'Activa tu Build Bond', text: 'Ya aceptado, firmas un depósito en un contrato Soroban. Así confirmas tu lugar.' },
  { title: 'Construye y entrega', text: 'Formas equipo, desarrollas tu proyecto y lo envías antes del cierre. No necesitas ganar.' },
  { title: 'Recupera', text: 'Un validador confirma la entrega y el contrato te habilita el reclamo del 100% del depósito.' },
]

const bondSteps = [
  { tag: 'EVENTO A', title: 'Deposita 20 USDC', note: 'No entrega → queda congelado a su nombre', dots: 1, available: 0, frozen: 20 },
  { tag: 'EVENTO B', title: 'Deposita otros 20', note: 'Vincula el bond congelado de A', dots: 2, available: 0, frozen: 20 },
  { tag: 'ENTREGA', title: 'Proyecto validado', note: 'Se habilitan B y el bond vinculado de A', dots: 3, available: 40, frozen: 0 },
  { tag: 'RECLAMO', title: 'Recupera 40 USDC', note: 'Vuelven a su wallet. Sin multas ni descuentos', dots: 4, available: 40, frozen: 0 },
]

const stellarPoints = [
  {
    title: 'XLM y USDC reales',
    text: 'El hacker practica con activos de Stellar: verifica red, código y emisor antes de mover un solo centavo.',
    art: 'coins',
  },
  {
    title: 'Contrato Soroban',
    text: 'El depósito, el congelamiento y el reclamo son reglas programadas. Nadie puede usar ese dinero para otra cosa.',
    art: 'contract',
  },
  {
    title: 'Verificable por cualquiera',
    text: 'Cada depósito y devolución es una transacción pública en la red. El saldo del contrato se puede auditar.',
    art: 'grid',
  },
]

const lessons = ['Wallet y acceso', 'XLM vs USDC', 'Comprar o recibir', 'Presupuestar', 'Comprometer', 'Recuperar', 'Siguiente meta']

const buyers = [
  { who: 'Comunidades y universidades', what: 'Operan su evento: inscripciones, bonds, entregas y reportes.' },
  { who: 'Organizadores recurrentes', what: 'Licencia con varios eventos y recuperación entre ediciones.' },
  { who: 'Patrocinadores', what: 'Financian becas y cohortes educativas con resultados medibles.' },
  { who: 'Plataformas como APEX', what: 'Integran el módulo de hackathons a su producto.' },
]

const faqs = [
  { q: '¿De dónde sale la devolución?', a: 'Del depósito de esa misma persona, guardado en el contrato. Nunca del dinero de nuevos participantes.' },
  { q: '¿Qué pasa si no entrego?', a: 'Tu depósito queda congelado y sigue siendo tuyo. Lo recuperas al completar otro evento compatible con un nuevo depósito.' },
  { q: '¿Y si no puedo pagar el depósito?', a: 'La propuesta incluye becas financiadas por patrocinadores con dinero nuevo, nunca con depósitos congelados de otros.' },
  { q: '¿Quién decide si cumplí?', a: 'Un validador autorizado, con un checklist público, un motivo escrito y derecho a apelación. El contrato ejecuta su decisión.' },
  { q: '¿Es staking? ¿Genera intereses?', a: 'No. Stellar usa SCP y bloquear fondos aquí no produce recompensas. Es un depósito de compromiso: recuperas las mismas unidades.' },
  { q: '¿Es un producto oficial de APEX?', a: 'Todavía no. Es una propuesta para la Ideatón Stellar Bolivia 2026. La integración y el acuerdo con APEX están pendientes.' },
]

function HeroArt() {
  const ticks = Array.from({ length: 31 }, (_, i) => {
    const angle = Math.PI + (i / 30) * Math.PI
    const long = i % 5 === 0
    const r1 = 176
    const r2 = long ? 162 : 168
    return (
      <line
        key={i}
        x1={200 + r1 * Math.cos(angle)}
        y1={250 + r1 * Math.sin(angle)}
        x2={200 + r2 * Math.cos(angle)}
        y2={250 + r2 * Math.sin(angle)}
        stroke="#0f0f0f"
        strokeWidth={long ? 1.6 : 0.9}
      />
    )
  })

  return (
    <svg className="hero-art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="400" height="250" fill="var(--lx-yellow)" />
      {[330, 290, 255].map((r) => <circle key={r} cx="200" cy="250" r={r} fill="none" stroke="#fffaf0" strokeWidth="0.8" />)}
      <circle cx="200" cy="250" r="185" fill="var(--lx-cream)" />
      {ticks}
      <circle className="hero-ring" cx="200" cy="250" r="118" fill="none" stroke="#0f0f0f" strokeWidth="1.1" strokeDasharray="3 4" />
      <circle cx="200" cy="250" r="106" fill="var(--lx-yellow)" />
      <line x1="200" y1="65" x2="200" y2="250" stroke="#fffaf0" strokeWidth="0.8" />
      <line x1="120" y1="180" x2="200" y2="250" stroke="#fffaf0" strokeWidth="0.8" />
    </svg>
  )
}

function ProblemArt() {
  return (
    <svg className="problem-art" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="600" height="220" fill="var(--lx-purple)" />
      {[[140, 260, 230], [250, 300, 150], [420, 80, 140], [380, 50, 50], [220, 200, 50]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#e9e3ff" strokeWidth="0.9" />
      ))}
      <path d="M180 80 Q260 70 330 140 Q380 200 360 260 L250 260 Q200 170 180 80Z" fill="#0f0f0f" />
      <line x1="0" y1="50" x2="110" y2="50" stroke="#e9e3ff" strokeWidth="0.9" />
      {[[60, 50], [383, 138], [270, 186]].map(([cx, cy], i) => (
        <g key={i}><circle cx={cx} cy={cy} r="9" fill="#fff" /><circle cx={cx} cy={cy} r="4.5" fill="var(--lx-yellow)" /></g>
      ))}
    </svg>
  )
}

function Diamond({ filled, vertical }: { filled: number; vertical: boolean }) {
  const dots: [number, number][] = [[60, 34], [86, 60], [60, 86], [34, 60]]
  return (
    <svg className="diamond" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--lx-purple)" strokeWidth="0.7" />
      {vertical ? (
        <>
          <path d="M34 15A52 52 0 0 1 86 15" fill="none" stroke="#d9d9d9" strokeWidth="3" />
          <path d="M86 105A52 52 0 0 1 34 105" fill="none" stroke="#d9d9d9" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M15 86A52 52 0 0 1 15 34" fill="none" stroke="#d9d9d9" strokeWidth="3" />
          <path d="M105 34A52 52 0 0 1 105 86" fill="none" stroke="#d9d9d9" strokeWidth="3" />
        </>
      )}
      <path d="M60 18 102 60 60 102 18 60Z" fill="none" stroke="var(--lx-purple)" strokeWidth="0.9" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8" fill={i < filled ? 'var(--lx-purple)' : 'none'} stroke={i < filled ? 'none' : '#d9d9d9'} strokeWidth="1" />
      ))}
    </svg>
  )
}

function StellarArt({ kind }: { kind: string }) {
  if (kind === 'coins') {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <rect width="120" height="120" fill="#0f0f0f" />
        <path d="M0 120 120 0" stroke="var(--lx-yellow)" strokeWidth="0.8" />
        <circle cx="38" cy="30" r="44" fill="var(--lx-cyan)" />
        <circle cx="96" cy="100" r="44" fill="var(--lx-cyan)" />
        <circle cx="60" cy="54" r="30" fill="none" stroke="#fffaf0" strokeWidth="1" />
        <circle cx="60" cy="54" r="5" fill="#fffaf0" />
      </svg>
    )
  }
  if (kind === 'contract') {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <rect width="120" height="120" fill="#0f0f0f" />
        <circle cx="10" cy="60" r="48" fill="var(--lx-yellow)" />
        <circle cx="10" cy="60" r="34" fill="none" stroke="#0f0f0f" strokeWidth="1" />
        <path d="M58 22q22 38 0 76q-22-38 0-76Z" fill="var(--lx-cyan)" />
        <circle cx="104" cy="60" r="44" fill="none" stroke="var(--lx-yellow)" strokeWidth="0.8" />
        <circle cx="104" cy="60" r="18" fill="none" stroke="var(--lx-yellow)" strokeWidth="0.8" />
        <circle cx="62" cy="60" r="7" fill="#fffaf0" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect width="120" height="120" fill="#0f0f0f" />
      {[40, 80].map((p) => <g key={p}><line x1={p} y1="0" x2={p} y2="120" stroke="var(--lx-yellow)" strokeWidth="0.8" /><line x1="0" y1={p} x2="120" y2={p} stroke="var(--lx-yellow)" strokeWidth="0.8" /></g>)}
      <rect x="40" y="0" width="40" height="40" fill="var(--lx-cyan)" />
      <circle cx="100" cy="60" r="14" fill="none" stroke="var(--lx-yellow)" strokeWidth="5" />
      <circle cx="100" cy="60" r="4" fill="var(--lx-cyan)" />
      <circle cx="20" cy="104" r="20" fill="#fffaf0" />
      <circle cx="20" cy="104" r="4" fill="var(--lx-cyan)" />
      <path d="M20 104V60h76" fill="none" stroke="var(--lx-cyan)" strokeWidth="1" />
    </svg>
  )
}

export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="landing" id="inicio">
      <header className="lx-topbar">
        <div className="lx-frame lx-topbar-inner">
          <a className="lx-brand" href="#inicio">Build Bond <span className="lx-brand-mark" aria-hidden="true" /></a>
          <nav className="lx-nav" aria-label="Secciones">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#segunda-oportunidad">Segunda oportunidad</a>
            <a href="#stellar">Stellar</a>
            <a href="#negocio">Negocio</a>
          </nav>
          <button type="button" className="lx-cta-small" onClick={onEnter}>Probar demo</button>
        </div>
      </header>

      <main>
        <section className="lx-frame lx-hero" aria-labelledby="hero-title">
          <div className="lx-hero-art"><HeroArt /></div>
          <div className="lx-hero-rail" aria-hidden="true"><i /><i /><i className="is-on" /></div>
          <div className="lx-hero-copy">
            <span className="lx-kicker"><b /> IDEATÓN STELLAR BOLIVIA 2026 · TRACK 1 · FINANZAS PARA TODOS</span>
            <h1 id="hero-title">
              <span className="lx-outline">BUILD</span>
              <span className="lx-solid">BOND</span>
            </h1>
            <p className="lx-tagline">Deposita. Participa. Construye. Recupera.</p>
          </div>
        </section>

        <section className="lx-frame lx-intro">
          <p className="lx-lead">
            Build Bond convierte la participación en hackathons en una <mark>primera experiencia financiera en Stellar</mark>.
            Aprendes a adquirir XLM o USDC, separas un monto para tu compromiso y lo recuperas al entregar tu proyecto.
            Si no terminas, conservas una segunda oportunidad.
          </p>
          <div className="lx-intro-actions">
            <button type="button" className="lx-btn" onClick={onEnter}>Ver el flujo en vivo</button>
            <a className="lx-link" href="#como-funciona">Cómo funciona ↓</a>
          </div>
        </section>

        <section className="lx-frame lx-stats" aria-label="Cifras clave">
          {stats.map((s) => (
            <div key={s.label} className="lx-stat">
              <strong>{s.value}<small>{s.unit}</small></strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        <section className="lx-frame lx-problem" aria-labelledby="problem-title">
          <div className="lx-section-tag">PROBLEMA</div>
          <div className="lx-problem-copy">
            <h2 id="problem-title">Inscribirse es fácil. <span>Terminar y aprender a manejar dinero digital, no.</span></h2>
            <div className="lx-problem-grid">
              <article>
                <span className="lx-chip">PARA EL HACKER</span>
                <p>Crear una wallet, elegir la red correcta, adquirir un activo y distinguir saldo disponible de dinero comprometido es difícil para un principiante.</p>
              </article>
              <article>
                <span className="lx-chip">PARA EL ORGANIZADOR</span>
                <p>La lista de inscritos no coincide con quienes participan y entregan. Eso complica asignar mentorías, cupos y presupuesto.</p>
              </article>
            </div>
            <p className="lx-footnote">Hipótesis en validación con entrevistas a participantes y organizadores.</p>
          </div>
          <div className="lx-problem-art"><ProblemArt /></div>
        </section>

        <section className="lx-frame lx-steps" id="como-funciona" aria-labelledby="steps-title">
          <div className="lx-side-label">CÓMO FUNCIONA</div>
          <div className="lx-steps-body">
            <h2 id="steps-title" className="lx-ghost">RECORRIDO</h2>
            <ol>
              {journey.map((step, index) => (
                <li key={step.title}>
                  <span className="lx-step-num">{index + 1}.</span>
                  <span className="lx-step-title"><i aria-hidden="true">=</i>{step.title.toUpperCase()}</span>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lx-frame lx-bond" id="segunda-oportunidad" aria-labelledby="bond-title">
          <header className="lx-bond-head">
            <span className="lx-kicker"><b /> EL DIFERENCIAL</span>
            <h2 id="bond-title">Tu dinero tiene <span>segunda oportunidad</span></h2>
            <p>Si no entregas, tu depósito no pasa al organizador: queda <b>congelado y a tu nombre</b>. Participa en otro evento compatible, haz un nuevo depósito, entrega, y recupera ambos.</p>
          </header>
          <div className="lx-bond-cards">
            {bondSteps.map((step, index) => (
              <article key={step.tag} className={index === bondSteps.length - 1 ? 'lx-bond-card is-final' : 'lx-bond-card'}>
                <Diamond filled={step.dots} vertical={index % 2 === 1} />
                <div className="lx-bond-text">
                  <strong>{step.title}</strong>
                  <span>{step.note}</span>
                </div>
                <dl className="lx-ledger">
                  <div><dt>Disponible</dt><dd>{step.available}</dd></div>
                  <div><dt>Congelado</dt><dd>{step.frozen}</dd></div>
                </dl>
                <footer><span>{step.tag}</span><span>0{index + 1}</span></footer>
              </article>
            ))}
          </div>
          <p className="lx-footnote">No hay rentabilidad: se devuelve el principal acumulado de la misma persona. Fallar otra vez no genera multas.</p>
        </section>

        <section className="lx-frame lx-stellar" id="stellar" aria-labelledby="stellar-title">
          <div className="lx-section-tag">POR QUÉ STELLAR</div>
          <h2 id="stellar-title" className="lx-sr-only">Por qué Stellar</h2>
          <div className="lx-stellar-stack">
            {stellarPoints.map((point, index) => (
              <article key={point.title} className={`lx-stellar-card offset-${index}`}>
                <div className="lx-stellar-art"><StellarArt kind={point.art} /></div>
                <div>
                  <i aria-hidden="true" className="lx-dash" />
                  <h3><b>{point.title.split(' ')[0]}</b> {point.title.split(' ').slice(1).join(' ')}</h3>
                  <p>{point.text}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="lx-footnote">Un validador humano decide si la entrega cumple. El contrato aplica el efecto monetario y evita el doble reclamo.</p>
        </section>

        <section className="lx-frame lx-learn" aria-labelledby="learn-title">
          <div className="lx-learn-head">
            <span className="lx-kicker"><b /> EDUCACIÓN FINANCIERA</span>
            <h2 id="learn-title">Aprende para participar</h2>
            <p>El evento es la motivación. El objetivo es que el hacker sepa adquirir, administrar y reservar activos digitales con una meta.</p>
          </div>
          <ol className="lx-lessons">
            {lessons.map((lesson, index) => (
              <li key={lesson}><span>0{index + 1}</span>{lesson}</li>
            ))}
          </ol>
        </section>

        <section className="lx-frame lx-business" id="negocio" aria-labelledby="business-title">
          <div className="lx-business-copy">
            <span className="lx-kicker"><b /> MODELO B2B2C</span>
            <h2 id="business-title">Paga el organizador, <span>no el hacker</span></h2>
            <ul className="lx-buyers">
              {buyers.map((b) => (
                <li key={b.who}><strong>{b.who}</strong><span>{b.what}</span></li>
              ))}
            </ul>
          </div>
          <div className="lx-economics">
            <span className="lx-chip">EVENTO DE 100 CONFIRMADOS · HIPÓTESIS</span>
            <div className="lx-bar" role="img" aria-label="De 300 USD de ingreso, 180 son costos variables y 120 es contribución">
              <span className="cost" style={{ width: '60%' }}>Costos 180</span>
              <span className="margin" style={{ width: '40%' }}>Margen 120</span>
            </div>
            <dl>
              <div><dt>Ingreso por servicio</dt><dd>USD 300</dd></div>
              <div><dt>Margen de contribución</dt><dd>40%</dd></div>
              <div><dt>Depósitos de hackers (2.000 USDC)</dt><dd className="lx-not">No son ingresos</dd></div>
            </dl>
          </div>
        </section>

        <section className="lx-frame lx-faq" aria-labelledby="faq-title">
          <div className="lx-section-tag">PREGUNTAS</div>
          <div className="lx-faq-body">
            <h2 id="faq-title">Reglas claras antes de firmar</h2>
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lx-frame lx-final" aria-labelledby="final-title">
          <div className="lx-final-copy">
            <span className="lx-ghost lx-ghost-big" aria-hidden="true">TESTNET</span>
            <h2 id="final-title">Míralo funcionando</h2>
            <p>Recorre la demo: elige un hackathon, postula como hacker, conecta Freighter y activa tu Build Bond en Stellar Testnet.</p>
            <button type="button" className="lx-btn" onClick={onEnter}>Entrar a la demo →</button>
          </div>
          <svg className="lx-final-art" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--lx-purple)" strokeWidth="0.8" />
            <line x1="8" y1="100" x2="192" y2="100" stroke="var(--lx-purple)" strokeWidth="0.8" />
            <line x1="100" y1="8" x2="100" y2="192" stroke="var(--lx-purple)" strokeWidth="0.8" />
            <line x1="22" y1="54" x2="178" y2="54" stroke="var(--lx-purple)" strokeWidth="0.8" />
            <line x1="22" y1="146" x2="178" y2="146" stroke="var(--lx-purple)" strokeWidth="0.8" />
            <rect x="93" y="93" width="14" height="14" fill="var(--lx-purple)" />
            <circle className="lx-orbit-dot" cx="140" cy="54" r="8" fill="var(--lx-purple)" />
            <circle className="lx-orbit-dot" cx="140" cy="54" r="3.5" fill="#fff" />
          </svg>
        </section>
      </main>

      <footer className="lx-footer">
        <div className="lx-frame lx-footer-inner">
          <a className="lx-brand" href="#inicio">Build Bond <span className="lx-brand-mark" aria-hidden="true" /></a>
          <p>Propuesta para la Ideatón Stellar Bolivia 2026. No es un producto oficial de APEX ni de la Stellar Development Foundation. La demo usa activos de prueba sin valor.</p>
        </div>
      </footer>
    </div>
  )
}
