import { useState } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { ENNEAGRAM_TYPES, ENNEAGRAM_PROFILE, ENNEAGRAM_QUIZ, INSTINCTUAL_VARIANTS, TRIAD_COLORS } from '../../data/enneagramData'
import EnneagramSymbol from '../canvas/EnneagramSymbol'
import AboutSystemButton from '../ui/AboutSystemButton'
// EnneagramQuiz is defined inline below — no modal overlay needed

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

function EnneagramQuiz() {
  const setPrimaryProfile = useGolemStore((s) => s.setPrimaryProfile)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleAnswer = (optIdx) => {
    const q = ENNEAGRAM_QUIZ[step]
    const scores = q.opts[optIdx].scores
    const newAnswers = { ...answers }
    Object.entries(scores).forEach(([type, pts]) => {
      newAnswers[type] = (newAnswers[type] || 0) + pts
    })
    setAnswers(newAnswers)

    if (step < ENNEAGRAM_QUIZ.length - 1) {
      setStep(step + 1)
    } else {
      const sorted = Object.entries(newAnswers).sort((a, b) => b[1] - a[1])
      const topType = parseInt(sorted[0][0])
      const typeData = ENNEAGRAM_TYPES.find(t => t.number === topType)
      const topTypeData = ENNEAGRAM_TYPES.find(t => t.number === topType)
      // Determine wing from adjacent types with highest scores
      const wings = topTypeData?.wings || []
      const wingScores = wings.map(w => ({ w, s: newAnswers[w] || 0 }))
      wingScores.sort((a, b) => b.s - a.s)
      const suggestedWing = wingScores[0]?.w || wings[0]
      // Save to store
      setPrimaryProfile({ enneagramType: topType, enneagramWing: suggestedWing })
      setSaved(true)
      setResult({ type: topType, name: typeData?.name, scores: sorted.slice(0, 3) })
    }
  }

  const reset = () => { setStep(0); setAnswers({}); setResult(null); setSaved(false) }

  if (result) {
    const typeData = ENNEAGRAM_TYPES.find(t => t.number === result.type)
    const tc = TRIAD_COLORS[typeData?.triad] || TRIAD_COLORS.Head
    return (
      <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Quiz Result
        </div>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tc.bg, border: `2px solid ${tc.border}`,
          fontFamily: "'Cinzel', serif", fontSize: 32, color: tc.color,
        }}>{result.type}</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)', letterSpacing: '.1em' }}>
          Type {result.type}: {result.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {result.scores.map(([t, pts], i) => {
            const td = ENNEAGRAM_TYPES.find(x => x.number === parseInt(t))
            return (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 10,
                background: i === 0 ? 'var(--accent)' : 'var(--secondary)',
                border: `1px solid ${i === 0 ? 'rgba(201,168,76,.3)' : 'rgba(255,255,255,.08)'}`,
                color: i === 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontFamily: "'Inconsolata', monospace",
              }}>
                {td?.name} ({pts}pts)
              </span>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
          This is a brief indicator. For accurate typing, explore the full descriptions below
          and consider which core fear and desire resonate most deeply.
        </div>
        {saved && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(96,200,80,.08)', border: '1px solid rgba(96,200,80,.2)',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', color: '#88dd44',
            textAlign: 'center',
          }}>✓ Saved to your profile</div>
        )}
        <div onClick={reset} style={{
          padding: '12px 28px', borderRadius: 10, cursor: 'pointer', alignSelf: 'center',
          fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
          border: '2px solid rgba(201,168,76,.8)',
          color: '#fff',
          transition: 'all .2s', position: 'relative', zIndex: 2,
          boxShadow: '0 2px 12px rgba(201,168,76,.25)',
        }}>Retake Quiz</div>
      </div>
    )
  }

  const q = ENNEAGRAM_QUIZ[step]
  return (
    <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Quick Type Finder
        </span>
        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)' }}>
          {step + 1} / {ENNEAGRAM_QUIZ.length}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: 'var(--foreground)',
          width: `${((step + 1) / ENNEAGRAM_QUIZ.length) * 100}%`,
          transition: 'width .3s ease',
        }} />
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'var(--foreground)', lineHeight: 1.5 }}>
        {q.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {q.opts.map((opt, i) => (
          <div key={i} onClick={() => handleAnswer(i)} style={{
            ...S.row, cursor: 'pointer', padding: '10px 14px',
            transition: 'all .2s',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
              fontFamily: "'Cinzel', serif", fontSize: 10, color: 'var(--foreground)',
            }}>{String.fromCharCode(65 + i)}</span>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EnneagramDetail() {
  const activeProfile = useActiveProfile()
  const storeType = activeProfile?.enneagramType || null
  const storeWing = activeProfile?.enneagramWing || null
  const globalInstinct = useGolemStore((s) => s.enneagramInstinct)
  const storeInstinct = activeProfile?.enneagramInstinct || globalInstinct
  const useStaticInstinct = !storeInstinct
  const [showQuizOverlay, setShowQuizOverlay] = useState(false)

  // No enneagram type — show empty state with quiz button
  if (!storeType) {
    return (
      <div style={S.panel}>
        <AboutSystemButton systemName="Enneagram" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 14, padding: 32 }}>
          <div style={{ fontSize: 28 }}>◉</div>
          <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold)' }}>Enneagram</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
            Nine core patterns of perception — your type reveals the lens through which your psyche filters reality.
          </div>
        </div>
        <div>
          <div style={S.sectionTitle}>Discover Your Type</div>
          <EnneagramQuiz />
        </div>
      </div>
    )
  }

  // Resolve active type from store only (no static fallback)
  const typeNum = storeType
  const activeType = ENNEAGRAM_TYPES.find(t => t.number === typeNum)

  // Resolve wings — primary from store or type default, secondary is the other wing
  const primaryWing = storeWing || activeType.wings[0]
  const secondaryWing = activeType.wings.find(w => w !== primaryWing) || activeType.wings[1]
  const primaryWingType = ENNEAGRAM_TYPES.find(t => t.number === primaryWing)
  const secondaryWingType = ENNEAGRAM_TYPES.find(t => t.number === secondaryWing)

  // Resolve growth/stress arrows
  const integrationTo = activeType.growth
  const disintegrationTo = activeType.stress
  const integType = ENNEAGRAM_TYPES.find(t => t.number === integrationTo)
  const disintType = ENNEAGRAM_TYPES.find(t => t.number === disintegrationTo)

  // Resolve instinctual stacking
  const instinct = storeInstinct || 'sp'
  // Build stacking info
  const instVariants = ['sp', 'sx', 'so']
  const dominant = instinct
  const remaining = instVariants.filter(v => v !== dominant)
  const stacking = storeInstinct ? {
    dominant,
    secondary: remaining[0],
    blind: remaining[1],
    stacking: `${dominant}/${remaining[0]}`,
  } : { dominant: 'sp', secondary: 'sx', blind: 'so', stacking: 'sp/sx' }

  // Label
  const label = `${typeNum}w${primaryWing}`
  const fullName = `${activeType.name} with ${primaryWingType.name} Wing`

  // Tritype — only show if user has set one
  const tritype = null

  const tc = TRIAD_COLORS[activeType.triad]

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={S.heading}>{'\u2B21'} Enneagram</div>
          <button
            onClick={() => setShowQuizOverlay(true)}
            style={{
              padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
              border: '2px solid rgba(201,168,76,.8)',
              color: '#fff',
              transition: 'all .2s', position: 'relative', zIndex: 2,
              boxShadow: '0 2px 12px rgba(201,168,76,.25)',
            }}
          >
            Retake Quiz
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Personality architecture -- type, wing, tritype, instincts, and growth paths
        </div>
        <AboutSystemButton systemName="Enneagram" />
      </div>

      {/* ENNEAGRAM SYMBOL CANVAS */}
      <div>
        <div style={S.sectionTitle}>Enneagram Symbol</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 460, position: 'relative' }}>
          <EnneagramSymbol typeOverride={storeType} wingOverride={storeWing} />
        </div>
      </div>

      {/* INLINE QUIZ — shown when retake is triggered */}
      {showQuizOverlay && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.sectionTitle}>Retake Quiz</div>
            <span
              onClick={() => setShowQuizOverlay(false)}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em',
                color: 'var(--muted-foreground)', cursor: 'pointer',
              }}
            >Cancel</span>
          </div>
          <EnneagramQuiz />
        </div>
      )}

      {/* CORE TYPE */}
      <div>
        <div style={S.sectionTitle}>Core Type</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['Type', `${label} \u2014 ${fullName}`],
            ['Archetype', !storeType ? ENNEAGRAM_PROFILE.name : activeType.name],
            ['Triad', `${activeType.triad} (${activeType.center} Center)`],
            ['Core Fear', activeType.fear],
            ['Core Desire', activeType.desire],
            ['Motivation', activeType.motivation],
          ].map(([lbl, val], i) => (
            <div key={i} style={S.keyVal}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
                textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 140,
              }}>{lbl}</span>
              <span style={{
                ...S.mono, color: i === 0 ? 'var(--foreground)' : 'var(--foreground)',
                textAlign: 'right', maxWidth: '60%',
              }}>
                {i === 0
                  ? <span style={{
                      ...S.badge(tc.bg, tc.border, tc.color),
                      fontSize: 10, padding: '4px 14px',
                    }}>{val}</span>
                  : val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* VICE & VIRTUE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          ...S.glass,
          background: 'rgba(220,60,60,.04)', borderColor: 'rgba(220,60,60,.15)',
          textAlign: 'center', padding: '20px 18px',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(220,60,60,.6)', marginBottom: 6 }}>
            Passion (Vice)
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: '#ee5544', letterSpacing: '.15em' }}>
            {activeType.vice}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6, fontStyle: 'italic' }}>
            The emotional habit that keeps the ego fixated
          </div>
        </div>
        <div style={{
          ...S.glass,
          background: 'rgba(96,200,80,.04)', borderColor: 'rgba(96,200,80,.15)',
          textAlign: 'center', padding: '20px 18px',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(96,200,80,.6)', marginBottom: 6 }}>
            Virtue
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: '#88dd44', letterSpacing: '.15em' }}>
            {activeType.virtue}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6, fontStyle: 'italic' }}>
            The higher quality that emerges through self-awareness
          </div>
        </div>
      </div>

      {/* WING INFLUENCE — BOTH WINGS */}
      <div>
        <div style={S.sectionTitle}>Wing Influence</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Primary wing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 24, color: 'var(--foreground)',
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'var(--accent)', border: '1px solid rgba(201,168,76,.18)',
            }}>{primaryWing}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.mono, color: 'var(--foreground)', fontSize: 14 }}>
                  Wing {primaryWing}: {primaryWingType.name}
                </span>
                <span style={S.badge('var(--accent)', 'rgba(201,168,76,.25)', 'var(--foreground)')}>Primary</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 4 }}>
                {useStaticInstinct && ENNEAGRAM_PROFILE.wingInfluence[`wing${primaryWing}`]
                  ? ENNEAGRAM_PROFILE.wingInfluence[`wing${primaryWing}`]
                  : `Adds ${primaryWingType.name.toLowerCase()} qualities — ${primaryWingType.keywords.slice(0, 2).join(', ').toLowerCase()} — to the core ${activeType.name} pattern`}
              </div>
            </div>
          </div>
          {/* Secondary wing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: .7 }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 20, color: 'var(--muted-foreground)',
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'var(--secondary)', border: '1px solid var(--accent)',
            }}>{secondaryWing}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.mono, color: 'var(--muted-foreground)', fontSize: 13 }}>
                  Wing {secondaryWing}: {secondaryWingType.name}
                </span>
                <span style={S.badge('var(--secondary)', 'rgba(255,255,255,.08)', 'var(--muted-foreground)')}>Secondary</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 4 }}>
                {useStaticInstinct && ENNEAGRAM_PROFILE.wingInfluence[`wing${secondaryWing}`]
                  ? ENNEAGRAM_PROFILE.wingInfluence[`wing${secondaryWing}`]
                  : `A subtler influence adding ${secondaryWingType.keywords.slice(0, 2).join(', ').toLowerCase()} tendencies`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRITYPE */}
      {tritype && <div>
        <div style={S.sectionTitle}>Tritype</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 20, color: 'var(--foreground)', fontWeight: 700 }}>
              {tritype.label}
            </span>
            <span style={{ ...S.mono, color: 'var(--muted-foreground)' }}>{tritype.name}</span>
          </div>
          {tritype.types.map((tNum, i) => {
            const tData = ENNEAGRAM_TYPES.find(t => t.number === tNum)
            const triC = TRIAD_COLORS[tData.triad]
            const centers = ['Head', 'Heart', 'Body']
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: triC.border,
                background: triC.bg,
              }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 20, minWidth: 36, textAlign: 'center',
                  color: triC.color,
                }}>{tNum}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...S.mono, color: triC.color, fontSize: 13 }}>{tData.name}</span>
                    <span style={S.badge(triC.bg, triC.border, triC.color)}>
                      {tData.triad} Center
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    {centers[i]} center response: {tData.vice} {'\u2192'} {tData.virtue}
                  </span>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '4px 0' }}>
            {tritype.description}
          </div>
        </div>
      </div>}

      {/* INSTINCTUAL STACKING */}
      <div>
        <div style={S.sectionTitle}>Instinctual Stacking</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{
            fontFamily: "'Inconsolata', monospace", fontSize: 20, color: 'var(--foreground)',
            fontWeight: 700, letterSpacing: '.1em',
          }}>
            {stacking.stacking.toUpperCase()}
          </span>
          <span style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>
            Dominant {'\u2192'} Secondary (blind spot: {stacking.blind.toUpperCase()})
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {INSTINCTUAL_VARIANTS.map((iv, i) => {
            const isDom = iv.code === stacking.dominant
            const isSec = iv.code === stacking.secondary
            const isBlind = iv.code === stacking.blind
            const lbl = isDom ? 'Dominant' : isSec ? 'Secondary' : 'Blind Spot'
            return (
              <div key={i} style={{
                ...S.row,
                borderColor: isDom ? 'rgba(201,168,76,.2)' : isSec ? 'rgba(64,204,221,.15)' : 'var(--secondary)',
                background: isDom ? 'rgba(201,168,76,.06)' : isSec ? 'rgba(64,204,221,.03)' : 'var(--secondary)',
                opacity: isBlind ? .55 : 1,
              }}>
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 16, fontWeight: 700,
                  minWidth: 32, textAlign: 'center',
                  color: isDom ? 'var(--foreground)' : isSec ? 'var(--aqua2)' : 'var(--muted-foreground)',
                }}>{iv.code.toUpperCase()}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...S.mono, color: isDom ? 'var(--foreground)' : 'var(--muted-foreground)', fontSize: 13 }}>
                      {iv.name}
                    </span>
                    <span style={S.badge(
                      isDom ? 'var(--accent)' : isSec ? 'rgba(64,204,221,.08)' : 'var(--secondary)',
                      isDom ? 'rgba(201,168,76,.25)' : isSec ? 'rgba(64,204,221,.2)' : 'rgba(255,255,255,.08)',
                      isDom ? 'var(--foreground)' : isSec ? 'var(--aqua2)' : 'var(--muted-foreground)',
                    )}>{lbl}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {iv.focus}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* INTEGRATION & DISINTEGRATION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          ...S.glass,
          background: 'rgba(96,200,80,.04)', borderColor: 'rgba(96,200,80,.15)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(96,200,80,.6)', marginBottom: 8 }}>
            Integration (Growth)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)',
            }}>{typeNum}</span>
            <span style={{ color: '#88dd44', fontSize: 16 }}>{'\u2192'}</span>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 14, color: '#88dd44',
            }}>{integrationTo}</span>
            <span style={{ ...S.mono, color: '#88dd44', fontSize: 11 }}>({integType.name})</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {useStaticInstinct
              ? ENNEAGRAM_PROFILE.integration.description
              : `Moves toward the healthy ${integType.name} \u2014 takes on ${integType.keywords.slice(0, 2).join(', ').toLowerCase()} qualities`}
          </div>
        </div>
        <div style={{
          ...S.glass,
          background: 'rgba(220,60,60,.04)', borderColor: 'rgba(220,60,60,.15)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(220,60,60,.6)', marginBottom: 8 }}>
            Disintegration (Stress)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)',
            }}>{typeNum}</span>
            <span style={{ color: '#ee5544', fontSize: 16 }}>{'\u2192'}</span>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 14, color: '#ee5544',
            }}>{disintegrationTo}</span>
            <span style={{ ...S.mono, color: '#ee5544', fontSize: 11 }}>({disintType.name})</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {useStaticInstinct
              ? ENNEAGRAM_PROFILE.disintegration.description
              : `Under stress, takes on unhealthy ${disintType.name} traits \u2014 becomes more ${disintType.keywords.slice(2).join(', ').toLowerCase()}`}
          </div>
        </div>
      </div>

      {/* ALL 9 TYPES TABLE */}
      <div>
        <div style={S.sectionTitle}>The Nine Types</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* header */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 110px 70px 80px 90px 90px', gap: 8, padding: '4px 12px' }}>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>#</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>NAME</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>TRIAD</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>VICE</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>VIRTUE</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>ARROWS</span>
          </div>
          {ENNEAGRAM_TYPES.map((t, i) => {
            const triC = TRIAD_COLORS[t.triad]
            const isActive = t.number === typeNum
            return (
              <div key={i} style={{
                ...S.row,
                display: 'grid', gridTemplateColumns: '32px 110px 70px 80px 90px 90px', gap: 8,
                borderColor: isActive ? 'rgba(201,168,76,.2)' : 'var(--secondary)',
                background: isActive ? 'rgba(201,168,76,.06)' : 'var(--secondary)',
              }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 16, textAlign: 'center',
                  color: isActive ? 'var(--foreground)' : t.col + '0.7)',
                }}>{t.number}</span>
                <span style={{
                  ...S.mono,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: isActive ? 700 : 400,
                }}>{t.name}</span>
                <span style={S.badge(triC.bg, triC.border, triC.color)}>{t.triad}</span>
                <span style={{ ...S.monoSm, color: 'var(--rose2)', fontSize: 10 }}>{t.vice}</span>
                <span style={{ ...S.monoSm, color: '#88dd44', fontSize: 10 }}>{t.virtue}</span>
                <span style={{ ...S.monoSm, fontSize: 10, color: 'var(--muted-foreground)' }}>
                  {'\u2191'}{t.growth} {'\u2193'}{t.stress}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* LEVELS OF DEVELOPMENT */}
      <div>
        <div style={S.sectionTitle}>Levels of Development</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Level bar — generic, no current level indicator */}
          <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 4, overflow: 'hidden' }}>
            {Array.from({ length: 9 }, (_, i) => {
              const isHealthy = i < 3
              const isAverage = i >= 3 && i < 6
              const color = isHealthy ? 'rgba(96,200,80,' : isAverage ? 'rgba(240,200,40,' : 'rgba(220,60,60,'
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 2,
                  background: color + '0.25)',
                }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}>
            <span style={{ fontSize: 9, color: '#88dd44', fontFamily: "'Inconsolata', monospace" }}>Healthy</span>
            <span style={{ fontSize: 9, color: '#f0c828', fontFamily: "'Inconsolata', monospace" }}>Average</span>
            <span style={{ fontSize: 9, color: '#ee5544', fontFamily: "'Inconsolata', monospace" }}>Unhealthy</span>
          </div>
          {[
            ['Healthy (1\u20133)', `The ${activeType.name} at their best — ${activeType.virtue.toLowerCase()} expressed fully, free from ${activeType.vice.toLowerCase()}`, '#88dd44'],
            ['Average (4\u20136)', `The ${activeType.name} in ordinary function — ${activeType.keywords[2]?.toLowerCase() || 'caught in patterns'}, managing core fear of ${activeType.fear.toLowerCase()}`, '#f0c828'],
            ['Unhealthy (7\u20139)', `The ${activeType.name} under stress — ${activeType.keywords[3]?.toLowerCase() || 'reactive patterns'}, ${activeType.vice.toLowerCase()} overwhelms`, '#ee5544'],
          ].map(([lbl, desc, color], i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
                textTransform: 'uppercase', color,
              }}>{lbl}</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GROWTH RECOMMENDATIONS */}
      <div>
        <div style={S.sectionTitle}>Growth Recommendations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            `Practice moving toward ${activeType.virtue.toLowerCase()} — the antidote to ${activeType.vice.toLowerCase()}`,
            `Notice when ${activeType.fear.toLowerCase()} is driving behavior — and pause`,
            `Lean into your growth arrow toward Type ${integrationTo} (${integType.name}) — take on ${integType.keywords.slice(0, 2).join(', ').toLowerCase()} qualities`,
            `Watch the stress arrow to Type ${disintegrationTo} (${disintType.name}) — notice ${disintType.keywords.slice(0, 2).join(', ').toLowerCase()} tendencies emerging`,
            `Your core desire (${activeType.desire.toLowerCase()}) is healthy — pursue it without ${activeType.vice.toLowerCase()}`,
            `Work with your ${primaryWingType.name} wing for ${primaryWingType.keywords[0].toLowerCase()} and ${primaryWingType.keywords[1].toLowerCase()}`,
          ].map((rec, i) => (
            <div key={i} style={{
              ...S.row, padding: '10px 14px',
            }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--accent)',
                flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                {rec}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* READING */}
      <div>
        <div style={S.sectionTitle}>Profile Reading</div>
        <div style={S.interpretation}>
          As a <span style={{ color: 'var(--foreground)' }}>Type {label}</span>, you lead with the {activeType.triad}{' '}
          center's core fear of {activeType.fear.toLowerCase()}, colored by the {primaryWingType.name}'s{' '}
          {primaryWingType.keywords[0].toLowerCase()} qualities. The{' '}
          <span style={{ color: 'var(--foreground)' }}>{INSTINCTUAL_VARIANTS.find(v => v.code === stacking.dominant)?.name} dominant</span>{' '}
          instinct focuses your {activeType.name.toLowerCase()} nature on {INSTINCTUAL_VARIANTS.find(v => v.code === stacking.dominant)?.keyword.toLowerCase()}.{' '}
          Growth comes through moving toward{' '}
          <span style={{ color: '#88dd44' }}>{integrationTo} ({integType.name})</span> -- taking on{' '}
          {integType.keywords.slice(0, 2).join(' and ').toLowerCase()} qualities.{' '}
          Watch for the <span style={{ color: '#ee5544' }}>stress arrow to {disintegrationTo}</span>, where the{' '}
          impulse toward {disintType.keywords.slice(2).join(' and ').toLowerCase()} replaces your natural strengths.{' '}
          The passion of <span style={{ color: '#ee5544' }}>{activeType.vice}</span> is transformed through the virtue of{' '}
          <span style={{ color: '#88dd44' }}>{activeType.virtue}</span>.
        </div>
      </div>
    </div>
  )
}
