import { useGolemStore } from '../../store/useGolemStore'
import {
  CROSS_FRAMEWORK_ALIGNMENTS,
  PATTERN_CATEGORIES,
  PROFILE_PATTERN_MATCHES,
  TIMING_PATTERNS,
} from '../../data/patternsData'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ---- type config ---- */
const TYPE_CONFIG = {
  resonance: { col: '#c9a84c',            bg: 'var(--accent)',  border: 'rgba(201,168,76,.22)', label: 'Resonance' },
  tension:   { col: 'var(--violet2)',      bg: 'rgba(144,80,224,.08)', border: 'rgba(144,80,224,.22)', label: 'Tension' },
  gateway:   { col: '#40ccdd',            bg: 'rgba(64,204,221,.08)', border: 'rgba(64,204,221,.22)', label: 'Gateway' },
  mirror:    { col: 'var(--muted-foreground)', bg: 'rgba(255,255,255,.05)', border: 'var(--muted-foreground)', label: 'Mirror' },
}

const ACTIVATION_CONFIG = {
  active:   { col: '#60b030', bg: 'rgba(96,176,48,.1)',  border: 'rgba(96,176,48,.25)', label: 'ACTIVE' },
  building: { col: '#e09040', bg: 'rgba(224,144,64,.1)', border: 'rgba(224,144,64,.25)', label: 'BUILDING' },
  fading:   { col: 'var(--muted-foreground)', bg: 'var(--secondary)', border: 'rgba(255,255,255,.08)', label: 'FADING' },
}

const FRAMEWORK_LABELS = {
  natal: 'Natal', hd: 'Human Design', kab: 'Kabbalah', num: 'Numerology',
  gk: 'Gene Keys', tr: 'Transits', mayan: 'Mayan', enn: 'Enneagram', chi: 'Chinese',
}

const FRAMEWORK_COLORS = {
  natal: '#f0c040', hd: '#40ccdd', kab: '#aa66ff', num: '#e09040',
  gk: '#c44d7a', tr: '#88aacc', mayan: '#cc3333', enn: '#64ccdd', chi: '#cfd8dc',
}

/* ---- shared styles ---- */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 28,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.18em',
    color: 'var(--foreground)', marginBottom: 4,
  },
  subHeading: {
    fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600, letterSpacing: '.15em',
    textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: 8,
  },
  mono: {
    fontFamily: "'Inconsolata', monospace", fontSize: 12, fontWeight: 500, color: 'var(--foreground)',
  },
  monoSm: {
    fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--muted-foreground)',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
    borderRadius: 8, background: 'var(--secondary)',
    border: '1px solid var(--border)', transition: 'background .2s',
  },
  glass: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 13, padding: 18, backdropFilter: 'blur(12px)',
  },
  badge: (bg, border, color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em',
    textTransform: 'uppercase', background: bg, border: `1px solid ${border}`, color,
  }),
  interpretation: {
    fontSize: 14, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic',
    padding: '14px 18px', borderRadius: 10,
    background: 'var(--accent)', border: '1px solid var(--border)',
  },
}

/* ---- helper: circular progress ring ---- */
function CircularProgress({ value, size = 48, stroke = 3, color = '#c9a84c' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .8s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "'Inconsolata', monospace", fontSize: size * .26, fill: color }}>
        {value}
      </text>
    </svg>
  )
}

/* ---- helper: strength meter ---- */
function StrengthMeter({ value, max = 10, color = '#c9a84c' }) {
  const pct = (value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, width: `${pct}%`,
          background: color, opacity: 0.75, transition: 'width .6s ease',
        }} />
      </div>
      <span style={{ ...S.monoSm, fontSize: 10, minWidth: 22, textAlign: 'right' }}>{value}/{max}</span>
    </div>
  )
}

export default function PatternsDetail() {
  const { people } = useGolemStore()

  // Compute stats
  const totalAlignments = CROSS_FRAMEWORK_ALIGNMENTS.length
  const typeCounts = {}
  CROSS_FRAMEWORK_ALIGNMENTS.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1 })
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
  const avgStrength = (CROSS_FRAMEWORK_ALIGNMENTS.reduce((s, a) => s + a.strength, 0) / totalAlignments).toFixed(1)
  const activeTimingCount = TIMING_PATTERNS.filter((t) => t.activation === 'active').length

  // Group alignments by category
  const byCategory = {}
  PATTERN_CATEGORIES.forEach((cat) => { byCategory[cat.id] = [] })
  CROSS_FRAMEWORK_ALIGNMENTS.forEach((a) => {
    if (byCategory[a.category]) byCategory[a.category].push(a)
  })

  return (
    <div style={S.panel}>

      {/* ═══ HEADER ═══ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u2B21'} Your Pattern Map</div>
          <AboutSystemButton systemName="Patterns" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: 12 }}>
          Cross-framework alignments, synchronicities, and hidden correlations across all your esoteric systems
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={S.badge('var(--accent)', 'rgba(201,168,76,.2)', 'var(--foreground)')}>
            {totalAlignments} alignments detected
          </span>
          <span style={S.badge(
            TYPE_CONFIG[dominantType[0]].bg,
            TYPE_CONFIG[dominantType[0]].border,
            TYPE_CONFIG[dominantType[0]].col,
          )}>
            dominant: {dominantType[0]} ({dominantType[1]})
          </span>
          <span style={S.badge('rgba(96,176,48,.08)', 'rgba(96,176,48,.2)', '#60b030')}>
            avg strength {avgStrength}/10
          </span>
          {activeTimingCount > 0 && (
            <span style={S.badge('rgba(96,176,48,.12)', 'rgba(96,176,48,.3)', '#60b030')}>
              {activeTimingCount} pattern{activeTimingCount > 1 ? 's' : ''} active now
            </span>
          )}
        </div>
      </div>

      {/* ═══ PATTERN SYNTHESIS SUMMARY ═══ */}
      {(() => {
        const activeCount = TIMING_PATTERNS.filter(t => t.activation === 'active').length
        const totalFw = new Set(CROSS_FRAMEWORK_ALIGNMENTS.flatMap(a => a.frameworks)).size
        const sorted = [...CROSS_FRAMEWORK_ALIGNMENTS].sort((a, b) => b.strength - a.strength)
        const top3 = sorted.slice(0, 3)
        const resonances = sorted.filter(a => a.type === 'resonance')
        const tensions = sorted.filter(a => a.type === 'tension')
        const gateways = sorted.filter(a => a.type === 'gateway')
        const mirrors = sorted.filter(a => a.type === 'mirror')
        const avgStrength = sorted.length > 0 ? (sorted.reduce((s, a) => s + a.strength, 0) / sorted.length).toFixed(1) : 0
        const strongCount = sorted.filter(a => a.strength >= 7).length
        const fwFreq = {}
        sorted.forEach(a => (a.frameworks || []).forEach(f => { fwFreq[f] = (fwFreq[f] || 0) + 1 }))
        const topFw = Object.entries(fwFreq).sort((a, b) => b[1] - a[1]).slice(0, 3)
        const dominantType = [['resonance', resonances.length], ['tension', tensions.length], ['gateway', gateways.length], ['mirror', mirrors.length]].sort((a,b) => b[1]-a[1])[0]

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Core Synthesis */}
            <div style={{ padding: '18px 20px', borderRadius: 10, background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.12)' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,.6)', marginBottom: 10 }}>
                Core Pattern Reading
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Something unusual happens when your systems talk to each other. Where most people show scattered signals across frameworks — one system pointing north, another east — yours{' '}
                <span style={{ color: 'var(--gold)' }}>converge</span>.{' '}
                You have <span style={{ color: 'var(--gold)' }}>{CROSS_FRAMEWORK_ALIGNMENTS.length} points where completely independent systems arrive at the same conclusion about who you are</span>.
                {' '}That is not noise. That is architecture.
                <br /><br />
                {strongCount > 0 && <>Of these {CROSS_FRAMEWORK_ALIGNMENTS.length} connections, <span style={{ color: '#60b030' }}>{strongCount} are unusually strong</span> (strength 7 or higher).{' '}This means your frameworks are not just vaguely agreeing — they are <span style={{ color: '#60b030' }}>amplifying each other</span>, which suggests your inner architecture has real coherence.{' '}</>}
                {activeCount > 0 && <>And right now, <span style={{ color: '#60b030' }}>{activeCount} of these pattern{activeCount > 1 ? 's are' : ' is'} active</span> — live windows where the sky, the calendar, and your inner structure are aligned simultaneously.{' '}</>}
                The dominant signature of your pattern map is <span style={{ color: dominantType[0] === 'resonance' ? '#60b030' : dominantType[0] === 'tension' ? '#d44070' : dominantType[0] === 'gateway' ? '#c9a84c' : '#40ccdd' }}>{dominantType[0]}</span>: {dominantType[0] === 'resonance' ? 'your systems reinforce and accelerate each other, creating natural momentum and clarity' : dominantType[0] === 'tension' ? 'your systems create productive friction — they push against each other in ways that force growth and integration' : dominantType[0] === 'gateway' ? 'your systems open doors between different kinds of knowing, allowing you to translate between worlds' : 'your systems mirror each other, showing you the same truth from radically different angles'}.
                {PROFILE_PATTERN_MATCHES.length > 0 && <>{' '}And within your constellation, <span style={{ color: '#40ccdd' }}>{PROFILE_PATTERN_MATCHES.length} people</span> share resonant patterns with you — potential mirrors or collaborators.</>}
              </div>
            </div>

            {/* Strongest Connections */}
            <div style={{ padding: '14px 20px', borderRadius: 10, background: 'rgba(144,80,224,.04)', border: '1px solid rgba(144,80,224,.1)' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(144,80,224,.5)', marginBottom: 8 }}>
                Strongest Cross-System Connections
              </div>
              {top3.map((a, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 10 : 0, paddingBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--foreground)', fontFamily: "'Cinzel',serif" }}>{a.title}</span>
                    <span style={{ fontSize: 11, fontFamily: "'Inconsolata',monospace", color: a.strength >= 8 ? '#60b030' : a.strength >= 6 ? '#c9a84c' : 'var(--muted-foreground)' }}>{a.strength}/10</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif" }}>{a.description}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {(a.frameworks || []).map(f => (
                      <span key={f} style={{ fontSize: 8, padding: '1px 6px', borderRadius: 6, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>{f}</span>
                    ))}
                    <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 6, background: `${a.type === 'resonance' ? 'rgba(96,176,48,' : a.type === 'tension' ? 'rgba(212,48,112,' : a.type === 'gateway' ? 'rgba(201,168,76,' : 'rgba(64,204,221,'}0.08)`, color: a.type === 'resonance' ? '#60b030' : a.type === 'tension' ? '#d44070' : a.type === 'gateway' ? '#c9a84c' : '#40ccdd' }}>{a.type}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Framework Hub Analysis */}
            <div style={{ padding: '14px 20px', borderRadius: 10, background: 'rgba(64,204,221,.04)', border: '1px solid rgba(64,204,221,.1)' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(64,204,221,.5)', marginBottom: 8 }}>
                Framework Hubs — Where Your Systems Converge
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif" }}>
                {topFw.map(([fw, count], i) => (
                  <span key={fw}>
                    <span style={{ color: '#40ccdd' }}>{fw.toUpperCase()}</span> appears in {count} alignment{count > 1 ? 's' : ''}
                    {i < topFw.length - 1 ? (i === topFw.length - 2 ? ', and ' : ', ') : ''}
                  </span>
                ))}
                {topFw.length > 0 && <> — {topFw[0][0].toUpperCase()} is your most interconnected framework, acting as the hub that ties your other systems together. Changes in this area ripple across your entire pattern map.</>}
              </div>
              {tensions.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, color: 'rgba(212,48,112,.6)', fontFamily: "'Cormorant Garamond',serif" }}>
                  <span style={{ color: '#d44070' }}>{tensions.length} tension{tensions.length > 1 ? 's' : ''}</span> detected: {tensions.slice(0, 2).map(t => t.title).join(' and ')}. These are not problems — they are the growth edges where your systems push against each other, creating the pressure needed for transformation.
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ═══ ACTIVE TIMING PATTERNS ═══ */}
      <div>
        <div style={S.sectionTitle}>Active Timing Patterns</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIMING_PATTERNS.map((tp, i) => {
            const ac = ACTIVATION_CONFIG[tp.activation]
            return (
              <div key={i} style={{
                ...S.glass, padding: '14px 16px',
                borderLeft: `3px solid ${ac.col}`,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={S.badge(ac.bg, ac.border, ac.col)}>{ac.label}</span>
                  <span style={{ ...S.mono, fontSize: 13, color: 'var(--foreground)', flex: 1 }}>{tp.pattern}</span>
                  <span style={{ ...S.monoSm, fontSize: 10 }}>peak {tp.peakDate}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                  {tp.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ CORE ALIGNMENTS GRID ═══ */}
      <div>
        <div style={S.sectionTitle}>Cross-Framework Alignments</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CROSS_FRAMEWORK_ALIGNMENTS.map((a) => {
            const tc = TYPE_CONFIG[a.type]
            return (
              <div key={a.id} style={{
                ...S.glass, padding: '14px 16px',
                borderLeft: `3px solid ${tc.col}`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: '.08em',
                    color: tc.col, flex: 1,
                  }}>
                    {a.title}
                  </span>
                  <span style={S.badge(tc.bg, tc.border, tc.col)}>{tc.label}</span>
                </div>

                {/* Framework chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {a.frameworks.map((fw) => (
                    <span key={fw} style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                      fontFamily: "'Inconsolata', monospace", fontSize: 9, letterSpacing: '.05em',
                      background: `${FRAMEWORK_COLORS[fw]}11`,
                      border: `1px solid ${FRAMEWORK_COLORS[fw]}33`,
                      color: FRAMEWORK_COLORS[fw],
                    }}>
                      {FRAMEWORK_LABELS[fw]}
                    </span>
                  ))}
                </div>

                {/* Strength meter */}
                <StrengthMeter value={a.strength} color={tc.col} />

                {/* Description */}
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                  {a.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ PATTERN CATEGORIES ═══ */}
      <div>
        <div style={S.sectionTitle}>Patterns by Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PATTERN_CATEGORIES.map((cat) => {
            const items = byCategory[cat.id] || []
            if (items.length === 0) return null
            return (
              <div key={cat.id} style={S.glass}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{cat.icon}</span>
                  <div>
                    <div style={S.subHeading}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: -4 }}>{cat.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((a) => {
                    const tc = TYPE_CONFIG[a.type]
                    return (
                      <div key={a.id} style={{
                        ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: '10px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', background: tc.col, flexShrink: 0,
                          }} />
                          <span style={{ ...S.mono, fontSize: 13, color: tc.col, flex: 1 }}>{a.title}</span>
                          <span style={{ ...S.monoSm, fontSize: 10 }}>{a.strength}/10</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5, paddingLeft: 14 }}>
                          {a.description}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ PROFILE MATCHES ═══ */}
      <div>
        <div style={S.sectionTitle}>Profile Pattern Matches</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 8, fontStyle: 'italic' }}>
          How your pattern signature resonates with others
          {people.length > 0 && (
            <span style={{ color: 'var(--muted-foreground)' }}> — {people.length} profile{people.length > 1 ? 's' : ''} in your circle</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROFILE_PATTERN_MATCHES.map((pm, i) => {
            const scoreColor = pm.resonanceScore >= 80 ? '#60b030' :
              pm.resonanceScore >= 60 ? '#e09040' : '#ee4466'
            return (
              <div key={i} style={{
                ...S.glass, padding: '16px 18px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                {/* Circular progress */}
                <CircularProgress value={pm.resonanceScore} color={scoreColor} />

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{pm.emoji}</span>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '.08em',
                      color: 'var(--foreground)',
                    }}>
                      {pm.personName}
                    </span>
                    <span style={S.badge('rgba(201,168,76,.06)', 'var(--accent)', 'var(--muted-foreground)')}>
                      {pm.sharedPatterns} shared
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    <span style={{ color: '#60b030' }}>{'\u25B2'} </span>
                    {pm.topAlignment}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    <span style={{ color: '#9050e0' }}>{'\u25BC'} </span>
                    {pm.tensionPoint}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ THE PATTERN READING ═══ */}
      <div>
        <div style={S.sectionTitle}>The Pattern Reading</div>
        <div style={S.interpretation}>
          <span style={{ color: 'var(--foreground)' }}>Your core signature</span> is the number 5 — the seeker, the investigator, the one compelled to understand before acting. This frequency repeats across your Enneagram type, your Life Path, and your Gene Keys profile with remarkable consistency. What this means, simply: <span style={{ color: '#40ccdd' }}>your mind is built to comprehend things deeply before you engage with them</span>. You are not impulsive. You are not reckless. You need to see the structure.
          <br /><br />
          But here is where most people get you wrong. This investigative nature is not cold. Beneath the analytical surface lives an ocean of feeling — <span style={{ color: '#9050e0' }}>your emotional body (Scorpio Moon), your decision-making wiring (Human Design Emotional Authority), and your personality type (Enneagram 4 wing) all point to the same thing: you process life through intense emotional depth</span>. You do not simply think about things — you transmute them through feeling. This is your central paradox: the mind that wants distance, the heart that demands total immersion. And you are built to hold both.
          <br /><br />
          The balance point where these opposing forces meet — <span style={{ color: '#c9a84c' }}>what Kabbalah calls Tiphareth, what your Libra Rising embodies, what your Galactic Tone of Integrity enacts</span> — is not a compromise. It is a synthesis. Your incarnation is not about choosing between observer and participant, between the blade and the water. It is about being the <span style={{ color: 'var(--foreground)' }}>living bridge</span> where both exist simultaneously.
          <br /><br />
          And your life's arc is shaped by something none of the others predict alone: <span style={{ color: '#40ccdd' }}>your life unfolds through surprise</span>. <span style={{ color: '#40ccdd' }}>You are built to be interrupted by what you could not have anticipated, and when those unexpected invitations arrive, you respond with extraordinary precision and grace</span> (what comes from being a Projector in Human Design, a Libra in astrology, and born in the year of the Metal Rooster). You are not here to force doors open. You are here to recognize which ones were always meant for you — and to walk through them with the totality and depth that your entire pattern signature demands.
        </div>
      </div>

      {/* ═══ HIDDEN CONNECTIONS ═══ */}
      <div>
        <div style={S.sectionTitle}>Hidden Connections</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: 8 }}>
          Subtle numerological and symbolic coincidences that may carry meaning
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            {
              sym: '#',
              title: 'Your Mayan signature (Kin 138) reduces to 3',
              detail: 'Your Mayan birth signature (Kin 138) reduces mathematically to the number 3 — the number of creative expression and self-manifestation. Independently, your Gene Keys placed you in the evolution position of Gate 31, which is all about creative leadership. Two completely unrelated systems arrive at the same frequency.',
            },
            {
              sym: '\u221E',
              title: 'The number 8 bridges your two 5s',
              detail: 'You have Life Path 5 and Enneagram type 5 — the seeker appears twice. The Galactic Tone 8 (Integrity) appears as the harmonic midpoint between them. This is not coincidence: your integrity is the mechanism that unifies and deepens your seeking nature.',
            },
            {
              sym: '\u2609',
              title: 'Your Sun location equals your Human Design gate',
              detail: 'Your natal Sun sits at 3 degrees Aquarius. This degree maps precisely to Human Design Gate 41 (Anticipation). And Gate 41 is also your Gene Keys Life\'s Work. Three completely unrelated systems — astrology, Human Design, and Gene Keys — point to the exact same gate. You are built to anticipate.',
            },
            {
              sym: '\u25B3',
              title: 'The triangle repeats in every system',
              detail: 'Your Human Design profile is 3/5 (two numbers). Your Enneagram is 5 with a 4 wing (two numbers). Your Tritype has five, four, and one. In every single formulation — across three different frameworks — you see the same triangle: investigation (5), individuality or feeling (4), and integrity (1 or the line 3). The pattern holds.',
            },
            {
              sym: '\u2726',
              title: 'You were born in a Universal Year 1',
              detail: 'Your birth year (Metal Rooster, 1981) reduces numerologically: 1+9+8+1 = 19, which reduces to 10, which reduces to 1. Universal Year 1 is the year of new beginnings and fully-formed individuation. Combined with Metal element\'s cutting precision, your birth year carries the signature of a pioneer who arrives complete.',
            },
            {
              sym: '\u263D',
              title: 'Your emotional body is wired for pattern recognition',
              detail: 'Your natal Moon sits at 12 degrees Scorpio. This degree corresponds to Human Design Gate 44 (Alertness) — the gate that governs pattern recognition and the ability to detect what is coming before it arrives. Your emotional body (the Moon) is literally positioned in the gate of seeing patterns. You feel them before you see them.',
            },
          ].map((hc, i) => (
            <div key={i} style={{
              ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 4, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 16,
                  color: 'var(--foreground)', minWidth: 22, textAlign: 'center',
                }}>{hc.sym}</span>
                <span style={{ ...S.mono, fontSize: 12, color: 'var(--foreground)' }}>{hc.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5, paddingLeft: 32 }}>
                {hc.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
