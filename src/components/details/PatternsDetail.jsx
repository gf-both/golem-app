import { useMemo } from 'react'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { buildFullProfile } from '../../engines/patternEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ---- type/strength config ---- */
const STRENGTH_CONFIG = {
  strong:   { col: '#60b030', bg: 'rgba(96,176,48,.1)',  border: 'rgba(96,176,48,.3)',  label: 'STRONG' },
  moderate: { col: '#e09040', bg: 'rgba(224,144,64,.1)', border: 'rgba(224,144,64,.3)', label: 'MODERATE' },
  subtle:   { col: 'var(--muted-foreground)', bg: 'var(--secondary)', border: 'rgba(255,255,255,.08)', label: 'SUBTLE' },
}

/* ---- shared styles ---- */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.16em',
    color: 'var(--foreground)', marginBottom: 2,
  },
  sub: { fontSize: 14, color: 'var(--muted-foreground)', fontStyle: 'italic' },
  glass: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 13, padding: 18,
  },
  card: {
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '14px 16px',
  },
  badge: (bg, border, color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em',
    textTransform: 'uppercase', background: bg, border: `1px solid ${border}`, color,
  }),
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip: {
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '8px 12px', minWidth: 120,
  },
  chipLabel: {
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.12em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 3,
  },
  chipValue: { fontSize: 15, color: 'var(--foreground)' },
}

function StrengthMeter({ value, max = 10, color = '#c9a84c' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: color, opacity: 0.8, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)', minWidth: 30, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const num = (v) => (v != null && v !== '' ? Number(v) : null)

export default function PatternsDetail() {
  const profile = useActiveProfile()

  const fp = useMemo(() => {
    if (!profile?.dob) return null
    try {
      return buildFullProfile({
        name: profile.name || '',
        dob: profile.dob,
        tob: profile.tob || '12:00',
        lat: profile.birthLat || 0,
        lon: profile.birthLon || 0,
        timezone: profile.birthTimezone ?? 0,
        enneagram: num(profile.enneagramType) || undefined,
        mbti: profile.mbtiType || undefined,
      })
    } catch {
      return null
    }
  }, [profile?.dob, profile?.tob, profile?.birthLat, profile?.birthLon, profile?.birthTimezone, profile?.name, profile?.enneagramType, profile?.mbtiType])

  if (!fp) {
    return (
      <div style={S.panel}>
        <div>
          <div style={S.heading}>Pattern Synthesis</div>
          <div style={S.sub}>Add this profile's birth date to compute its cross-system patterns.</div>
        </div>
      </div>
    )
  }

  const patterns = fp.patterns || []
  const sun = fp.natal?.planets?.sun?.sign
  const moon = fp.natal?.planets?.moon?.sign
  const asc = fp.natal?.angles?.asc?.sign
  const lifePath = fp.numerology?.core?.lifePath?.val
  const expression = fp.numerology?.core?.expression?.val
  const soulUrge = fp.numerology?.core?.soulUrge?.val
  const hdType = fp.hd?.type
  const hdProfile = fp.hd?.profile
  const gkGate = fp.geneKeys?.spheres?.lifesWork?.gate
  const gkGift = fp.geneKeys?.spheres?.lifesWork?.gift
  const mayanSign = fp.mayan?.tzolkin?.daySign
  const mayanTone = fp.mayan?.tzolkin?.tone

  // Recurring core number across the numerological + typological layers
  const numberPool = [lifePath, expression, soulUrge, num(profile.enneagramType)].filter((n) => n != null)
  const counts = {}
  numberPool.forEach((n) => { counts[n] = (counts[n] || 0) + 1 })
  const recurring = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const coreNumber = recurring && recurring[1] > 1 ? recurring[0] : (lifePath ?? null)

  const chips = [
    ['Sun', sun], ['Moon', moon], ['Rising', asc],
    ['Life Path', lifePath], ['Expression', expression],
    ['HD Type', hdType], ['Profile', hdProfile],
    ['Gene Key', gkGate ? `${gkGate} · ${gkGift || ''}` : null],
    ['Mayan', mayanSign ? `${mayanSign} ${mayanTone || ''}` : null],
    ['Enneagram', profile.enneagramType || null], ['MBTI', profile.mbtiType || null],
  ].filter(([, v]) => v != null && v !== '')

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={S.heading}>Pattern Synthesis</div>
          <div style={S.sub}>
            What recurs across systems for{' '}
            <span style={{ color: 'var(--foreground)' }}>{profile.name || 'this profile'}</span>
          </div>
        </div>
        <AboutSystemButton systemKey="pat" />
      </div>

      {/* Core signature */}
      {coreNumber != null && (
        <div style={{ ...S.glass, borderColor: 'rgba(201,168,76,.3)', background: 'rgba(201,168,76,.05)' }}>
          <div style={S.sectionTitle}>Core Signature</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--foreground)' }}>
            The number <span style={{ color: '#c9a84c', fontWeight: 600, fontSize: 20 }}>{coreNumber}</span>{' '}
            anchors this signature{recurring && recurring[1] > 1 ? `, repeating across ${recurring[1]} of the core layers` : ''}.
            {sun && <> The conscious self is <span style={{ color: '#f0c040' }}>{sun}</span>{moon && <>, the emotional nature <span style={{ color: '#88aacc' }}>{moon}</span></>}{asc && <>, meeting the world as <span style={{ color: '#aa66ff' }}>{asc}</span> rising</>}.</>}
          </div>
        </div>
      )}

      {/* Signature chips — change per profile */}
      <div>
        <div style={S.sectionTitle}>Computed Across Systems</div>
        <div style={S.chipGrid}>
          {chips.map(([label, value]) => (
            <div key={label} style={S.chip}>
              <div style={S.chipLabel}>{label}</div>
              <div style={S.chipValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detected patterns */}
      <div>
        <div style={S.sectionTitle}>
          Detected Patterns{patterns.length > 0 ? ` · ${patterns.length}` : ''}
        </div>
        {patterns.length === 0 ? (
          <div style={{ ...S.card, color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: 14 }}>
            No strong archetypal patterns crossed the detection threshold for this profile — its signature is
            distributed rather than concentrated. The cross-system values above still tell the story.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patterns.map((p) => {
              const cfg = STRENGTH_CONFIG[p.strength] || STRENGTH_CONFIG.subtle
              return (
                <div key={p.id} style={{ ...S.card, borderColor: cfg.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)', flex: 1 }}>{p.name}</span>
                    <span style={S.badge(cfg.bg, cfg.border, cfg.col)}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                    {p.description}
                  </div>
                  {p.insight && (
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)', fontStyle: 'italic', marginBottom: 10 }}>
                      {p.insight}
                    </div>
                  )}
                  <StrengthMeter value={p.score} max={Math.max(8, p.score)} color={cfg.col} />
                  {p.contributors?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {p.contributors.map((c, i) => (
                        <span key={i} style={S.badge('var(--accent)', 'var(--border)', 'var(--muted-foreground)')}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
