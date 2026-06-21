import { useState } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { DOSHA_DATA, DOSHA_QUESTIONS, getDoshaProfile } from '../../engines/doshaEngine'
import DoshaSymbol from '../canvas/DoshaSymbol'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ---- shared style fragments ---- */
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
  keyVal: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '6px 0', borderBottom: '1px solid var(--secondary)',
  },
}

const DOSHA_COLORS = {
  vata:  { bg: 'rgba(130,190,235,0.08)', border: 'rgba(130,190,235,0.25)', text: 'rgba(130,190,235,0.9)', bar: 'rgba(130,190,235,0.6)' },
  pitta: { bg: 'rgba(225,110,75,0.08)',  border: 'rgba(225,110,75,0.25)',  text: 'rgba(225,110,75,0.9)',  bar: 'rgba(225,110,75,0.6)' },
  kapha: { bg: 'rgba(100,185,120,0.08)', border: 'rgba(100,185,120,0.25)', text: 'rgba(100,185,120,0.9)', bar: 'rgba(100,185,120,0.6)' },
}

const DOSHA_ICONS = { vata: '\u2728', pitta: '\u2600\uFE0F', kapha: '\uD83C\uDF3F' }

const BALANCED_TRAITS = {
  vata:  { balanced: ['Creative', 'Flexible', 'Quick learner', 'Spiritual', 'Enthusiastic'], imbalanced: ['Anxious', 'Scattered', 'Insomnia', 'Dry skin', 'Constipation'] },
  pitta: { balanced: ['Courageous', 'Focused', 'Intelligent', 'Good digestion', 'Natural leader'], imbalanced: ['Irritable', 'Critical', 'Inflammatory', 'Acid reflux', 'Overheating'] },
  kapha: { balanced: ['Nurturing', 'Patient', 'Steady', 'Strong immunity', 'Loyal'], imbalanced: ['Lethargic', 'Possessive', 'Weight gain', 'Congestion', 'Depression'] },
}

const DIETARY_RECS = {
  vata:  { favor: ['Warm, cooked foods', 'Sweet, sour, salty tastes', 'Healthy oils (ghee, sesame)', 'Root vegetables', 'Warm spices (ginger, cinnamon)'], avoid: ['Raw, cold foods', 'Dry or crunchy snacks', 'Caffeine excess', 'Bitter and astringent tastes'] },
  pitta: { favor: ['Cooling foods', 'Sweet, bitter, astringent tastes', 'Fresh fruits', 'Leafy greens', 'Coconut, mint, coriander'], avoid: ['Spicy, hot foods', 'Fermented foods', 'Excess salt and sour', 'Alcohol and coffee'] },
  kapha: { favor: ['Light, warm foods', 'Pungent, bitter, astringent tastes', 'Leafy greens & legumes', 'Ginger, turmeric, black pepper', 'Honey in moderation'], avoid: ['Heavy, oily foods', 'Sweet and salty excess', 'Dairy products', 'Cold drinks and ice cream'] },
}

/* ---- Quiz sub-component ---- */
function DoshaQuiz() {
  const setDoshaType = useGolemStore(s => s.setDoshaType)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)

  const handleAnswer = (doshaScores) => {
    const newAnswers = [...answers, doshaScores]
    setAnswers(newAnswers)

    if (step < DOSHA_QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      const profile = getDoshaProfile(newAnswers)
      setResult(profile)
    }
  }

  const handleSave = () => {
    if (result) setDoshaType(result.constitution)
  }

  const handleRetake = () => {
    setStep(0)
    setAnswers([])
    setResult(null)
  }

  if (result) {
    const primaryKey = result.primary.name.toLowerCase()
    const secondaryKey = result.secondary.name.toLowerCase()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={S.sectionTitle}>Quiz Result</div>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={S.heading}>{result.constitution}</div>
          <div style={S.monoSm}>Your Ayurvedic constitution type</div>
        </div>

        {/* Score bars */}
        {['vata', 'pitta', 'kapha'].map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...S.mono, width: 48, textAlign: 'right', color: DOSHA_COLORS[key].text }}>{DOSHA_DATA[key].name}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--secondary)', overflow: 'hidden' }}>
              <div style={{ width: `${result.scores[key]}%`, height: '100%', borderRadius: 4, background: DOSHA_COLORS[key].bar, transition: 'width .6s ease' }} />
            </div>
            <span style={{ ...S.monoSm, width: 32 }}>{result.scores[key]}%</span>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          <button onClick={handleSave} style={{
            padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
            letterSpacing: '.14em', textTransform: 'uppercase',
            background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
            border: '2px solid rgba(201,168,76,.8)',
            color: '#fff',
            transition: 'all .2s', position: 'relative', zIndex: 2,
            boxShadow: '0 2px 12px rgba(201,168,76,.25)',
          }}>Save Result</button>
          <button onClick={handleRetake} style={{
            padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
            fontSize: 12, fontFamily: '"Cinzel", serif', fontWeight: 600,
            letterSpacing: '.12em', textTransform: 'uppercase',
            background: 'var(--secondary)', border: '1px solid var(--border)',
            color: 'var(--muted-foreground)', transition: 'all .15s',
          }}>Retake</button>
        </div>
      </div>
    )
  }

  const q = DOSHA_QUESTIONS[step]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.sectionTitle}>Dosha Quiz - Question {step + 1} / {DOSHA_QUESTIONS.length}</div>
      <div style={{ ...S.subHeading, fontSize: 13, textTransform: 'none', letterSpacing: '.05em' }}>{q.q}</div>
      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'var(--secondary)', overflow: 'hidden' }}>
        <div style={{ width: `${((step) / DOSHA_QUESTIONS.length) * 100}%`, height: '100%', borderRadius: 2, background: 'rgba(201,168,76,0.4)', transition: 'width .3s ease' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(opt.dosha)} style={{
            ...S.row, cursor: 'pointer', textAlign: 'left',
            fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)' }}
          >{opt.text}</button>
        ))}
      </div>
    </div>
  )
}

/* ---- Score Bar ---- */
function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ ...S.mono, width: 52, textAlign: 'right', color: color.text, fontSize: 12 }}>{label}</span>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--secondary)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 5, background: color.bar, transition: 'width .6s ease' }} />
      </div>
      <span style={{ ...S.mono, width: 36, fontSize: 13, fontWeight: 600 }}>{value}%</span>
    </div>
  )
}

/* ---- Dosha Card ---- */
function DoshaCard({ doshaKey, isPrimary, isSecondary }) {
  const data = DOSHA_DATA[doshaKey]
  const color = DOSHA_COLORS[doshaKey]
  const traits = BALANCED_TRAITS[doshaKey]
  const diet = DIETARY_RECS[doshaKey]

  return (
    <div style={{
      ...S.glass, padding: 16,
      border: isPrimary ? `1px solid ${color.border}` : '1px solid var(--border)',
      background: isPrimary ? color.bg : 'var(--card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{DOSHA_ICONS[doshaKey]}</span>
        <div>
          <div style={{ ...S.subHeading, marginBottom: 0, color: color.text }}>{data.name}</div>
          <div style={S.monoSm}>{data.elements}</div>
        </div>
        {isPrimary && <span style={S.badge(color.bg, color.border, color.text)}>Primary</span>}
        {isSecondary && <span style={S.badge(color.bg, color.border, color.text)}>Secondary</span>}
      </div>

      <div style={S.interpretation}>{data.description}</div>

      <div style={{ marginTop: 14 }}>
        <div style={{ ...S.keyVal, borderBottom: 'none' }}>
          <span style={{ ...S.monoSm, width: 70 }}>Qualities</span>
          <span style={S.mono}>{data.qualities}</span>
        </div>
        <div style={S.keyVal}>
          <span style={{ ...S.monoSm, width: 70 }}>Season</span>
          <span style={S.mono}>{data.season}</span>
        </div>
      </div>

      {/* Balanced / Imbalanced traits */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.monoSm, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 6, color: 'rgba(100,200,120,0.7)' }}>Balanced</div>
          {traits.balanced.map((t, i) => (
            <div key={i} style={{ ...S.monoSm, padding: '2px 0', fontSize: 11 }}>{t}</div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.monoSm, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 6, color: 'rgba(220,80,80,0.7)' }}>Imbalanced</div>
          {traits.imbalanced.map((t, i) => (
            <div key={i} style={{ ...S.monoSm, padding: '2px 0', fontSize: 11 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Diet */}
      <div style={{ marginTop: 14 }}>
        <div style={{ ...S.monoSm, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 6, color: 'rgba(201,168,76,0.7)' }}>Dietary Guidelines</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...S.monoSm, fontSize: 9, marginBottom: 4, color: 'rgba(100,200,120,0.6)' }}>Favor</div>
            {diet.favor.map((f, i) => (
              <div key={i} style={{ ...S.monoSm, padding: '1px 0', fontSize: 10 }}>{f}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...S.monoSm, fontSize: 9, marginBottom: 4, color: 'rgba(220,80,80,0.6)' }}>Reduce</div>
            {diet.avoid.map((a, i) => (
              <div key={i} style={{ ...S.monoSm, padding: '1px 0', fontSize: 10 }}>{a}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Main Detail Component ---- */
export default function DoshaDetail() {
  const doshaType = useGolemStore(s => (s.activeViewProfile || s.primaryProfile)?.doshaType)
  const [showQuiz, setShowQuiz] = useState(false)

  // Parse dosha type
  let primary = null, secondary = null, tertiary = null
  let scores = null
  const isTridoshic = doshaType && /tri/i.test(doshaType) && !doshaType.toLowerCase().includes('-')
  if (doshaType && !isTridoshic) {
    const parts = doshaType.split('-')
    primary = parts[0] ? parts[0].toLowerCase() : null
    secondary = parts[1] ? parts[1].toLowerCase() : null
    const allDoshas = ['vata', 'pitta', 'kapha']
    tertiary = allDoshas.find(d => d !== primary && d !== secondary) || null
    if (primary && !DOSHA_DATA[primary]) { primary = null }
    if (secondary && !DOSHA_DATA[secondary]) { secondary = null }
    if (tertiary && !DOSHA_DATA[tertiary]) { tertiary = null }
    scores = {}
    if (primary) scores[primary] = 45
    if (secondary) scores[secondary] = 35
    if (tertiary) scores[tertiary] = 20
  } else if (isTridoshic) {
    primary = 'vata'; secondary = 'pitta'; tertiary = 'kapha'
    scores = { vata: 33, pitta: 33, kapha: 34 }
  }

  // If no dosha type, show quiz inline (like MBTI)
  if (!doshaType && !showQuiz) {
    return (
      <div style={S.panel}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={S.heading}>Dosha</div>
            <AboutSystemButton systemName="Dosha" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            Discover your Ayurvedic mind-body constitution through this assessment
          </div>
        </div>
        <div>
          <div style={S.sectionTitle}>Ayurvedic Constitution Quiz</div>
          <DoshaQuiz />
        </div>
      </div>
    )
  }

  return (
    <div style={S.panel}>
      {/* Header with retake option */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={S.heading}>Dosha</div>
            <AboutSystemButton systemName="Dosha" />
          </div>
          {doshaType && (
            <button onClick={() => setShowQuiz(!showQuiz)} style={{
              padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
              border: '2px solid rgba(201,168,76,.8)',
              color: '#fff',
              transition: 'all .2s', position: 'relative', zIndex: 2,
              boxShadow: '0 2px 12px rgba(201,168,76,.25)',
            }}>{showQuiz ? "Close Quiz" : "Retake Quiz"}</button>
          )}
        </div>
        <div style={S.monoSm}>Ayurvedic Constitution Analysis</div>
      </div>

      {/* Inline retake quiz */}
      {showQuiz && (
        <div>
          <div style={S.sectionTitle}>Retake Quiz</div>
          <DoshaQuiz />
        </div>
      )}

      {/* Canvas visualization */}
      <div style={{ ...S.glass, padding: 0, height: 280, overflow: 'hidden' }}>
        <DoshaSymbol doshaType={doshaType} scores={scores} />
      </div>

      {doshaType && (
        <>
          {/* Constitution type banner */}
          <div style={{ ...S.glass, textAlign: 'center', padding: '16px 18px' }}>
            <div style={{ ...S.sectionTitle, borderBottom: 'none', paddingBottom: 4 }}>Constitution Type</div>
            <div style={{ ...S.heading, fontSize: 22, letterSpacing: '.22em', color: 'rgba(201,168,76,0.9)' }}>{doshaType}</div>
            <div style={{ ...S.monoSm, marginTop: 4 }}>
              {isTridoshic
                ? 'All three doshas in equal balance — rare and blessed constitution'
                : `${DOSHA_DATA[primary]?.name || ''} dominant${secondary ? ` with ${DOSHA_DATA[secondary]?.name} secondary influence` : ''}`}
            </div>
          </div>

          {/* Score percentages */}
          <div>
            <div style={S.sectionTitle}>Dosha Balance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {['vata', 'pitta', 'kapha'].map(key => (
                <ScoreBar key={key} label={DOSHA_DATA[key].name} value={scores[key] || 0} color={DOSHA_COLORS[key]} />
              ))}
            </div>
          </div>

          {/* Season alignment */}
          <div>
            <div style={S.sectionTitle}>Season Alignment</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {[primary, secondary].filter(Boolean).map(key => (
                <div key={key} style={{
                  ...S.row, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                  borderLeft: `3px solid ${DOSHA_COLORS[key].border}`,
                }}>
                  <span style={{ ...S.mono, color: DOSHA_COLORS[key].text }}>{DOSHA_DATA[key].name}</span>
                  <span style={S.monoSm}>{DOSHA_DATA[key].season}</span>
                  <span style={{ ...S.monoSm, fontSize: 10 }}>
                    {key === 'vata' && 'Stay warm, maintain routine, favor grounding practices'}
                    {key === 'pitta' && 'Stay cool, avoid midday sun, favor calming activities'}
                    {key === 'kapha' && 'Stay active, embrace change, favor stimulating practices'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary dosha detail */}
          <div>
            <div style={S.sectionTitle}>Primary Dosha</div>
            <DoshaCard doshaKey={primary} isPrimary />
          </div>

          {/* Secondary dosha detail */}
          {secondary && (
            <div>
              <div style={S.sectionTitle}>Secondary Dosha</div>
              <DoshaCard doshaKey={secondary} isSecondary />
            </div>
          )}

          {/* All three doshas overview table */}
          <div>
            <div style={S.sectionTitle}>Three Doshas Overview</div>
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inconsolata', monospace", fontSize: 11 }}>
                <thead>
                  <tr>
                    {['', 'Vata', 'Pitta', 'Kapha'].map((h, i) => (
                      <th key={i} style={{
                        padding: '8px 10px', textAlign: 'left', fontFamily: "'Cinzel',serif",
                        fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border)', color: i > 0 ? DOSHA_COLORS[['vata', 'pitta', 'kapha'][i - 1]].text : 'var(--muted-foreground)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Elements', key: 'elements' },
                    { label: 'Qualities', key: 'qualities' },
                    { label: 'Season', key: 'season' },
                  ].map((row, ri) => (
                    <tr key={ri}>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--secondary)', color: 'var(--muted-foreground)', fontSize: 10, fontFamily: "'Cinzel',serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>{row.label}</td>
                      {['vata', 'pitta', 'kapha'].map(key => (
                        <td key={key} style={{
                          padding: '6px 10px', borderBottom: '1px solid var(--secondary)',
                          color: key === primary ? DOSHA_COLORS[key].text : 'var(--muted-foreground)',
                          fontWeight: key === primary ? 600 : 400,
                        }}>{DOSHA_DATA[key][row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Third dosha (minor) */}
          {tertiary && (
            <div>
              <div style={S.sectionTitle}>Minor Influence</div>
              <DoshaCard doshaKey={tertiary} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
