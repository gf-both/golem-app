import { DREAMSPELL_SEALS, GALACTIC_TONES, MAYAN_PROFILE, CASTLES, EARTH_FAMILIES, COLOR_FAMILIES, SEAL_COLORS, computeFullProfile, getMayanProfile } from '../../data/mayanData'
import MayanWheel from '../canvas/MayanWheel'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ---- Day Sign data with emoji & element ---- */
const DAY_SIGNS = {
  'Imix':    { english: 'Crocodile', emoji: '🐊', element: 'Water', color: '#e74c3c' },
  'Ik':      { english: 'Wind',      emoji: '💨', element: 'Air',   color: '#3498db' },
  'Akbal':   { english: 'Night',     emoji: '🌙', element: 'Water', color: '#2c3e50' },
  'Kan':     { english: 'Seed',      emoji: '🌱', element: 'Earth', color: '#27ae60' },
  'Chicchan':{ english: 'Serpent',   emoji: '🐍', element: 'Fire',  color: '#e74c3c' },
  'Cimi':    { english: 'Death',     emoji: '💀', element: 'Water', color: '#8e44ad' },
  'Manik':   { english: 'Deer',      emoji: '🦌', element: 'Earth', color: '#27ae60' },
  'Lamat':   { english: 'Star',      emoji: '⭐', element: 'Air',   color: '#f39c12' },
  'Muluc':   { english: 'Moon',      emoji: '🌕', element: 'Water', color: '#3498db' },
  'Oc':      { english: 'Dog',       emoji: '🐕', element: 'Air',   color: '#e67e22' },
  'Chuen':   { english: 'Monkey',    emoji: '🐒', element: 'Air',   color: '#e67e22' },
  'Eb':      { english: 'Road',      emoji: '🛤️', element: 'Earth', color: '#95a5a6' },
  'Ben':     { english: 'Reed',      emoji: '🎋', element: 'Earth', color: '#27ae60' },
  'Ix':      { english: 'Jaguar',    emoji: '🐆', element: 'Earth', color: '#8b4513' },
  'Men':     { english: 'Eagle/Owl', emoji: '🦉', element: 'Air',   color: '#3498db' },
  'Cib':     { english: 'Vulture',   emoji: '🦤', element: 'Earth', color: '#7f8c8d' },
  'Caban':   { english: 'Earth',     emoji: '🌍', element: 'Earth', color: '#8b4513' },
  'Etznab':  { english: 'Mirror',    emoji: '🪞', element: 'Air',   color: '#bdc3c7' },
  'Cauac':   { english: 'Storm',     emoji: '⛈️', element: 'Water', color: '#2980b9' },
  'Ahau':    { english: 'Sun',       emoji: '☀️', element: 'Fire',  color: '#f1c40f' },
}

const TONE_NAMES = {
  1: 'Magnetic',  2: 'Lunar',    3: 'Electric', 4: 'Self-Existing',
  5: 'Overtone',  6: 'Rhythmic', 7: 'Resonant', 8: 'Galactic',
  9: 'Solar',    10: 'Planetary',11: 'Spectral', 12: 'Crystal',
  13: 'Cosmic'
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
    textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.18em',
    color: 'var(--foreground)', marginBottom: 4,
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
  keyVal: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '6px 0', borderBottom: '1px solid var(--secondary)',
  },
}

/* Mayan dot-and-bar tone notation (CSS-rendered) */
function ToneNotation({ tone, size = 6, color = 'var(--foreground)' }) {
  const bars = Math.floor(tone / 5)
  const dots = tone % 5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={`b${i}`} style={{ width: size * 4.5, height: size * 0.65, borderRadius: 2, background: color }} />
      ))}
      {dots > 0 && (
        <div style={{ display: 'flex', gap: size * 0.7 }}>
          {Array.from({ length: dots }).map((_, i) => (
            <div key={i} style={{ width: size, height: size, borderRadius: '50%', background: color }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* Hero card for Day Sign / Trecena Sign */
function SignHeroCard({ title, signName, description, emoji, color, meaning }) {
  const signData = DAY_SIGNS[signName] || {}
  const cardColor = color || signData.color || 'var(--foreground)'
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 16px', borderRadius: 14, textAlign: 'center',
      background: cardColor + '10',
      border: `1.5px solid ${cardColor}44`,
      gap: 8,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.25em',
        textTransform: 'uppercase', color: cardColor + 'bb', marginBottom: 2,
      }}>{title}</div>
      <div style={{ fontSize: 42, lineHeight: 1 }}>{emoji || signData.emoji || '✨'}</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
        letterSpacing: '.12em', color: cardColor,
        textTransform: 'uppercase', lineHeight: 1.1,
      }}>{signName}</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13,
        color: 'var(--muted-foreground)', fontStyle: 'italic',
      }}>{signData.english || description}</div>
      {signData.element && (
        <div style={S.badge(cardColor + '15', cardColor + '44', cardColor)}>
          {signData.element}
        </div>
      )}
      {meaning && (
        <div style={{
          fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic',
          lineHeight: 1.5, marginTop: 4, paddingTop: 8,
          borderTop: `1px solid ${cardColor}22`,
        }}>{meaning}</div>
      )}
    </div>
  )
}

/* Hero card for Galactic Tone */
function ToneHeroCard({ tone, toneName, meaning }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 16px', borderRadius: 14, textAlign: 'center',
      background: 'var(--accent)',
      border: '1.5px solid var(--ring)',
      gap: 8,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.25em',
        textTransform: 'uppercase', color: 'rgba(201,168,76,.7)', marginBottom: 2,
      }}>Galactic Tone</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 52, fontWeight: 700,
        color: 'var(--foreground)', lineHeight: 1,
      }}>{tone}</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 600,
        letterSpacing: '.15em', color: 'var(--foreground)',
        textTransform: 'uppercase',
      }}>{toneName}</div>
      <div style={{ paddingTop: 6 }}>
        <ToneNotation tone={tone} size={9} color="var(--foreground)" />
      </div>
      {meaning && (
        <div style={{
          fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic',
          lineHeight: 1.5, marginTop: 4, paddingTop: 8,
          borderTop: '1px solid var(--accent)',
        }}>{meaning}</div>
      )}
    </div>
  )
}

/* Oracle Cross component — uses Dreamspell data (P) */
function OracleCross({ P }) {
  const { destiny, guide, analog, antipode, occult } = P.oracle
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: 10, justifyItems: 'center', alignItems: 'center' }}>
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <OracleCard entry={guide} label="Guide" desc="Higher-self guidance" col="rgba(96,200,80," />
      </div>
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <OracleCard entry={antipode} label="Antipode" desc="Challenge & strength" col="rgba(220,60,60," />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2 }}>
        <OracleCard entry={destiny} label="Destiny" desc="Core signature" col="rgba(221,170,34," isCenter />
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <OracleCard entry={analog} label="Analog" desc="Support & ally" col="rgba(201,168,76," />
      </div>
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <OracleCard entry={occult} label="Occult" desc="Hidden power" col="rgba(64,204,221," />
      </div>
    </div>
  )
}

function OracleCard({ entry, label, desc, col, isCenter }) {
  const sealCol = SEAL_COLORS[entry.seal.color]
  return (
    <div style={{
      textAlign: 'center', padding: isCenter ? '16px 20px' : '10px 16px',
      borderRadius: 12, minWidth: isCenter ? 150 : 120,
      background: col + (isCenter ? '.08)' : '.04)'),
      border: `1px solid ${col}${isCenter ? '.3)' : '.15)'}`,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '.2em',
        textTransform: 'uppercase', color: col + '.6)', marginBottom: 4,
      }}>{label}</div>
      <div style={{ fontSize: isCenter ? 28 : 22, marginBottom: 2 }}>{entry.seal.glyph}</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: isCenter ? 13 : 11,
        color: sealCol, letterSpacing: '.08em',
      }}>{entry.signature}</div>
      <div style={{
        fontFamily: "'Inconsolata', monospace", fontSize: 9,
        color: 'var(--muted-foreground)', marginTop: 2,
      }}>Kin {entry.kin}</div>
      <div style={{ marginTop: 4 }}>
        <ToneNotation tone={entry.toneNum} size={isCenter ? 5 : 4} color={col + '0.5)'} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 4 }}>
        {desc}
      </div>
    </div>
  )
}

export default function MayanDetail() {
  const profile = useActiveProfile()

  if (!profile?.dob) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, opacity: 0.5, padding: 32 }}>
        <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)' }}>Add birth date to activate</div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Open Profile to add your birth data</div>
      </div>
    )
  }

  let P = null
  let classicalProfile = null
  if (profile?.dob) {
    const [y, m, d] = profile.dob.split('-').map(Number)
    if (y && m && d) {
      P = computeFullProfile(y, m, d)
      classicalProfile = getMayanProfile(d, m, y)
    }
  }

  if (!P) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12, opacity:.5, padding:40, textAlign:'center' }}>
        <div style={{ fontSize:40 }}>🌸</div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--gold)' }}>Add birth date to see your Mayan Calendar</div>
        <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>Open Profile to add your birth data</div>
      </div>
    )
  }

  const seal = P.seal
  const tone = P.tone
  const sealCol = SEAL_COLORS[seal.color]
  const colorLabel = seal.color.charAt(0).toUpperCase() + seal.color.slice(1)

  // Classical data for hero section
  const tz = classicalProfile?.tzolkin
  const daySignName = tz?.daySign || 'Chicchan'
  const galacticTone = tz?.tone || 10
  const toneNameStr = TONE_NAMES[galacticTone] || tz?.toneName || 'Planetary'
  const trecenaName = classicalProfile?.trecenaLord || 'Cib'
  const haabFormatted = classicalProfile?.haab?.formatted || ''
  const longCount = classicalProfile?.longCount?.formatted || ''
  const kinNumber = tz?.kinNumber || 205
  const daySignData = DAY_SIGNS[daySignName] || {}
  const trecenaData = DAY_SIGNS[trecenaName] || {}

  return (
    <div style={S.panel}>

      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>Mayan Calendar</div>
          <AboutSystemButton systemName="Mayan Calendar" />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1: YOUR MAYAN SOLAR SEAL (HERO)
      ══════════════════════════════════════════ */}
      <div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.3em',
          textTransform: 'uppercase', color: 'var(--muted-foreground)', textAlign: 'center',
          marginBottom: 18,
        }}>Your Mayan Solar Seal</div>

        {/* 3 Hero Cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SignHeroCard
            title="Day Sign"
            signName={daySignName}
            emoji={daySignData.emoji}
            color={daySignData.color}
            meaning={tz?.daySignMeaning}
          />
          <ToneHeroCard
            tone={galacticTone}
            toneName={toneNameStr}
            meaning={tz?.toneMeaning}
          />
          <SignHeroCard
            title="Trecena Sign"
            signName={trecenaName}
            emoji={trecenaData.emoji}
            color={trecenaData.color}
            meaning="The day sign that rules your 13-day trecena period"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2: CALENDAR POSITIONS
      ══════════════════════════════════════════ */}
      {classicalProfile && (
        <div>
          <div style={S.sectionTitle}>Calendar Positions</div>
          <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Long Count — prominent */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid var(--accent)',
            }}>
              <div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--ring)', marginBottom: 4,
                }}>Long Count</div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700,
                  color: 'var(--foreground)', letterSpacing: '.15em',
                }}>{longCount}</div>
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
                textTransform: 'uppercase', color: 'rgba(201,168,76,.4)',
                textAlign: 'right', lineHeight: 1.6,
              }}>
                {classicalProfile.longCount.baktun} Baktun<br/>
                {classicalProfile.longCount.katun} Katun<br/>
                {classicalProfile.longCount.tun} Tun
              </div>
            </div>

            {/* Haab & Kin row */}
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{
                flex: 1, padding: '14px 16px', borderRight: '1px solid var(--accent)',
              }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--ring)', marginBottom: 4,
                }}>Haab Date</div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 600,
                  color: 'var(--foreground)',
                }}>{haabFormatted}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2, fontStyle: 'italic' }}>
                  {classicalProfile.haab.monthMeaning}
                </div>
              </div>
              <div style={{ flex: 1, padding: '14px 16px' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--ring)', marginBottom: 4,
                }}>Tzolkin Kin</div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 600,
                  color: 'var(--foreground)',
                }}>Kin {kinNumber}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2, fontStyle: 'italic' }}>
                  of 260 in the Tzolkin cycle
                </div>
              </div>
            </div>

            {/* Year Bearer & Lord of Night */}
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--accent)' }}>
              <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid var(--accent)' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--ring)', marginBottom: 2,
                }}>Year Bearer</div>
                <div style={{ ...S.mono, color: 'var(--foreground)' }}>
                  {classicalProfile.yearBearer.formatted}
                </div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--ring)', marginBottom: 2,
                }}>Lord of Night</div>
                <div style={{ ...S.mono, color: 'var(--foreground)' }}>
                  {classicalProfile.lordOfNight}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION 3: FULL MEANINGS
      ══════════════════════════════════════════ */}
      {classicalProfile && (
        <div>
          <div style={S.sectionTitle}>Meanings & Interpretation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Day Sign meaning */}
            <div style={{
              ...S.glass,
              background: (daySignData.color || '#888') + '08',
              borderColor: (daySignData.color || '#888') + '25',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{daySignData.emoji || '✨'}</span>
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700,
                    color: daySignData.color || 'var(--foreground)', letterSpacing: '.1em',
                  }}>{daySignName} — {daySignData.english}</div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                    textTransform: 'uppercase', color: 'var(--ring)',
                  }}>Day Sign · {daySignData.element} Element</div>
                </div>
              </div>
              <div style={S.interpretation}>
                {tz?.daySignDescription || tz?.daySignMeaning || 'Day sign energy shapes your core nature and purpose.'}
              </div>
            </div>

            {/* Tone meaning */}
            <div style={{
              ...S.glass,
              background: 'var(--secondary)',
              borderColor: 'rgba(201,168,76,.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ textAlign: 'center', minWidth: 40 }}>
                  <ToneNotation tone={galacticTone} size={7} color="var(--foreground)" />
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
                    color: 'var(--foreground)', marginTop: 4,
                  }}>{galacticTone}</div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700,
                    color: 'var(--foreground)', letterSpacing: '.1em',
                  }}>Tone {galacticTone} — {toneNameStr}</div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                    textTransform: 'uppercase', color: 'var(--ring)',
                  }}>Galactic Tone · {tz?.toneKeyword}</div>
                </div>
              </div>
              <div style={S.interpretation}>
                {tz?.toneMeaning || 'The galactic tone defines the energy frequency of your day sign.'}
              </div>
            </div>

            {/* Trecena meaning */}
            <div style={{
              ...S.glass,
              background: (trecenaData.color || '#888') + '06',
              borderColor: (trecenaData.color || '#888') + '20',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{trecenaData.emoji || '✨'}</span>
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700,
                    color: trecenaData.color || 'var(--foreground)', letterSpacing: '.1em',
                  }}>Trecena of {trecenaName} — {trecenaData.english}</div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em',
                    textTransform: 'uppercase', color: 'var(--ring)',
                  }}>Trecena Lord · 13-Day Period</div>
                </div>
              </div>
              <div style={S.interpretation}>
                You were born in the trecena of <strong style={{ color: trecenaData.color || 'var(--foreground)' }}>{trecenaName} ({trecenaData.english})</strong>.
                The trecena lord governs the 13-day period that contains your birth, shaping the overarching energy
                and theme of your life path. {trecenaData.element} energy influences your spiritual foundation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION 4: MAYAN WHEEL CANVAS
      ══════════════════════════════════════════ */}
      <div>
        <div style={S.sectionTitle}>Tzolkin Wheel & Dreamspell Oracle</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 460, position: 'relative' }}>
          <MayanWheel classicalDaySign={daySignName} classicalTone={galacticTone} classicalKin={kinNumber} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 5: DREAMSPELL GALACTIC SIGNATURE
      ══════════════════════════════════════════ */}
      <div>
        <div style={S.sectionTitle}>Dreamspell Galactic Signature</div>
        <div style={{ ...S.glass, textAlign: 'center', padding: '28px 22px' }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.25em',
            textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 14,
          }}>Kin {P.kin} {'\u2014'} {P.signature}</div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'flex-start', marginBottom: 16 }}>
            {/* Seal */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: sealCol + '10', border: `2px solid ${sealCol}55`,
                fontSize: 42,
              }}>{seal.glyph}</div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 16, color: sealCol,
                letterSpacing: '.12em',
              }}>{colorLabel} {seal.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                Solar Seal {seal.num} ({seal.mayanName})
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[seal.action, seal.power, seal.essence].map((kw, i) => (
                  <span key={i} style={S.badge(sealCol + '10', sealCol + '33', sealCol)}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ marginTop: 8 }}>
                <ToneNotation tone={tone.number} size={10} color="var(--foreground)" />
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 32, color: 'var(--foreground)',
                letterSpacing: '.15em', lineHeight: 1,
              }}>{tone.number}</div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)',
                letterSpacing: '.12em',
              }}>{tone.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                Galactic Tone {'\u2014'} {tone.keyword}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[tone.action, tone.power].map((kw, i) => (
                  <span key={i} style={S.badge('var(--accent)', 'rgba(201,168,76,.22)', 'var(--foreground)')}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Born {P.birthDate}
          </div>
        </div>
      </div>

      {/* DREAMSPELL CORE PROFILE */}
      <div>
        <div style={S.sectionTitle}>Dreamspell Core Profile</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['Galactic Signature', P.signature],
            ['Solar Seal', `${seal.name} (${seal.mayanName}) \u2014 Seal ${seal.num}`],
            ['Galactic Tone', `${tone.number} \u2014 ${tone.name} (${tone.keyword})`],
            ['Color Family', `${colorLabel} \u2014 ${P.colorFamily.role}: ${P.colorFamily.theme}`],
            ['Direction', seal.direction],
            ['Earth Family', `${P.earthFamily.name} (${P.earthFamily.chakra} Chakra)`],
            ['Wavespell', `${P.wavespell.name} \u2014 ${P.wavespell.label}`],
            ['Castle', `${P.castle.name} (Court of ${P.castle.court})`],
          ].map(([label, val], i) => (
            <div key={i} style={S.keyVal}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
                textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 140,
              }}>{label}</span>
              <span style={{ ...S.mono, color: i === 0 ? 'var(--foreground)' : 'var(--foreground)' }}>
                {i === 0
                  ? <span style={{
                      ...S.badge('var(--accent)', 'rgba(201,168,76,.3)', 'var(--foreground)'),
                      fontSize: 10, padding: '4px 14px',
                    }}>{val}</span>
                  : val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SEAL & TONE DETAIL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          ...S.glass, textAlign: 'center', padding: '20px 18px',
          background: sealCol + '08', borderColor: sealCol + '22',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: sealCol + '99', marginBottom: 6 }}>
            Solar Seal
          </div>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{seal.glyph}</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: sealCol, letterSpacing: '.15em' }}>
            {seal.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, fontStyle: 'italic' }}>
            {seal.action} {'\u00B7'} {seal.power} {'\u00B7'} {seal.essence}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>
            {colorLabel} {'\u00B7'} {seal.direction} {'\u00B7'} {seal.earthFamily}
          </div>
          <div style={{ marginTop: 10 }}>
            <ToneNotation tone={P.toneNum} size={8} color={sealCol + 'aa'} />
          </div>
        </div>

        <div style={{
          ...S.glass, textAlign: 'center', padding: '20px 18px',
          background: 'var(--secondary)', borderColor: 'var(--accent)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,.6)', marginBottom: 6 }}>
            Galactic Tone
          </div>
          <div style={{ marginBottom: 8 }}>
            <ToneNotation tone={tone.number} size={10} color="var(--foreground)" />
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 32, color: 'var(--foreground)', letterSpacing: '.15em', lineHeight: 1 }}>
            {tone.number}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: 'var(--foreground)', letterSpacing: '.12em', marginTop: 6 }}>
            {tone.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 6 }}>
            {tone.keyword}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8, fontStyle: 'italic' }}>
            {tone.action} {'\u00B7'} {tone.power}
          </div>
        </div>
      </div>

      {/* ORACLE CROSS */}
      <div>
        <div style={S.sectionTitle}>Dreamspell Oracle</div>
        <div style={S.glass}>
          <OracleCross P={P} />
        </div>
      </div>

      {/* WAVESPELL & CASTLE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          ...S.glass, padding: '20px 18px',
          background: 'var(--secondary)', borderColor: 'var(--accent)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,.6)', marginBottom: 8 }}>
            Wavespell {P.wavespell.number} of 20
          </div>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{P.wavespell.seal.glyph}</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)', letterSpacing: '.1em' }}>
            {P.wavespell.name}
          </div>
          <div style={{ ...S.monoSm, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {P.wavespell.label}
          </div>
          <div style={{ ...S.monoSm, color: 'var(--muted-foreground)', marginTop: 2 }}>
            Kins {P.wavespell.startKin}{'\u2013'}{P.wavespell.startKin + 12}
          </div>
        </div>

        <div style={{
          ...S.glass, padding: '20px 18px',
          background: P.castle.color + '08', borderColor: P.castle.color + '22',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: P.castle.color + '99', marginBottom: 8 }}>
            Castle {P.castle.num} of 5
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: P.castle.color, letterSpacing: '.1em' }}>
            {P.castle.name}
          </div>
          <div style={{ ...S.monoSm, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Court of {P.castle.court}
          </div>
          <div style={{ ...S.monoSm, color: 'var(--muted-foreground)', marginTop: 2 }}>
            Kins {P.castle.range[0]}{'\u2013'}{P.castle.range[1]}
          </div>
        </div>
      </div>

      {/* EARTH FAMILY */}
      <div>
        <div style={S.sectionTitle}>Earth Family</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 18, color: 'var(--foreground)', fontWeight: 700 }}>
              {P.earthFamily.name}
            </span>
            <span style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>
              {P.earthFamily.role} {'\u00B7'} {P.earthFamily.chakra} Chakra
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {P.earthFamily.seals.map((sNum, i) => {
              const s = DREAMSPELL_SEALS[sNum - 1]
              const sc = SEAL_COLORS[s.color]
              const isYou = sNum === P.sealNum
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: isYou ? 'var(--accent)' : 'var(--secondary)',
                  border: `1px solid ${isYou ? 'rgba(201,168,76,.25)' : 'var(--border)'}`,
                }}>
                  <span style={{ fontSize: 18 }}>{s.glyph}</span>
                  <div>
                    <div style={{ ...S.mono, color: isYou ? 'var(--foreground)' : sc, fontSize: 12 }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Seal {s.num}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 20 SOLAR SEALS TABLE */}
      <div>
        <div style={S.sectionTitle}>The 20 Solar Seals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 28px 90px 80px 80px 70px 55px', gap: 8, padding: '4px 12px' }}>
            {['#', '', 'NAME', 'ACTION', 'POWER', 'FAMILY', 'DIR'].map((h, i) => (
              <span key={i} style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>{h}</span>
            ))}
          </div>
          {DREAMSPELL_SEALS.map((s, i) => {
            const isActive = s.num === P.sealNum
            const sc = SEAL_COLORS[s.color]
            return (
              <div key={i} style={{
                ...S.row,
                display: 'grid', gridTemplateColumns: '28px 28px 90px 80px 80px 70px 55px', gap: 8,
                borderColor: isActive ? 'rgba(201,168,76,.2)' : 'var(--secondary)',
                background: isActive ? 'rgba(201,168,76,.06)' : 'var(--secondary)',
              }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, textAlign: 'center', color: isActive ? 'var(--foreground)' : sc }}>
                  {s.num}
                </span>
                <span style={{ fontSize: 16, textAlign: 'center' }}>{s.glyph}</span>
                <span style={{ ...S.mono, color: isActive ? 'var(--foreground)' : 'var(--foreground)', fontWeight: isActive ? 700 : 400 }}>
                  {s.name}
                </span>
                <span style={{ ...S.monoSm, fontSize: 10 }}>{s.action}</span>
                <span style={{ ...S.monoSm, fontSize: 10 }}>{s.power}</span>
                <span style={{ ...S.monoSm, fontSize: 10, color: sc }}>{s.earthFamily}</span>
                <span style={{ ...S.monoSm, fontSize: 10, color: sc }}>{s.direction}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 13 GALACTIC TONES */}
      <div>
        <div style={S.sectionTitle}>The 13 Galactic Tones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {GALACTIC_TONES.map((t, i) => {
            const isActive = t.number === P.toneNum
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: isActive ? 'rgba(201,168,76,.2)' : 'var(--secondary)',
                background: isActive ? 'rgba(201,168,76,.06)' : 'var(--secondary)',
              }}>
                <div style={{ minWidth: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <ToneNotation tone={t.number} size={4} color={isActive ? 'var(--foreground)' : 'rgba(201,168,76,.25)'} />
                </div>
                <span style={{
                  fontSize: 14, minWidth: 24, textAlign: 'center',
                  fontFamily: "'Cinzel', serif",
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: isActive ? 700 : 400,
                }}>{t.number}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...S.mono, color: isActive ? 'var(--foreground)' : 'var(--foreground)', fontSize: 13 }}>
                      {t.name}
                    </span>
                    <span style={S.badge(
                      isActive ? 'var(--accent)' : 'var(--secondary)',
                      isActive ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.08)',
                      isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                    )}>{t.keyword}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {t.action} {'\u00B7'} {t.power}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5 CASTLES */}
      <div>
        <div style={S.sectionTitle}>The Five Castles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CASTLES.map((c, i) => {
            const isActive = c.num === P.castle.num
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: isActive ? c.color + '44' : 'var(--secondary)',
                background: isActive ? c.color + '0c' : 'var(--secondary)',
              }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 16, minWidth: 28, textAlign: 'center',
                  color: isActive ? c.color : c.color + '66',
                }}>{c.num}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ ...S.mono, color: isActive ? c.color : 'var(--muted-foreground)', fontSize: 12, fontWeight: isActive ? 700 : 400 }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    Court of {c.court} {'\u00B7'} Kins {c.range[0]}{'\u2013'}{c.range[1]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* READING */}
      <div>
        <div style={S.sectionTitle}>Your Dreamspell Reading</div>
        <div style={S.interpretation}>
          As <span style={{ color: 'var(--foreground)' }}>Kin {P.kin} {'\u2014'} {P.signature}</span>, you embody
          the galactic signature of the {seal.name} seal ({seal.mayanName}) — the power of {seal.power.toLowerCase()}.
          As <span style={{ color: 'var(--foreground)' }}>Tone {tone.number} ({tone.name})</span>, you{' '}
          {tone.action.toLowerCase()} in order to {seal.action.toLowerCase()},{' '}
          {tone.power.toLowerCase()}ing the power of {seal.power.toLowerCase()}.{' '}
          Your oracle cross reveals{' '}
          <span style={{ color: '#88dd44' }}>{P.oracle.guide.signature}</span> as your Guide (higher self);{' '}
          <span style={{ color: 'var(--foreground)' }}>{P.oracle.analog.signature}</span> as your Analog (support);{' '}
          <span style={{ color: '#ee5544' }}>{P.oracle.antipode.signature}</span> as your Antipode (challenge); and{' '}
          <span style={{ color: 'var(--aqua2)' }}>{P.oracle.occult.signature}</span> as your Occult (hidden power).{' '}
          You walk within the{' '}
          <span style={{ color: P.castle.color }}>{P.castle.name}</span>,
          the Court of {P.castle.court}. The{' '}
          <span style={{ color: 'var(--foreground)' }}>{P.wavespell.name} Wavespell</span> infuses your
          journey with the power of {P.wavespell.seal.power.toLowerCase()}.
        </div>
      </div>

    </div>
  )
}
