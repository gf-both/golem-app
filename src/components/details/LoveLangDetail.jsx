import { useState } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { LOVE_LANGUAGES, LOVE_LANG_QUESTIONS, getLoveLanguageProfile } from '../../engines/loveLangEngine'
import LoveLangSymbol from '../canvas/LoveLangSymbol'
import AboutSystemButton from '../ui/AboutSystemButton'

const COLORS = {
  words: '#e8c547',
  acts:  '#47c8e8',
  gifts: '#e847a8',
  time:  '#47e88c',
  touch: '#c847e8',
}

const GIVING_TIPS = {
  words: [
    'Write heartfelt notes, texts, or letters expressing what you appreciate about them',
    'Offer specific compliments rather than generic ones',
    'Verbally acknowledge their efforts and achievements',
    'Say "I love you" and "I appreciate you" regularly and sincerely',
    'Leave encouraging voice messages or sticky notes',
  ],
  acts: [
    'Take over a chore or task they find draining without being asked',
    'Anticipate their needs and act before they have to request help',
    'Follow through on promises and commitments reliably',
    'Help them with projects or errands even when it is inconvenient',
    'Make their life easier in small, practical ways every day',
  ],
  gifts: [
    'Remember meaningful dates and mark them with thoughtful presents',
    'Pick up small "thinking of you" gifts when you see something that reminds you of them',
    'Put effort into the presentation and wrapping, not just the item',
    'Create handmade or personalized gifts that show deep thought',
    'Keep a running list of things they mention wanting',
  ],
  time: [
    'Put away all devices and give your full, undivided attention',
    'Plan dedicated date nights or one-on-one experiences regularly',
    'Be fully present during conversations -- listen actively, make eye contact',
    'Share activities they enjoy, even if they are not your favorite',
    'Create rituals of connection like morning coffee together or evening walks',
  ],
  touch: [
    'Initiate physical affection without it leading to anything else',
    'Offer hugs, back rubs, and gentle touches throughout the day',
    'Hold hands when walking together or sitting side by side',
    'Be physically close -- sit next to them rather than across the room',
    'Remember that physical comfort during hard times means the world',
  ],
}

const RECEIVING_SIGNS = {
  words: [
    'You light up when someone says something kind or affirming',
    'Harsh words or criticism cut deeply and linger',
    'You save meaningful cards, letters, and messages',
    'Silence from a loved one feels like rejection',
    'Verbal encouragement fuels your motivation and confidence',
  ],
  acts: [
    'You feel most loved when someone helps without being asked',
    'Broken promises and laziness feel like betrayal',
    'You notice and deeply appreciate when someone goes out of their way for you',
    'You often express love by doing things for others',
    'Reliability and follow-through are essential to feeling secure',
  ],
  gifts: [
    'A thoughtful gift makes you feel seen and understood',
    'Forgotten occasions or thoughtless presents feel hurtful',
    'You treasure symbolic items and keepsakes',
    'The thought behind a gift matters far more than the price',
    'You remember gifts you have received and the stories behind them',
  ],
  time: [
    'Cancelled plans or distracted partners feel like abandonment',
    'You crave deep, uninterrupted conversations',
    'Shared experiences and adventures are your favorite memories',
    'You feel disconnected without regular quality time together',
    'Being truly listened to is the greatest gift someone can give you',
  ],
  touch: [
    'A hug can change your entire mood',
    'Physical distance or withholding touch feels like punishment',
    'You naturally reach out to touch people you care about',
    'Comfort through physical closeness heals you faster than words',
    'Cuddling, hand-holding, and proximity make you feel safe',
  ],
}

const RELATIONSHIP_TIPS = {
  words: [
    'Ask your partner what specific affirmations mean most to them',
    'Practice daily verbal appreciation -- make it a habit, not an afterthought',
    'During conflict, be mindful that harsh words will wound deeply',
    'Write love letters for special occasions and "just because" moments',
  ],
  acts: [
    'Create shared responsibility systems so no one feels overburdened',
    'Ask "How can I help today?" and actually follow through',
    'Remember that for this language, actions literally speak louder than words',
    'Do not keep score -- give freely and trust the reciprocity',
  ],
  gifts: [
    'Keep a wish list (mental or written) of things your partner mentions wanting',
    'The best gifts show you listen and remember -- it is never about the price',
    'Surprise gifts on ordinary days have more impact than obligatory holiday presents',
    'Create traditions around gift-giving that deepen your connection',
  ],
  time: [
    'Schedule uninterrupted time together as a non-negotiable priority',
    'Quality matters more than quantity -- be fully present',
    'Try new experiences together to keep the connection fresh',
    'Digital detox during together-time shows respect and care',
  ],
  touch: [
    'Initiate physical affection regularly, not only in romantic contexts',
    'Learn your partner\'s specific touch preferences and comfort level',
    'Physical presence during difficult moments communicates safety',
    'Non-sexual touch throughout the day builds emotional security',
  ],
}

const COMPATIBILITY_NOTES = {
  words: {
    words: 'Natural harmony -- both partners thrive on verbal affirmation and understand its power',
    acts: 'Complement each other: one expresses love verbally, the other through helpful action. Bridge by narrating your acts of service',
    gifts: 'Both are expressive languages. Words partner should verbalize the meaning behind gifts received',
    time: 'Words partner needs verbal connection; Time partner needs presence. Combine through deep conversation',
    touch: 'Both crave active expression. Pair affirming words with physical closeness for maximum impact',
  },
  acts: {
    words: 'Words partner should narrate appreciation for acts done. Acts partner should try expressing love verbally too',
    acts: 'Strong natural understanding -- both show love through doing. Be careful not to compete or keep score',
    gifts: 'Both are tangible languages. Acts partner can frame helpful gestures as "gifts of time and effort"',
    time: 'Acts partner shows love by doing; Time partner wants presence. Doing things together bridges both',
    touch: 'Both are physical/tangible languages. Combine helpful acts with physical affection for synergy',
  },
  gifts: {
    words: 'Gifts partner should explain the thought behind presents. Words partner should acknowledge gifts enthusiastically',
    acts: 'Frame thoughtful gifts as acts of love. Acts partner can "gift" their time and effort',
    gifts: 'Natural alignment -- both understand symbolic expressions of love. Create meaningful gift traditions',
    time: 'Experience-based gifts (trips, date nights) perfectly bridge both languages',
    touch: 'Pair gifts with physical delivery -- a hug with a present doubles the impact',
  },
  time: {
    words: 'Use quality time for deep conversation -- this naturally feeds both languages',
    acts: 'Do things together -- shared chores or projects satisfy both Time and Acts needs',
    gifts: 'Experience-based gifts (travel, adventures) are the perfect bridge between these languages',
    time: 'Deep natural compatibility -- protect your together-time fiercely and create shared rituals',
    touch: 'Physical closeness during quality time is the ultimate combination for both partners',
  },
  touch: {
    words: 'Combine verbal affirmation with physical affection -- say loving things while holding hands',
    acts: 'Physical help (massage after a hard day) bridges both languages beautifully',
    gifts: 'Give gifts with a hug. Physical delivery of presents satisfies both needs',
    time: 'Be physically close during quality time -- cuddle, hold hands, sit together',
    touch: 'Natural harmony -- physical connection is deeply understood. Respect boundaries and preferences',
  },
}

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

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const LANG_COLORS_INLINE = {
  words: { color: '#f0c040', bg: 'rgba(240,192,64,.08)',  border: 'rgba(240,192,64,.25)'  },
  acts:  { color: '#44ccaa', bg: 'rgba(68,204,170,.08)',  border: 'rgba(68,204,170,.25)'  },
  gifts: { color: '#dd88cc', bg: 'rgba(221,136,204,.08)', border: 'rgba(221,136,204,.25)' },
  time:  { color: '#88aaee', bg: 'rgba(136,170,238,.08)', border: 'rgba(136,170,238,.25)' },
  touch: { color: '#ee8866', bg: 'rgba(238,136,102,.08)', border: 'rgba(238,136,102,.25)' },
}

function LoveLangQuizInline({ onDone }) {
  const setLoveLanguage = useGolemStore(s => s.setLoveLanguage)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)

  const total = LOVE_LANG_QUESTIONS.length
  const q = LOVE_LANG_QUESTIONS[step]

  function handleChoice(lang) {
    const next = [...answers, lang]
    setAnswers(next)
    if (next.length >= total) {
      const profile = getLoveLanguageProfile(next)
      setResult(profile)
      setLoveLanguage(profile.primary?.name || profile.primary?.id)
    } else {
      setStep(step + 1)
    }
  }

  function handleRetake() {
    setStep(0); setAnswers([]); setResult(null)
  }

  if (result) {
    return (
      <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Quiz Result
        </div>
        <div style={{ fontSize: 40 }}>{result.primary?.emoji}</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 20, letterSpacing: '.1em',
          color: LANG_COLORS_INLINE[result.primary?.id]?.color || '#ee8866',
        }}>
          {result.primary?.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {result.primary?.desc}
        </div>
        {/* Score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left' }}>
          {LOVE_LANGUAGES.map(lang => {
            const score = result.scores[lang.id] || 0
            const pct = Math.round(score / total * 100)
            return (
              <div key={lang.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: LANG_COLORS_INLINE[lang.id]?.color }}>
                    {lang.emoji} {lang.name}
                  </span>
                  <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)' }}>
                    {score}/{total}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--secondary)' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: pct + '%',
                    background: LANG_COLORS_INLINE[lang.id]?.color, transition: 'width .6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 8,
          background: 'rgba(96,200,80,.08)', border: '1px solid rgba(96,200,80,.2)',
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', color: '#88dd44',
        }}>
          ✓ Saved to your profile
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={handleRetake} style={{
            padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
            fontSize: 12, fontFamily: '"Cinzel", serif', fontWeight: 600,
            letterSpacing: '.12em', textTransform: 'uppercase',
            background: 'var(--secondary)', border: '1px solid var(--border)',
            color: 'var(--muted-foreground)', transition: 'all .15s',
          }}>Retake</button>
          {onDone && (
            <button onClick={onDone} style={{
              padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
              border: '2px solid rgba(201,168,76,.8)',
              color: '#fff',
              transition: 'all .2s', position: 'relative', zIndex: 2,
              boxShadow: '0 2px 12px rgba(201,168,76,.25)',
            }}>Done</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Love Language Quiz
        </span>
        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)' }}>
          {step + 1} / {total}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: '#ee8866',
          width: `${((step + 1) / total) * 100}%`,
          transition: 'width .3s ease',
        }} />
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'var(--foreground)', lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' }}>
        Which matters more to you?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[q.a, q.b].map((opt, i) => (
          <div
            key={i}
            onClick={() => handleChoice(opt.lang)}
            style={{
              padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              background: 'var(--secondary)', border: '1px solid var(--border)',
              transition: 'all .2s', textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(238,136,102,.35)'; e.currentTarget.style.background = 'rgba(238,136,102,.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--secondary)' }}
          >
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.15em',
              color: LANG_COLORS_INLINE[opt.lang]?.color, marginBottom: 4, textTransform: 'uppercase',
            }}>
              {LOVE_LANGUAGES.find(l => l.id === opt.lang)?.emoji}{' '}
              {LOVE_LANGUAGES.find(l => l.id === opt.lang)?.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{opt.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoveLangDetail() {
  const loveLanguage = useGolemStore((s) => (s.activeViewProfile || s.primaryProfile)?.loveLanguage)
  const setLoveLanguage = useGolemStore((s) => s.setLoveLanguage)
  const [showQuiz, setShowQuiz] = useState(false)

  const primary = loveLanguage
    ? LOVE_LANGUAGES.find(l => l.name === loveLanguage)
    : null

  // If no love language is set, show empty state with inline quiz
  if (!primary) {
    return (
      <div style={S.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold)' }}>Love Language</div>
          <AboutSystemButton systemName="Love Language" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: '24px 32px' }}>
          <div style={{ fontSize: 28 }}>💝</div>
          <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold)' }}>Love Language</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
            How you give and receive love — Words, Touch, Time, Acts, or Gifts.
          </div>
        </div>
        <div>
          <div style={S.sectionTitle}>Discover Your Love Language</div>
          <LoveLangQuizInline />
        </div>
      </div>
    )
  }

  const primaryColor = COLORS[primary.id]
  // Secondary: pick the next language in the list (wrapping)
  const primaryIdx = LOVE_LANGUAGES.findIndex(l => l.id === primary.id)
  const secondaryIdx = (primaryIdx + 1) % 5
  const secondary = LOVE_LANGUAGES[secondaryIdx]
  const secondaryColor = COLORS[secondary.id]

  // Simulated score distribution (primary highest, others distributed)
  const scores = {}
  LOVE_LANGUAGES.forEach((l, i) => {
    if (l.id === primary.id) scores[l.id] = 8
    else if (l.id === secondary.id) scores[l.id] = 5
    else scores[l.id] = 2 + (i % 2)
  })
  const maxScore = Math.max(...Object.values(scores))

  return (
    <div style={S.panel}>
      {/* HEADER + RETAKE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{primary.emoji} Love Languages</div>
          <AboutSystemButton systemName="Love Language" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <div></div>
          <button
            onClick={() => setShowQuiz(!showQuiz)}
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
            {showQuiz ? "Cancel" : "Retake Quiz"}
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          How you give and receive love -- understanding your emotional connection style
        </div>
      </div>

      {/* INLINE QUIZ — shown when retake is triggered */}
      {showQuiz && (
        <div>
          <div style={S.sectionTitle}>Retake Quiz</div>
          <LoveLangQuizInline onDone={() => setShowQuiz(false)} />
        </div>
      )}

      {/* CANVAS SYMBOL */}
      <div>
        <div style={S.sectionTitle}>Love Language Map</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 380, position: 'relative' }}>
          <LoveLangSymbol />
        </div>
      </div>

      {/* PRIMARY LANGUAGE */}
      <div>
        <div style={S.sectionTitle}>Primary Language</div>
        <div style={{
          ...S.glass,
          background: hexToRgba(primaryColor, .04),
          borderColor: hexToRgba(primaryColor, .2),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: 28,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: hexToRgba(primaryColor, .1), border: `2px solid ${hexToRgba(primaryColor, .3)}`,
            fontSize: 40,
          }}>{primary.emoji}</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: primaryColor, letterSpacing: '.12em' }}>
            {primary.name}
          </div>
          <span style={S.badge(hexToRgba(primaryColor, .1), hexToRgba(primaryColor, .3), primaryColor)}>Primary</span>
          <div style={{ fontSize: 14, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.6, maxWidth: 400 }}>
            {primary.desc}
          </div>
        </div>
      </div>

      {/* SECONDARY LANGUAGE */}
      <div>
        <div style={S.sectionTitle}>Secondary Language</div>
        <div style={{
          ...S.glass,
          background: hexToRgba(secondaryColor, .03),
          borderColor: hexToRgba(secondaryColor, .15),
          display: 'flex', alignItems: 'center', gap: 16, padding: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: hexToRgba(secondaryColor, .08), border: `1.5px solid ${hexToRgba(secondaryColor, .2)}`,
            fontSize: 28, flexShrink: 0,
          }}>{secondary.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: secondaryColor, letterSpacing: '.1em' }}>
                {secondary.name}
              </span>
              <span style={S.badge(hexToRgba(secondaryColor, .08), hexToRgba(secondaryColor, .2), secondaryColor)}>Secondary</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
              {secondary.desc}
            </div>
          </div>
        </div>
      </div>

      {/* SCORE DISTRIBUTION */}
      <div>
        <div style={S.sectionTitle}>Score Distribution</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LOVE_LANGUAGES.map((lang) => {
            const color = COLORS[lang.id]
            const score = scores[lang.id]
            const pct = (score / maxScore) * 100
            const isPrimary = lang.id === primary.id
            const isSec = lang.id === secondary.id
            return (
              <div key={lang.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{lang.emoji}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.1em',
                      color: isPrimary ? color : isSec ? color : 'var(--muted-foreground)',
                      fontWeight: isPrimary ? 700 : 400,
                    }}>{lang.name}</span>
                    <span style={{ ...S.monoSm, color: isPrimary ? color : 'var(--muted-foreground)', fontSize: 10 }}>
                      {score}/{maxScore}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--secondary)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: isPrimary
                        ? `linear-gradient(90deg, ${hexToRgba(color, .6)}, ${hexToRgba(color, .9)})`
                        : isSec
                        ? `linear-gradient(90deg, ${hexToRgba(color, .3)}, ${hexToRgba(color, .55)})`
                        : hexToRgba(color, .2),
                      width: `${pct}%`,
                      transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* HOW TO EXPRESS LOVE (GIVING) */}
      <div>
        <div style={S.sectionTitle}>How to Express Love ({primary.name})</div>
        <div style={{
          ...S.glass,
          background: hexToRgba(primaryColor, .02),
          borderColor: hexToRgba(primaryColor, .12),
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: hexToRgba(primaryColor, .6), marginBottom: 4 }}>
            Giving -- How to show love to someone with this language
          </div>
          {(GIVING_TIPS[primary.id] || []).map((tip, i) => (
            <div key={i} style={{ ...S.row, padding: '10px 14px' }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 12, color: primaryColor,
                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: hexToRgba(primaryColor, .08), border: `1px solid ${hexToRgba(primaryColor, .15)}`,
                flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HOW YOU FEEL LOVED (RECEIVING) */}
      <div>
        <div style={S.sectionTitle}>How You Feel Loved ({primary.name})</div>
        <div style={{
          ...S.glass,
          background: hexToRgba(primaryColor, .02),
          borderColor: hexToRgba(primaryColor, .12),
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: hexToRgba(primaryColor, .6), marginBottom: 4 }}>
            Receiving -- Signs this is your primary love language
          </div>
          {(RECEIVING_SIGNS[primary.id] || []).map((sign, i) => (
            <div key={i} style={{ ...S.row, padding: '10px 14px' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: hexToRgba(primaryColor, .5),
              }} />
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{sign}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RELATIONSHIP TIPS */}
      <div>
        <div style={S.sectionTitle}>Relationship Tips</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(RELATIONSHIP_TIPS[primary.id] || []).map((tip, i) => (
            <div key={i} style={{ ...S.row, padding: '10px 14px' }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 14, color: 'var(--foreground)',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--accent)',
                flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ALL 5 LANGUAGES OVERVIEW */}
      <div>
        <div style={S.sectionTitle}>The Five Love Languages</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LOVE_LANGUAGES.map((lang) => {
            const color = COLORS[lang.id]
            const isPrimary = lang.id === primary.id
            const isSec = lang.id === secondary.id
            return (
              <div key={lang.id} style={{
                ...S.row,
                borderColor: isPrimary ? hexToRgba(color, .25) : isSec ? hexToRgba(color, .15) : 'var(--border)',
                background: isPrimary ? hexToRgba(color, .06) : isSec ? hexToRgba(color, .03) : 'var(--secondary)',
                padding: '12px 14px',
              }}>
                <span style={{
                  fontSize: 24, width: 40, textAlign: 'center', flexShrink: 0,
                }}>{lang.emoji}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '.08em',
                      color: isPrimary ? color : isSec ? color : 'var(--foreground)',
                      fontWeight: isPrimary ? 700 : 400,
                    }}>{lang.name}</span>
                    {isPrimary && <span style={S.badge(hexToRgba(color, .1), hexToRgba(color, .3), color)}>Primary</span>}
                    {isSec && <span style={S.badge(hexToRgba(color, .06), hexToRgba(color, .2), color)}>Secondary</span>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {lang.desc}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* COMPATIBILITY NOTES */}
      <div>
        <div style={S.sectionTitle}>Compatibility</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: hexToRgba(primaryColor, .6), marginBottom: 2 }}>
            How {primary.name} pairs with each language
          </div>
          {LOVE_LANGUAGES.map((lang) => {
            const color = COLORS[lang.id]
            const note = COMPATIBILITY_NOTES[primary.id]?.[lang.id] || ''
            const isSelf = lang.id === primary.id
            return (
              <div key={lang.id} style={{
                display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 8,
                background: isSelf ? hexToRgba(primaryColor, .04) : 'var(--secondary)',
                border: `1px solid ${isSelf ? hexToRgba(primaryColor, .15) : 'var(--border)'}`,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center' }}>{lang.emoji}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.08em',
                      color: isSelf ? primaryColor : color,
                    }}>{primary.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>&</span>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.08em',
                      color,
                    }}>{lang.name}</span>
                    {isSelf && <span style={S.badge(hexToRgba(primaryColor, .08), hexToRgba(primaryColor, .2), primaryColor)}>Same</span>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {note}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* READING */}
      <div>
        <div style={S.sectionTitle}>Profile Reading</div>
        <div style={S.interpretation}>
          Your primary love language is <span style={{ color: primaryColor }}>{primary.name}</span> {primary.emoji}.
          This means you feel most deeply connected and cherished through {primary.desc.toLowerCase()}.
          Your secondary language, <span style={{ color: secondaryColor }}>{secondary.name}</span>,
          adds another dimension to how you experience affection -- through {secondary.desc.toLowerCase()}.
          In relationships, the key is communicating your needs clearly: when your partner speaks your love language,
          even small gestures carry enormous emotional weight. Conversely, when these needs go unmet, you may feel
          unloved even when love is being expressed in other ways. Understanding your love language is a bridge
          to deeper intimacy and more fulfilling connections.
        </div>
      </div>
    </div>
  )
}
