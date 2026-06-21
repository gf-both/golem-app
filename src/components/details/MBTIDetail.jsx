import { useState } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { MBTI_TYPES, MBTI_FUNCTIONS, MBTI_QUIZ_QUESTIONS } from '../../data/mbtiData'
import AboutSystemButton from '../ui/AboutSystemButton'
// MBTIQuiz is defined inline below — no modal overlay needed

const FUNCTION_COLORS = {
  Ni: { color: '#9050e0', bg: 'rgba(144,80,224,.08)', border: 'rgba(144,80,224,.22)' },
  Ne: { color: '#f0c828', bg: 'rgba(240,200,40,.08)', border: 'rgba(240,200,40,.22)' },
  Si: { color: '#5a8cb4', bg: 'rgba(90,140,180,.08)', border: 'rgba(90,140,180,.22)' },
  Se: { color: '#dc7828', bg: 'rgba(220,120,40,.08)', border: 'rgba(220,120,40,.22)' },
  Ti: { color: '#40ccdd', bg: 'rgba(64,204,221,.08)', border: 'rgba(64,204,221,.22)' },
  Te: { color: '#dc3c3c', bg: 'rgba(220,60,60,.08)', border: 'rgba(220,60,60,.22)' },
  Fi: { color: '#b478dc', bg: 'rgba(180,120,220,.08)', border: 'rgba(180,120,220,.22)' },
  Fe: { color: '#60c850', bg: 'rgba(96,200,80,.08)', border: 'rgba(96,200,80,.22)' },
}

const STACK_LABELS = ['Dominant', 'Auxiliary', 'Tertiary', 'Inferior']
const STACK_STRENGTHS = [100, 75, 45, 25]

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

function calculateType(answers) {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  answers.forEach((answer, idx) => {
    const q = MBTI_QUIZ_QUESTIONS[idx]
    if (answer === 'A') scores[q.scoreA]++
    else scores[q.scoreB]++
  })
  const code =
    (scores.E >= scores.I ? 'E' : 'I') +
    (scores.S >= scores.N ? 'S' : 'N') +
    (scores.T >= scores.F ? 'T' : 'F') +
    (scores.J >= scores.P ? 'J' : 'P')
  return code
}

/* ============ QUIZ COMPONENT ============ */
function MBTIQuiz({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])

  const q = MBTI_QUIZ_QUESTIONS[currentQ]
  const progress = currentQ / MBTI_QUIZ_QUESTIONS.length

  function handleAnswer(choice) {
    const next = [...answers, choice]
    setAnswers(next)
    if (next.length >= MBTI_QUIZ_QUESTIONS.length) {
      const code = calculateType(next)
      onComplete(code)
    } else {
      setCurrentQ(currentQ + 1)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 3, height: 4, borderRadius: 2, overflow: 'hidden' }}>
        {MBTI_QUIZ_QUESTIONS.map((_, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 2,
            background: i < currentQ ? 'var(--ring)' : i === currentQ ? 'rgba(201,168,76,.3)' : 'var(--border)',
            transition: 'background .3s',
          }} />
        ))}
      </div>

      {/* Question counter */}
      <div style={{
        fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--muted-foreground)',
        letterSpacing: '.1em',
      }}>
        QUESTION {currentQ + 1} OF {MBTI_QUIZ_QUESTIONS.length}
      </div>

      {/* Question text */}
      <div style={{
        fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.6,
        color: 'var(--foreground)', padding: '0 4px',
      }}>
        {q.question}
      </div>

      {/* Dimension badge */}
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={S.badge('var(--accent)', 'rgba(201,168,76,.18)', 'var(--foreground)')}>
          {q.dimension === 'EI' ? 'Energy' : q.dimension === 'SN' ? 'Perception' : q.dimension === 'TF' ? 'Judgment' : 'Lifestyle'}
        </span>
      </div>

      {/* Option cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { key: 'A', text: q.optionA, letter: q.scoreA },
          { key: 'B', text: q.optionB, letter: q.scoreB },
        ].map(opt => (
          <div
            key={opt.key}
            onClick={() => handleAnswer(opt.key)}
            style={{
              ...S.glass,
              cursor: 'pointer',
              padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
              transition: 'all .2s',
              borderColor: 'var(--accent)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--ring)'
              e.currentTarget.style.background = 'rgba(201,168,76,.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'rgba(5,5,26,.7)'
            }}
          >
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'var(--accent)', border: '1px solid rgba(201,168,76,.18)',
              flexShrink: 0,
            }}>{opt.key}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, lineHeight: 1.6, color: 'var(--muted-foreground)',
              }}>
                {opt.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ RESULTS COMPONENT ============ */
function MBTIResults({ typeCode, onRetake }) {
  const typeData = MBTI_TYPES.find(t => t.code === typeCode)
  if (!typeData) return null

  const typeColor = typeData.color + '0.7)'

  return (
    <>
      {/* HEADER + RETAKE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u29C9'} MBTI</div>
          <AboutSystemButton systemName="Myers-Briggs" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div></div>
          {onRetake && (
            <button
              onClick={onRetake}
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
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Myers-Briggs cognitive type -- function stack, personality architecture, and compatibility
        </div>
      </div>

      {/* CORE TYPE */}
      <div>
        <div style={S.sectionTitle}>Your Type</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 36, letterSpacing: '.2em',
            color: 'var(--foreground)', marginBottom: 4,
          }}>
            {typeData.code}
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: '.12em',
            color: typeColor, textTransform: 'uppercase',
          }}>
            {typeData.nickname}
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'var(--muted-foreground)',
            fontStyle: 'italic', lineHeight: 1.5, maxWidth: 400, margin: '0 auto',
          }}>
            {typeData.name}
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.7, color: 'var(--muted-foreground)', padding: '8px 0',
          }}>
            {typeData.description}
          </div>
        </div>
      </div>

      {/* COGNITIVE FUNCTION STACK */}
      <div>
        <div style={S.sectionTitle}>Cognitive Function Stack</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {typeData.functions.map((fnCode, i) => {
            const fnData = MBTI_FUNCTIONS.find(f => f.code === fnCode)
            const fc = FUNCTION_COLORS[fnCode]
            const strength = STACK_STRENGTHS[i]
            return (
              <div key={i} style={{
                ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 8,
                padding: '14px 16px',
                borderColor: fc.border,
                background: fc.bg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 20, minWidth: 40, textAlign: 'center',
                    color: fc.color, fontWeight: 700,
                  }}>{fnCode}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ ...S.mono, color: fc.color, fontSize: 13 }}>
                        {fnData ? fnData.name : fnCode}
                      </span>
                      <span style={S.badge(fc.bg, fc.border, fc.color)}>
                        {STACK_LABELS[i]}
                      </span>
                    </div>
                    {fnData && (
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {fnData.description}
                      </span>
                    )}
                  </div>
                </div>
                {/* Strength bar */}
                <div style={{
                  height: 6, borderRadius: 3, background: 'var(--secondary)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: strength + '%',
                    background: `linear-gradient(90deg, ${fc.color}, ${fc.border})`,
                    transition: 'width .6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DICHOTOMY BREAKDOWN */}
      <div>
        <div style={S.sectionTitle}>Type Dimensions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { dim: typeCode[0], pair: 'E / I', label: typeCode[0] === 'E' ? 'Extraversion' : 'Introversion', desc: typeCode[0] === 'E' ? 'Energy flows outward -- recharged by interaction, thinks by talking' : 'Energy flows inward -- recharged by solitude, thinks before speaking' },
            { dim: typeCode[1], pair: 'S / N', label: typeCode[1] === 'S' ? 'Sensing' : 'Intuition', desc: typeCode[1] === 'S' ? 'Trusts concrete data, present reality, and lived experience' : 'Trusts patterns, possibilities, and the unseen connections between things' },
            { dim: typeCode[2], pair: 'T / F', label: typeCode[2] === 'T' ? 'Thinking' : 'Feeling', desc: typeCode[2] === 'T' ? 'Decides through impersonal logic, consistency, and objective analysis' : 'Decides through values, empathy, and the impact on people involved' },
            { dim: typeCode[3], pair: 'J / P', label: typeCode[3] === 'J' ? 'Judging' : 'Perceiving', desc: typeCode[3] === 'J' ? 'Prefers closure, structure, and decisive action on the outer world' : 'Prefers openness, flexibility, and staying receptive to new information' },
          ].map((d, i) => (
            <div key={i} style={{
              ...S.glass, padding: '16px 14px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: 'var(--muted-foreground)',
                }}>{d.pair}</span>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 20, color: 'var(--foreground)',
                  fontWeight: 700,
                }}>{d.dim}</span>
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.1em',
                color: 'var(--foreground)',
              }}>{d.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {d.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPATIBLE TYPES */}
      <div>
        <div style={S.sectionTitle}>Compatible Types</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {typeData.compatible.map((c, i) => {
            const compType = MBTI_TYPES.find(t => t.code === c)
            if (!compType) return null
            const cc = compType.color
            return (
              <div key={i} style={{
                ...S.row, padding: '12px 14px',
                borderColor: cc + '.18)',
                background: cc + '.04)',
              }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 16, minWidth: 56, textAlign: 'center',
                  color: cc + '.8)', fontWeight: 700, letterSpacing: '.1em',
                }}>{compType.code}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ ...S.mono, color: cc + '.7)', fontSize: 12 }}>
                    {compType.nickname}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    {compType.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ALL 16 TYPES */}
      <div>
        <div style={S.sectionTitle}>The 16 Types</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {MBTI_TYPES.map((t, i) => {
            const isActive = t.code === typeCode
            const isCompat = typeData.compatible.includes(t.code)
            return (
              <div key={i} style={{
                textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                background: isActive ? 'var(--accent)' : isCompat ? t.color + '.04)' : 'rgba(255,255,255,.015)',
                border: `1px solid ${isActive ? 'rgba(201,168,76,.3)' : isCompat ? t.color + '.15)' : 'var(--secondary)'}`,
              }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 11,
                  color: isActive ? 'var(--foreground)' : isCompat ? t.color + '.7)' : 'var(--muted-foreground)',
                  fontWeight: isActive ? 700 : 400, letterSpacing: '.08em',
                }}>{t.code}</div>
                <div style={{
                  fontSize: 8, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 2,
                }}>{t.nickname}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* READING */}
      <div>
        <div style={S.sectionTitle}>Profile Reading</div>
        <div style={S.interpretation}>
          As an <span style={{ color: 'var(--foreground)' }}>{typeData.code} ({typeData.nickname})</span>, you
          lead with <span style={{ color: FUNCTION_COLORS[typeData.functions[0]].color }}>
          {typeData.functions[0]}</span> as your dominant function -- the lens through which you first
          engage with reality. This is supported by{' '}
          <span style={{ color: FUNCTION_COLORS[typeData.functions[1]].color }}>
          {typeData.functions[1]}</span> in the auxiliary position, providing balance and a secondary
          mode of processing. Your tertiary{' '}
          <span style={{ color: FUNCTION_COLORS[typeData.functions[2]].color }}>
          {typeData.functions[2]}</span> represents an area of developing skill and occasional
          playfulness, while the inferior{' '}
          <span style={{ color: FUNCTION_COLORS[typeData.functions[3]].color }}>
          {typeData.functions[3]}</span> is your blind spot -- the function that feels foreign, yet
          holds the key to your greatest growth. When you learn to integrate what feels most
          uncomfortable, you unlock the full spectrum of your cognitive architecture.
        </div>
      </div>

    </>
  )
}

/* ============ MAIN DETAIL COMPONENT ============ */
export default function MBTIDetail() {
  const primaryProfile = useActiveProfile()
  const setPrimaryProfile = useGolemStore((s) => s.setPrimaryProfile)
  const storeType = primaryProfile?.mbtiType || null
  const [quizType, setQuizType] = useState(null)
  const [showQuiz, setShowQuiz] = useState(true)
  const [showQuizOverlay, setShowQuizOverlay] = useState(false)

  // Use store type if available, otherwise use quiz result
  const resolvedType = storeType || quizType

  function handleQuizComplete(code) {
    // Save to store immediately on completion
    setPrimaryProfile({ mbtiType: code })
    setQuizType(code)
    setShowQuiz(false)
  }

  function handleRetake() {
    setQuizType(null)
    setShowQuiz(true)
  }

  // If type is set from profile, skip quiz entirely and show results
  if (resolvedType) {
    return (
      <div style={S.panel}>
        {/* Inline quiz for retaking when type is already set */}
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
            <MBTIQuiz onComplete={(code) => { handleQuizComplete(code); setShowQuizOverlay(false) }} />
          </div>
        )}
        <MBTIResults typeCode={resolvedType} onRetake={storeType ? () => setShowQuizOverlay(true) : handleRetake} />
      </div>
    )
  }

  return (
    <div style={S.panel}>
      {showQuiz && !quizType ? (
        <>
          {/* Quiz header */}
          <div>
            <div style={S.heading}>{'\u29C9'} MBTI</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
              Discover your cognitive type through 20 questions that reveal how you perceive and judge reality
            </div>
          </div>

          <div>
            <div style={S.sectionTitle}>Cognitive Type Quiz</div>
            <MBTIQuiz onComplete={handleQuizComplete} />
          </div>
        </>
      ) : (
        <MBTIResults typeCode={quizType} onRetake={handleRetake} />
      )}
    </div>
  )
}
