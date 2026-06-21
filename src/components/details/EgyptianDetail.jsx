import { useMemo } from 'react'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { EGYPTIAN_SIGNS, EGYPTIAN_PROFILE, getEgyptianSign } from '../../data/egyptianData'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ---- shared styles (matching app conventions) ---- */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 28,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingBottom: 8,
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

const ELEM_COLORS = { Fire: '#e53935', Earth: '#d4a017', Water: '#1e88e5', Air: '#88aacc' }

const SIGN_GLYPHS = {
  'Nile': '\u{1F30A}',
  'Amun-Ra': '\u{2600}',
  'Mut': '\u{1F985}',
  'Geb': '\u{1F30D}',
  'Osiris': '\u{2625}',
  'Isis': '\u{1F451}',
  'Thoth': '\u{1F4DC}',
  'Horus': '\u{1F4A0}',
  'Anubis': '\u{1F43E}',
  'Seth': '\u{26A1}',
  'Bastet': '\u{1F408}',
  'Sekhmet': '\u{1F981}',
}

export default function EgyptianDetail() {
  const profile = useActiveProfile()

  // Compute Egyptian sign dynamically from birth data
  const computedSign = useMemo(() => {
    if (!profile.dob) return null
    const [, m, d] = profile.dob.split('-').map(Number)
    return getEgyptianSign(d, m)
  }, [profile.dob])

  // No birth date — show empty state
  if (!profile.dob) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, opacity: 0.5, padding: 32 }}>
        <div style={{ fontSize: 40 }}>𓅭</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)' }}>Add birth date to activate</div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Open Profile to unlock your Egyptian sign</div>
      </div>
    )
  }

  // Use computed sign's name to look up full sign data (now each sign has all fields)
  const activeSignName = computedSign?.name || 'Mut'
  const activeSignData = EGYPTIAN_SIGNS.find(s => s.name === activeSignName) || EGYPTIAN_SIGNS.find(s => s.name === 'Mut')

  // Build profile from the sign data directly — no more hardcoded fallback
  const P = {
    sign: activeSignData.name,
    element: activeSignData.element,
    planet: activeSignData.planet,
    symbol: activeSignData.symbol,
    traits: activeSignData.traits,
    dates: activeSignData.dates,
    color: activeSignData.color,
    deityTitle: activeSignData.deityTitle,
    description: activeSignData.description,
    strengths: activeSignData.strengths,
    weaknesses: activeSignData.weaknesses,
    compatibility: activeSignData.compatibility,
  }

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{SIGN_GLYPHS[P.sign] || '\u2726'} Egyptian Astrology</div>
          <AboutSystemButton systemName="Egyptian Astrology" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Ancient Egyptian zodiac signs, deity archetypes, elemental alignments, and divine compatibility
        </div>
      </div>

      {/* PRIMARY SIGN OVERVIEW */}
      <div>
        <div style={S.sectionTitle}>Your Sign</div>
        <div style={{ ...S.glass, display: 'flex', gap: 24, alignItems: 'center', padding: '24px 22px' }}>
          {/* Large emblem */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--accent)', border: '2px solid rgba(201,168,76,.25)',
            fontSize: 44, flexShrink: 0,
          }}>
            {SIGN_GLYPHS[P.sign]}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 20, letterSpacing: '.15em', color: 'var(--foreground)',
            }}>
              {P.sign}
            </div>
            <div style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>
              {P.symbol} &middot; {P.dates}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={S.badge('var(--accent)', 'rgba(201,168,76,.25)', 'var(--foreground)')}>
                {P.element}
              </span>
              <span style={S.badge('rgba(184,160,112,.1)', 'rgba(184,160,112,.25)', '#b8a070')}>
                {P.planet}
              </span>
              <span style={{
                ...S.badge('rgba(201,168,76,.06)', 'var(--accent)', 'var(--muted-foreground)'),
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: P.color, border: '1px solid rgba(255,255,255,.1)' }} />
                Sign Color
              </span>
              <span style={S.badge('rgba(201,168,76,.06)', 'var(--accent)', 'var(--muted-foreground)')}>
                {P.symbol}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
              Traits: {P.traits.join(' \u00B7 ')}
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <div style={S.sectionTitle}>{P.deityTitle}</div>
        <div style={S.interpretation}>
          {P.description}
        </div>
      </div>

      {/* TRAITS */}
      <div>
        <div style={S.sectionTitle}>Core Traits</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {P.traits.map((trait, i) => (
            <div key={i} style={{
              ...S.glass, padding: '14px 20px', textAlign: 'center', flex: '1 1 120px',
              borderColor: 'var(--accent)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
                fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)',
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '.1em', color: 'var(--foreground)',
              }}>
                {trait}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRENGTHS & WEAKNESSES */}
      <div>
        <div style={S.sectionTitle}>Strengths & Weaknesses</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            ...S.glass, padding: '16px 18px',
            borderColor: 'rgba(96,176,48,.15)',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
              textTransform: 'uppercase', color: '#60b030', marginBottom: 10,
            }}>Strengths</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {P.strengths}
            </div>
          </div>
          <div style={{
            ...S.glass, padding: '16px 18px',
            borderColor: 'rgba(220,60,60,.15)',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
              textTransform: 'uppercase', color: '#dc5050', marginBottom: 10,
            }}>Weaknesses</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {P.weaknesses}
            </div>
          </div>
        </div>
      </div>

      {/* COMPATIBILITY */}
      <div>
        <div style={S.sectionTitle}>Divine Compatibility</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {P.compatibility.map((name, i) => {
            const compSign = EGYPTIAN_SIGNS.find(s => s.name === name)
            const elemCol = ELEM_COLORS[compSign?.element] || '#ccc'
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: 'rgba(96,176,48,.12)',
                background: 'rgba(96,176,48,.02)',
                padding: '10px 14px',
              }}>
                <span style={{ fontSize: 26 }}>{SIGN_GLYPHS[name] || '\u2726'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: '.08em', color: '#60b030',
                  }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {compSign?.dates}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                    {compSign?.traits?.join(' \u00B7 ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span style={S.badge(elemCol + '12', elemCol + '30', elemCol)}>
                    {compSign?.element}
                  </span>
                  <span style={S.badge('rgba(96,176,48,.12)', 'rgba(96,176,48,.3)', '#60b030')}>
                    Compatible
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ELEMENT & PLANET */}
      <div>
        <div style={S.sectionTitle}>Cosmic Alignments</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Element */}
          <div style={{
            ...S.glass, textAlign: 'center', padding: '20px 18px',
            background: 'rgba(212,160,23,.04)', borderColor: 'rgba(212,160,23,.15)',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em',
              textTransform: 'uppercase', color: 'rgba(212,160,23,.6)', marginBottom: 6,
            }}>Element</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 28, color: '#d4a017',
              letterSpacing: '.15em', lineHeight: 1,
            }}>{P.element}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 8, fontStyle: 'italic' }}>
              {{ Fire: 'Passion, transformation, willpower, and creative force', Earth: 'Grounding, stability, endurance, and practical manifestation', Water: 'Emotion, intuition, depth, and flowing adaptability', Air: 'Intellect, communication, freedom, and swift perception' }[P.element] || P.element}
            </div>
          </div>

          {/* Planet */}
          <div style={{
            ...S.glass, textAlign: 'center', padding: '20px 18px',
            background: 'rgba(184,160,112,.04)', borderColor: 'rgba(184,160,112,.15)',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em',
              textTransform: 'uppercase', color: 'rgba(184,160,112,.6)', marginBottom: 6,
            }}>Ruling Planet</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 28, color: '#b8a070',
              letterSpacing: '.15em', lineHeight: 1,
            }}>{P.planet}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 8, fontStyle: 'italic' }}>
              {{ Sun: 'Vitality, leadership, creative power, and radiant self-expression', Moon: 'Intuition, cycles, reflection, emotional depth, and hidden knowledge', Venus: 'Love, beauty, harmony, pleasure, and artistic sensibility', Mercury: 'Communication, intellect, adaptability, and swift understanding', Mars: 'Action, courage, drive, and transformative force', Pluto: 'Transformation, rebirth, hidden power, and deep regeneration', Earth: 'Stability, nurturing, groundedness, and material manifestation' }[P.planet] || P.planet}
            </div>
          </div>
        </div>
      </div>

      {/* ALL 12 SIGNS TABLE */}
      <div>
        <div style={S.sectionTitle}>The Twelve Egyptian Signs</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {EGYPTIAN_SIGNS.map((sign, i) => {
            const isActive = sign.name === P.sign
            const elemCol = ELEM_COLORS[sign.element] || '#ccc'
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: isActive ? 'rgba(201,168,76,.2)' : 'var(--secondary)',
                background: isActive ? 'var(--secondary)' : 'rgba(255,255,255,.015)',
                padding: '6px 12px',
              }}>
                <span style={{ fontSize: 20, minWidth: 32, textAlign: 'center' }}>
                  {SIGN_GLYPHS[sign.name] || '\u2726'}
                </span>
                <div style={{ width: 80 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '.08em',
                    color: isActive ? 'var(--foreground)' : 'var(--foreground)',
                  }}>{sign.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{sign.symbol}</div>
                </div>
                <span style={S.badge(elemCol + '10', elemCol + '28', elemCol)}>
                  {sign.element}
                </span>
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)',
                  width: 50, textAlign: 'center',
                }}>{sign.planet}</span>
                <div style={{ flex: 1, fontSize: 10, color: 'var(--muted-foreground)' }}>
                  {sign.traits.join(' \u00B7 ')}
                </div>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: sign.color, border: '1px solid rgba(255,255,255,.1)',
                  flexShrink: 0,
                }} />
                {isActive && (
                  <span style={S.badge('var(--accent)', 'rgba(201,168,76,.3)', 'var(--foreground)')}>
                    You
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* HOLISTIC INTERPRETATION */}
      <div>
        <div style={S.sectionTitle}>Holistic Interpretation</div>
        <div style={S.interpretation}>
          As a child of <span style={{ color: 'var(--foreground)' }}>{P.sign}, {P.deityTitle}</span>, your
          Egyptian astrological blueprint is shaped by the archetype of the {P.symbol.toLowerCase()} and the
          deep currents of {P.element} energy.
          Governed by <span style={{ color: '#b8a070' }}>{P.planet}</span>, you move through life
          with {P.traits[0]?.toLowerCase()} nature and {P.traits[1]?.toLowerCase()} instinct at your core.
          Your <span style={{ color: ELEM_COLORS[P.element] || '#d4a017' }}>{P.element} element</span>{' '}
          {P.element === 'Fire' ? 'ignites your ambitions with creative force and drives you to act boldly' :
           P.element === 'Earth' ? 'grounds your ambitions in reality, ensuring your visions always find form' :
           P.element === 'Water' ? 'gives you emotional depth and intuitive flow, adapting to life\'s currents' :
           'lifts your mind into realms of insight and communication, connecting ideas across boundaries'}.
          {' '}Your strengths — {P.strengths.toLowerCase()} — form the foundation of your character,
          while your shadows — {P.weaknesses.toLowerCase()} — mark the edges where growth awaits.
          {P.compatibility.length > 0 && (
            <> Your divine compatibility with{' '}
              {P.compatibility.map((name, i) => (
                <span key={name}>
                  {i > 0 && ' and '}
                  <span style={{ color: '#60b030' }}>{name}</span>
                </span>
              ))}{' '}
              reveals the relationships that most deeply mirror and complement your nature,
              illuminating the full spectrum of who you are becoming.
            </>
          )}
        </div>
      </div>
    </div>
  )
}
