import { useState } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { ARCHETYPES, getArchetypeQuestions, getArchetypeProfile } from '../../engines/archetypeEngine'
import ArchetypeSymbol from '../canvas/ArchetypeSymbol'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ── Quadrant groupings ── */
const QUADRANTS = [
  { name: 'Soul', motto: 'Yearning for Paradise', types: ['The Innocent', 'The Explorer', 'The Sage'], color: 'rgba(100,180,255,', description: 'The Soul types seek connection to something greater. They are driven by a longing for meaning, truth, and transcendence. Their journey is inward and upward.' },
  { name: 'Ego', motto: 'Leaving a Mark on the World', types: ['The Hero', 'The Outlaw', 'The Magician'], color: 'rgba(255,100,80,', description: 'The Ego types seek mastery and impact. They are driven by willpower, courage, and the desire to transform reality. Their journey is one of agency and power.' },
  { name: 'Self', motto: 'Connection and Belonging', types: ['The Lover', 'The Jester', 'The Everyman'], color: 'rgba(220,120,255,', description: 'The Self types seek intimacy, joy, and belonging. They are driven by the heart and the desire for authentic connection. Their journey is relational and present.' },
  { name: 'Order', motto: 'Providing Structure', types: ['The Caregiver', 'The Creator', 'The Ruler'], color: 'rgba(96,200,80,', description: 'The Order types seek to build, nurture, and organize. They are driven by responsibility, vision, and the desire to leave lasting structures. Their journey is generative.' },
]

/* ── Extended archetype data ── */
const ARCHETYPE_EXTENDED = {
  'The Innocent': {
    lightExpression: 'Trusting, optimistic, sees the good in everything. Brings hope and renewal to others. Lives with childlike wonder and genuine faith.',
    shadowExpression: 'Naive denial of problems. Refuses to see danger or darkness. Can become dependent, passive, or blindly obedient to authority.',
    integration: 'Integrate the shadow by acknowledging that the world contains both light and dark. Develop discernment without losing faith. Learn to trust wisely rather than blindly.',
    examples: 'Forrest Gump, Dorothy (Wizard of Oz), Buddha (early life), Mr. Rogers',
    relationships: { ally: 'The Sage', tension: 'The Outlaw', complement: 'The Caregiver' },
  },
  'The Explorer': {
    lightExpression: 'Independent, brave, seeks authenticity through journey and discovery. Inspires others to break free from convention and find their own path.',
    shadowExpression: 'Chronic wandering without purpose. Inability to commit. Becomes a misfit or drifter, always running from rather than toward something.',
    integration: 'Integrate the shadow by finding freedom within commitment. Learn that true autonomy includes the courage to stay, not just the courage to leave.',
    examples: 'Indiana Jones, Amelia Earhart, Jack Kerouac, Huckleberry Finn',
    relationships: { ally: 'The Outlaw', tension: 'The Ruler', complement: 'The Sage' },
  },
  'The Sage': {
    lightExpression: 'Wise, thoughtful, seeks truth through knowledge and reflection. Offers clarity and understanding to others. Values intelligence and discernment.',
    shadowExpression: 'Ivory tower detachment. Becomes dogmatic, judgmental, or paralyzed by over-analysis. Uses knowledge as a weapon or shield against feeling.',
    integration: 'Integrate the shadow by connecting wisdom to lived experience. Move from knowing about life to knowing life directly. Let the heart inform the mind.',
    examples: 'Gandalf, Socrates, Yoda, Oprah Winfrey',
    relationships: { ally: 'The Innocent', tension: 'The Jester', complement: 'The Explorer' },
  },
  'The Hero': {
    lightExpression: 'Courageous, disciplined, rises to meet challenges. Inspires others through bravery and sacrifice. Proves worth through mastery and noble action.',
    shadowExpression: 'Arrogant, workaholic, needs an enemy to feel alive. Becomes a bully or obsessive competitor. Cannot rest or show vulnerability.',
    integration: 'Integrate the shadow by embracing vulnerability as strength. Learn that true courage includes the willingness to be soft, to rest, and to ask for help.',
    examples: 'Wonder Woman, Luke Skywalker, Malala Yousafzai, Achilles',
    relationships: { ally: 'The Magician', tension: 'The Caregiver', complement: 'The Outlaw' },
  },
  'The Outlaw': {
    lightExpression: 'Revolutionary, breaks unjust rules, fights for the oppressed. Brings radical authenticity and disrupts stagnant systems with fierce truth.',
    shadowExpression: 'Destructive, nihilistic, rebels without a cause. Can become criminal, self-sabotaging, or addicted to chaos and transgression.',
    integration: 'Integrate the shadow by channeling rebellion into creation. Learn that true liberation includes building, not just tearing down. Find the cause worth fighting for.',
    examples: 'Robin Hood, Prometheus, Malcolm X, V (V for Vendetta)',
    relationships: { ally: 'The Explorer', tension: 'The Innocent', complement: 'The Hero' },
  },
  'The Magician': {
    lightExpression: 'Visionary, catalytic, transforms consciousness and reality. Sees the deeper patterns and helps others see them too. Makes the impossible possible.',
    shadowExpression: 'Manipulative, uses power for selfish ends. Becomes a con artist, cult leader, or sorcerer who bends others\' will to serve their own.',
    integration: 'Integrate the shadow by using power in service of others. Practice transparency and consent. Transform yourself before attempting to transform the world.',
    examples: 'Nikola Tesla, Merlin, Steve Jobs, Dr. Strange',
    relationships: { ally: 'The Hero', tension: 'The Everyman', complement: 'The Creator' },
  },
  'The Lover': {
    lightExpression: 'Passionate, devoted, celebrates beauty and intimacy. Brings warmth, sensuality, and deep emotional connection. Makes others feel truly seen and desired.',
    shadowExpression: 'Obsessive, loses self in others. Becomes jealous, possessive, or addicted to romance. Sacrifices identity for the sake of relationship.',
    integration: 'Integrate the shadow by learning to love without losing yourself. Develop the capacity for solitude alongside intimacy. Love from wholeness, not from need.',
    examples: 'Romeo and Juliet, Aphrodite, Rumi, Frida Kahlo',
    relationships: { ally: 'The Jester', tension: 'The Sage', complement: 'The Caregiver' },
  },
  'The Jester': {
    lightExpression: 'Playful, joyful, brings lightness and humor. Sees through pretension and helps others not take themselves too seriously. Lives fully in the present moment.',
    shadowExpression: 'Frivolous, avoids responsibility, uses humor to deflect pain. Becomes cruel in comedy, self-destructive in pleasure-seeking, or manic in escapism.',
    integration: 'Integrate the shadow by allowing depth alongside lightness. Learn that joy and sorrow are not enemies. Use humor as medicine, not as armor.',
    examples: 'Charlie Chaplin, The Fool (Tarot), Jim Carrey, Puck (Shakespeare)',
    relationships: { ally: 'The Lover', tension: 'The Ruler', complement: 'The Everyman' },
  },
  'The Everyman': {
    lightExpression: 'Empathic, grounded, connects with all people. Brings democratic values and genuine belonging. Valued for authenticity and realism.',
    shadowExpression: 'Mediocre, gives up uniqueness to fit in. Becomes a victim, doormat, or mob member. Abandons individuality out of fear of standing out.',
    integration: 'Integrate the shadow by honoring your uniqueness within community. Learn that true belonging does not require self-erasure. Stand out and still belong.',
    examples: 'Bilbo Baggins, The Common Man, Tom Hanks characters, Samwise Gamgee',
    relationships: { ally: 'The Caregiver', tension: 'The Magician', complement: 'The Jester' },
  },
  'The Caregiver': {
    lightExpression: 'Compassionate, generous, nurtures others selflessly. Creates safety and support. Motivated by genuine love and desire to protect and serve.',
    shadowExpression: 'Martyr, enables dysfunction, gives to control. Becomes exhausted, resentful, or manipulative through guilt. Loses self in service to others.',
    integration: 'Integrate the shadow by learning to care for yourself first. Set boundaries without guilt. Understand that helping others sometimes means letting them struggle.',
    examples: 'Mother Teresa, Mary Poppins, Florence Nightingale, Hagrid',
    relationships: { ally: 'The Everyman', tension: 'The Hero', complement: 'The Lover' },
  },
  'The Creator': {
    lightExpression: 'Innovative, imaginative, brings new things into being. Driven by the urge to express and manifest vision. Values originality and artistic integrity.',
    shadowExpression: 'Perfectionist, never finishes or releases work. Becomes obsessive, precious, or self-indulgent. Creates for ego rather than for the work itself.',
    integration: 'Integrate the shadow by embracing imperfection as part of creation. Ship the work. Let others interact with it. Create from service, not just self-expression.',
    examples: 'Leonardo da Vinci, Coco Chanel, George Lucas, Frida Kahlo',
    relationships: { ally: 'The Ruler', tension: 'The Explorer', complement: 'The Magician' },
  },
  'The Ruler': {
    lightExpression: 'Responsible, commanding, creates order and prosperity. Brings leadership, stability, and vision for collective wellbeing. Empowers others through structure.',
    shadowExpression: 'Tyrannical, controlling, power-hungry. Becomes authoritarian, rigid, or paranoid. Uses authority to suppress rather than empower.',
    integration: 'Integrate the shadow by leading through service rather than control. Distribute power rather than hoard it. Build structures that empower others to lead themselves.',
    examples: 'King Arthur, Margaret Thatcher, Winston Churchill, T\'Challa',
    relationships: { ally: 'The Creator', tension: 'The Jester', complement: 'The Caregiver' },
  },
}

/* ── Relationship dynamics matrix ── */
const DYNAMICS = [
  { pair: ['Soul', 'Ego'], desc: 'Soul types bring meaning and idealism; Ego types bring action and willpower. Together they create purposeful heroism.' },
  { pair: ['Soul', 'Self'], desc: 'Soul types bring depth and transcendence; Self types bring warmth and belonging. Together they create heartfelt wisdom.' },
  { pair: ['Soul', 'Order'], desc: 'Soul types bring vision and truth; Order types bring structure and care. Together they create sacred institutions.' },
  { pair: ['Ego', 'Self'], desc: 'Ego types bring ambition and mastery; Self types bring connection and joy. Together they create empowered communities.' },
  { pair: ['Ego', 'Order'], desc: 'Ego types bring transformation and courage; Order types bring stability and generosity. Together they create revolutionary systems.' },
  { pair: ['Self', 'Order'], desc: 'Self types bring authenticity and empathy; Order types bring leadership and creativity. Together they create nurturing civilizations.' },
]

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

function getQuadrant(archetypeName) {
  return QUADRANTS.find(q => q.types.includes(archetypeName))
}

/* ── Mini Quiz ── */
function ArchetypeQuiz() {
  const setArchetypeType = useGolemStore((s) => s.setArchetypeType)
  const questions = getArchetypeQuestions()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleAnswer = (archetypeName) => {
    const newAnswers = [...answers, archetypeName]
    setAnswers(newAnswers)
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      const profile = getArchetypeProfile(newAnswers)
      setResult(profile)
      setArchetypeType(profile.name)
      setSaved(true)
    }
  }

  const reset = () => { setStep(0); setAnswers([]); setResult(null); setSaved(false) }

  if (result) {
    const q = getQuadrant(result.name)
    return (
      <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Quiz Result
        </div>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(201,168,76,.08)', border: '2px solid rgba(201,168,76,.3)',
          fontFamily: "'Cinzel', serif", fontSize: 14, color: '#c9a84c', letterSpacing: '.05em',
        }}>{result.name.replace('The ', '')}</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)', letterSpacing: '.1em' }}>
          {result.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['Drive', result.drive],
            ['Gift', result.gift],
            ['Shadow', result.shadow],
          ].map(([lbl, val], i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 10,
              background: i === 0 ? 'var(--accent)' : 'var(--secondary)',
              border: `1px solid ${i === 0 ? 'rgba(201,168,76,.3)' : 'rgba(255,255,255,.08)'}`,
              color: i === 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontFamily: "'Inconsolata', monospace",
            }}>
              {lbl}: {val}
            </span>
          ))}
        </div>
        {q && (
          <div style={{ fontSize: 11, color: q.color + '0.7)', fontFamily: "'Inconsolata', monospace" }}>
            {q.name} Quadrant -- {q.motto}
          </div>
        )}
        {saved && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(96,200,80,.08)', border: '1px solid rgba(96,200,80,.2)',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', color: '#88dd44',
          }}>Saved to your profile</div>
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

  const q = questions[step]
  return (
    <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Archetype Finder
        </span>
        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)' }}>
          {step + 1} / {questions.length}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: 'var(--foreground)',
          width: `${((step + 1) / questions.length) * 100}%`,
          transition: 'width .3s ease',
        }} />
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'var(--foreground)', lineHeight: 1.5 }}>
        {q.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {q.options.map((opt, i) => (
          <div key={i} onClick={() => handleAnswer(opt.archetype)} style={{
            ...S.row, cursor: 'pointer', padding: '10px 14px',
            transition: 'all .2s',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
              fontFamily: "'Cinzel', serif", fontSize: 10, color: 'var(--foreground)',
            }}>{String.fromCharCode(65 + i)}</span>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ArchetypeDetail() {
  const archetypeType = useGolemStore((s) => (s.activeViewProfile || s.primaryProfile)?.archetypeType)
  const setArchetypeType = useGolemStore((s) => s.setArchetypeType)
  const [showQuiz, setShowQuiz] = useState(false)

  // No archetype type -- show empty state with quiz
  if (!archetypeType) {
    return (
      <div style={S.panel}>
          <div>
          <div style={S.heading}>{'\u2726'} Jungian Archetypes</div>
          <AboutSystemButton systemName="Archetype" />
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            Discover your primary archetype -- the mythic pattern that shapes your psyche
          </div>
        </div>
        <div>
          <div style={S.sectionTitle}>Discover Your Archetype</div>
          <ArchetypeQuiz />
        </div>
      </div>
    )
  }

  const activeArch = ARCHETYPES.find(a => a.name === archetypeType)
  if (!activeArch) return null
  const ext = ARCHETYPE_EXTENDED[archetypeType] || {}
  const quadrant = getQuadrant(archetypeType)
  const qColor = quadrant?.color || 'rgba(201,168,76,'

  // Find relationship archetypes
  const allyArch = ext.relationships ? ARCHETYPES.find(a => a.name === ext.relationships.ally) : null
  const tensionArch = ext.relationships ? ARCHETYPES.find(a => a.name === ext.relationships.tension) : null
  const complementArch = ext.relationships ? ARCHETYPES.find(a => a.name === ext.relationships.complement) : null

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={S.heading}>{'\u2726'} Jungian Archetypes</div>
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
        <AboutSystemButton systemName="Archetype" />
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          The mythic pattern that shapes your psyche, relationships, and life narrative
        </div>
      </div>

      {/* INLINE QUIZ — shown when retake is triggered */}
      {showQuiz && (
        <div>
          <div style={S.sectionTitle}>Retake Quiz</div>
          <ArchetypeQuiz />
        </div>
      )}

      {/* ARCHETYPE SYMBOL CANVAS */}
      <div>
        <div style={S.sectionTitle}>Archetype Wheel</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 420, position: 'relative' }}>
          <ArchetypeSymbol />
        </div>
      </div>

      {/* Retake quiz moved to header */}

      {/* PRIMARY ARCHETYPE */}
      <div>
        <div style={S.sectionTitle}>Primary Archetype</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,168,76,.08)', border: '2px solid rgba(201,168,76,.3)',
              fontFamily: "'Cinzel', serif", fontSize: 11, color: '#c9a84c',
              letterSpacing: '.05em', textAlign: 'center', lineHeight: 1.2,
            }}>{activeArch.name.replace('The ', '')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: 'var(--foreground)', letterSpacing: '.12em' }}>
                {activeArch.name}
              </div>
              {quadrant && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={S.badge(qColor + '0.08)', qColor + '0.3)', qColor + '0.8)')}>{quadrant.name} Quadrant</span>
                  <span style={{ ...S.monoSm, fontStyle: 'italic' }}>{quadrant.motto}</span>
                </div>
              )}
            </div>
          </div>
          {[
            ['Drive', activeArch.drive],
            ['Core Fear', activeArch.fear],
            ['Gift', activeArch.gift],
            ['Shadow', activeArch.shadow],
          ].map(([lbl, val], i) => (
            <div key={i} style={S.keyVal}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em',
                textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 120,
              }}>{lbl}</span>
              <span style={{
                ...S.mono,
                color: lbl === 'Shadow' ? '#ee5544' : lbl === 'Gift' ? '#88dd44' : 'var(--foreground)',
              }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHT vs SHADOW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          ...S.glass,
          background: 'rgba(96,200,80,.04)', borderColor: 'rgba(96,200,80,.15)',
          padding: '20px 18px',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(96,200,80,.6)', marginBottom: 8 }}>
            Light Expression
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {ext.lightExpression || 'Living fully in alignment with the archetype\'s gifts and drive.'}
          </div>
        </div>
        <div style={{
          ...S.glass,
          background: 'rgba(220,60,60,.04)', borderColor: 'rgba(220,60,60,.15)',
          padding: '20px 18px',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(220,60,60,.6)', marginBottom: 8 }}>
            Shadow Expression
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {ext.shadowExpression || 'The archetype\'s pattern distorted by fear and unconscious drives.'}
          </div>
        </div>
      </div>

      {/* QUADRANT EXPLANATION */}
      {quadrant && (
        <div>
          <div style={S.sectionTitle}>{quadrant.name} Family</div>
          <div style={{ ...S.glass, borderColor: qColor + '0.15)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {quadrant.description}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quadrant.types.map((tName, i) => {
                const arch = ARCHETYPES.find(a => a.name === tName)
                const isActive = tName === archetypeType
                return (
                  <div key={i} style={{
                    ...S.row, flex: '1 1 auto', minWidth: 140,
                    borderColor: isActive ? 'rgba(201,168,76,.25)' : 'var(--border)',
                    background: isActive ? 'rgba(201,168,76,.06)' : 'var(--secondary)',
                    flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '12px 14px',
                  }}>
                    <span style={{
                      ...S.mono, fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#c9a84c' : 'var(--foreground)', fontSize: 13,
                    }}>{tName}</span>
                    <span style={{ ...S.monoSm, fontSize: 10 }}>Drive: {arch?.drive}</span>
                    <span style={{ ...S.monoSm, fontSize: 10 }}>Gift: {arch?.gift}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATION PATH */}
      <div>
        <div style={S.sectionTitle}>Integration Path</div>
        <div style={{
          ...S.glass,
          background: 'rgba(201,168,76,.02)', borderColor: 'rgba(201,168,76,.12)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 8 }}>
            Integrating the Shadow of {activeArch.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.7, fontStyle: 'italic' }}>
            {ext.integration || `The path to wholeness involves acknowledging the shadow of ${activeArch.shadow.toLowerCase()} and transforming it through conscious awareness. By embracing both the light (${activeArch.gift.toLowerCase()}) and the dark (${activeArch.shadow.toLowerCase()}), you integrate the full spectrum of ${activeArch.name}.`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 18 }}>{'\u2728'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ ...S.mono, fontSize: 11, color: '#88dd44' }}>Gift: {activeArch.gift}</span>
              <span style={{ ...S.monoSm, margin: '0 8px' }}>{'\u2194'}</span>
              <span style={{ ...S.mono, fontSize: 11, color: '#ee5544' }}>Shadow: {activeArch.shadow}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAMOUS EXAMPLES */}
      {ext.examples && (
        <div>
          <div style={S.sectionTitle}>Famous Examples</div>
          <div style={{ ...S.glass, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ext.examples.split(', ').map((ex, i) => (
              <span key={i} style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12,
                background: 'var(--secondary)', border: '1px solid var(--border)',
                color: 'var(--foreground)', fontFamily: "'Inconsolata', monospace",
              }}>{ex}</span>
            ))}
          </div>
        </div>
      )}

      {/* RELATIONSHIP DYNAMICS */}
      {ext.relationships && (
        <div>
          <div style={S.sectionTitle}>Relationship Dynamics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Natural Ally', arch: allyArch, color: '#88dd44', colorBg: 'rgba(96,200,80,.06)', colorBorder: 'rgba(96,200,80,.15)', desc: 'Shares core values and amplifies your gifts. A natural partnership.' },
              { label: 'Creative Tension', arch: tensionArch, color: '#ee5544', colorBg: 'rgba(220,60,60,.04)', colorBorder: 'rgba(220,60,60,.12)', desc: 'Challenges your worldview. Friction that catalyzes growth when engaged consciously.' },
              { label: 'Complement', arch: complementArch, color: '#c9a84c', colorBg: 'rgba(201,168,76,.04)', colorBorder: 'rgba(201,168,76,.12)', desc: 'Fills what you lack. Together you cover a wider range of the human experience.' },
            ].map((item, i) => item.arch && (
              <div key={i} style={{
                ...S.row, padding: '14px 16px',
                background: item.colorBg, borderColor: item.colorBorder,
                flexDirection: 'column', alignItems: 'flex-start', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <span style={S.badge(item.colorBg, item.colorBorder, item.color)}>{item.label}</span>
                  <span style={{ ...S.mono, color: item.color, fontSize: 13 }}>{item.arch.name}</span>
                  <span style={{ ...S.monoSm, marginLeft: 'auto', fontSize: 10 }}>Drive: {item.arch.drive}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUADRANT DYNAMICS */}
      <div>
        <div style={S.sectionTitle}>Quadrant Dynamics</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DYNAMICS.map((d, i) => {
            const isRelevant = quadrant && d.pair.includes(quadrant.name)
            return (
              <div key={i} style={{
                ...S.row, padding: '10px 14px',
                background: isRelevant ? 'rgba(201,168,76,.04)' : 'var(--secondary)',
                borderColor: isRelevant ? 'rgba(201,168,76,.15)' : 'var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 6, minWidth: 100 }}>
                  {d.pair.map((p, j) => {
                    const pq = QUADRANTS.find(q => q.name === p)
                    return (
                      <span key={j} style={S.badge(pq.color + '0.08)', pq.color + '0.25)', pq.color + '0.7)')}>{p}</span>
                    )
                  })}
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{d.desc}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ALL 12 ARCHETYPES GRID */}
      <div>
        <div style={S.sectionTitle}>All Twelve Archetypes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {ARCHETYPES.map((arch, i) => {
            const isActive = arch.name === archetypeType
            const aq = getQuadrant(arch.name)
            const ac = aq?.color || 'rgba(201,168,76,'
            return (
              <div key={i} onClick={() => setArchetypeType(arch.name)} style={{
                ...S.glass, padding: '14px 16px', cursor: 'pointer',
                borderColor: isActive ? 'rgba(201,168,76,.3)' : 'var(--border)',
                background: isActive ? 'rgba(201,168,76,.06)' : 'var(--card)',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    ...S.mono, fontSize: 12, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#c9a84c' : 'var(--foreground)',
                  }}>{arch.name}</span>
                  {aq && <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: ac + (isActive ? '0.6)' : '0.25)'),
                  }} />}
                </div>
                <div style={{ ...S.monoSm, fontSize: 10 }}>Drive: {arch.drive}</div>
                <div style={{ ...S.monoSm, fontSize: 10, color: '#88dd44' }}>Gift: {arch.gift}</div>
                <div style={{ ...S.monoSm, fontSize: 10, color: '#ee5544' }}>Shadow: {arch.shadow}</div>
                <div style={{ ...S.monoSm, fontSize: 10 }}>Fear: {arch.fear}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PROFILE READING */}
      <div>
        <div style={S.sectionTitle}>Profile Reading</div>
        <div style={S.interpretation}>
          As <span style={{ color: 'var(--foreground)' }}>{activeArch.name}</span>, you are driven by a deep need for{' '}
          <span style={{ color: '#c9a84c' }}>{activeArch.drive.toLowerCase()}</span>, and your greatest gift to the world is{' '}
          <span style={{ color: '#88dd44' }}>{activeArch.gift.toLowerCase()}</span>.{' '}
          {quadrant && <>You belong to the <span style={{ color: 'var(--foreground)' }}>{quadrant.name}</span> family,{' '}
          whose collective motto is "{quadrant.motto}." </>}
          Your core fear -- <span style={{ color: '#ee5544' }}>{activeArch.fear.toLowerCase()}</span> -- is the wound that both
          drives and limits you. When this fear runs unconscious, it manifests as{' '}
          <span style={{ color: '#ee5544' }}>{activeArch.shadow.toLowerCase()}</span>, the shadow side of your archetype.{' '}
          The path to wholeness involves neither repressing nor acting out the shadow, but holding it
          with awareness until it transforms into deeper wisdom.{' '}
          {allyArch && <>Your natural ally is <span style={{ color: '#88dd44' }}>{allyArch.name}</span>,{' '}
          while <span style={{ color: '#ee5544' }}>{tensionArch?.name}</span> challenges you to grow beyond
          your comfort zone. </>}
          Embrace both the light and the shadow to embody {activeArch.name} fully.
        </div>
      </div>
    </div>
  )
}
