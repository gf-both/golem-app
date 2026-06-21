import { useMemo, useState } from 'react'
import HumanDesign from '../canvas/HumanDesign'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { computeHDChart } from '../../engines/hdEngine'
import { PLANET_SYMBOLS, PLANET_ORDER } from '../../data/hdData'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ─── Fallback static profile (generic — shown only when no birth data is available) ── */
const FALLBACK = {
  type: '—', strategy: '—',
  authority: '—', profile: '—',
  profileNames: '', definition: '—',
  cross: null,
  notSelf: '—', signature: '—',
  personality: null,
  design: null,
  centers: {
    HEAD: { defined: false }, AJNA: { defined: false },
    THROAT: { defined: false }, G_SELF: { defined: false },
    HEART: { defined: false }, SACRAL: { defined: false },
    SPLEEN: { defined: false }, SOLAR: { defined: false }, ROOT: { defined: false },
  },
  activeChannels: [],
  designDate: null,
}

/* ─── Planet names for labels ────────────────────────────────────────────── */
const PLANET_NAMES = {
  sun: 'Sun', earth: 'Earth', moon: 'Moon',
  northNode: 'North Node', southNode: 'South Node',
  mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
  neptune: 'Neptune', pluto: 'Pluto',
}

/* ─── Gate descriptions ──────────────────────────────────────────────────── */
const GATE_DESCRIPTIONS = {
  41: 'Decrease', 31: 'Influence', 28: 'The Great', 27: 'Nourishment',
  7: 'The Army', 13: 'Fellowship', 33: 'Retreat', 19: 'Approach',
  49: 'Revolution', 54: 'The Marrying Maiden', 32: 'Duration', 53: 'Development',
  1: 'Self-Expression', 46: 'Pushing Upward', 5: 'Waiting', 47: 'Oppression',
  48: 'The Well', 14: 'Possession', 18: 'Work on Spoilt', 26: 'Taming Power',
  11: 'Peace', 57: 'The Gentle', 34: 'Power of the Great', 20: 'Contemplation',
  17: 'Following', 15: 'Modesty', 29: 'The Abysmal', 2: 'The Receptive',
  10: 'Treading', 8: 'Holding Together', 25: 'Innocence', 51: 'The Arousing',
  40: 'Deliverance', 37: 'The Family', 36: 'Darkening of the Light',
  22: 'Grace', 55: 'Abundance', 39: 'Obstruction', 30: 'The Clinging Fire',
  38: 'Opposition', 58: 'The Joyous', 50: 'The Cauldron', 44: 'Coming to Meet',
  43: 'Breakthrough', 24: 'Return', 4: 'Youthful Folly', 63: 'After Completion',
  64: 'Before Completion', 23: 'Splitting Apart', 62: 'Preponderance',
  16: 'Enthusiasm', 35: 'Progress', 12: 'Standstill', 45: 'Gathering Together',
  21: 'Biting Through', 42: 'Increase', 3: 'Difficulty at the Beginning',
  60: 'Limitation', 52: 'Keeping Still', 9: 'Taming Power of the Small',
  59: 'Dispersion', 6: 'Conflict',
}

/* ─── Gate tooltip data (center, circuit, keynote, shadow/gift/siddhi) ──── */
const GATE_TOOLTIPS = {
  1:  { center: 'G/Self', circuit: 'Individual', keynote: 'Creative self-expression', shadow: 'Entropy', gift: 'Freshness', siddhi: 'Beauty' },
  2:  { center: 'G/Self', circuit: 'Collective', keynote: 'Direction of the self', shadow: 'Dislocation', gift: 'Orientation', siddhi: 'Unity' },
  3:  { center: 'Sacral', circuit: 'Individual', keynote: 'Ordering — difficulty at beginning', shadow: 'Chaos', gift: 'Innovation', siddhi: 'Innocence' },
  4:  { center: 'Ajna', circuit: 'Collective', keynote: 'Formulization — youthful folly', shadow: 'Intolerance', gift: 'Understanding', siddhi: 'Forgiveness' },
  5:  { center: 'Sacral', circuit: 'Collective', keynote: 'Fixed rhythms and patterns', shadow: 'Impatience', gift: 'Patience', siddhi: 'Timelessness' },
  6:  { center: 'Solar Plexus', circuit: 'Tribal', keynote: 'Friction — the gate of conflict', shadow: 'Conflict', gift: 'Diplomacy', siddhi: 'Peace' },
  7:  { center: 'G/Self', circuit: 'Collective', keynote: 'The role of the self', shadow: 'Division', gift: 'Guidance', siddhi: 'Virtue' },
  8:  { center: 'Throat', circuit: 'Individual', keynote: 'Contribution — holding together', shadow: 'Mediocrity', gift: 'Style', siddhi: 'Exquisiteness' },
  9:  { center: 'Sacral', circuit: 'Collective', keynote: 'Focus — taming power of small', shadow: 'Inertia', gift: 'Determination', siddhi: 'Invincibility' },
  10: { center: 'G/Self', circuit: 'Individual', keynote: 'Behavior of the self', shadow: 'Self-obsession', gift: 'Naturalness', siddhi: 'Being' },
  11: { center: 'Ajna', circuit: 'Collective', keynote: 'Ideas — peace', shadow: 'Obscurity', gift: 'Idealism', siddhi: 'Light' },
  12: { center: 'Throat', circuit: 'Individual', keynote: 'Caution — standstill', shadow: 'Vanity', gift: 'Discrimination', siddhi: 'Purity' },
  13: { center: 'G/Self', circuit: 'Collective', keynote: 'The listener — fellowship', shadow: 'Discord', gift: 'Discernment', siddhi: 'Empathy' },
  14: { center: 'Sacral', circuit: 'Individual', keynote: 'Power skills — possession', shadow: 'Compromise', gift: 'Competence', siddhi: 'Bounteousness' },
  15: { center: 'G/Self', circuit: 'Collective', keynote: 'Extremes — modesty', shadow: 'Dullness', gift: 'Magnetism', siddhi: 'Florescence' },
  16: { center: 'Throat', circuit: 'Collective', keynote: 'Skills — enthusiasm', shadow: 'Indifference', gift: 'Versatility', siddhi: 'Mastery' },
  17: { center: 'Ajna', circuit: 'Collective', keynote: 'Opinions — following', shadow: 'Opinion', gift: 'Far-sightedness', siddhi: 'Omniscience' },
  18: { center: 'Spleen', circuit: 'Collective', keynote: 'Correction — work on spoilt', shadow: 'Judgement', gift: 'Integrity', siddhi: 'Perfection' },
  19: { center: 'Root', circuit: 'Tribal', keynote: 'Wanting — approach', shadow: 'Co-dependence', gift: 'Sensitivity', siddhi: 'Sacrifice' },
  20: { center: 'Throat', circuit: 'Individual', keynote: 'The now — contemplation', shadow: 'Superficiality', gift: 'Self-assurance', siddhi: 'Presence' },
  21: { center: 'Heart', circuit: 'Tribal', keynote: 'Hunter/Huntress — biting through', shadow: 'Control', gift: 'Authority', siddhi: 'Valour' },
  22: { center: 'Solar Plexus', circuit: 'Individual', keynote: 'Openness — grace', shadow: 'Dishonour', gift: 'Graciousness', siddhi: 'Grace' },
  23: { center: 'Throat', circuit: 'Individual', keynote: 'Assimilation — splitting apart', shadow: 'Complexity', gift: 'Simplicity', siddhi: 'Quintessence' },
  24: { center: 'Ajna', circuit: 'Individual', keynote: 'Rationalization — return', shadow: 'Addiction', gift: 'Invention', siddhi: 'Silence' },
  25: { center: 'G/Self', circuit: 'Individual', keynote: 'Spirit of the self — innocence', shadow: 'Constriction', gift: 'Acceptance', siddhi: 'Universal Love' },
  26: { center: 'Heart', circuit: 'Tribal', keynote: 'The egoist — taming power', shadow: 'Pride', gift: 'Artfulness', siddhi: 'Invisibility' },
  27: { center: 'Sacral', circuit: 'Tribal', keynote: 'Caring — nourishment', shadow: 'Selfishness', gift: 'Altruism', siddhi: 'Selflessness' },
  28: { center: 'Spleen', circuit: 'Individual', keynote: 'The game player — the great', shadow: 'Purposelessness', gift: 'Totality', siddhi: 'Immortality' },
  29: { center: 'Sacral', circuit: 'Collective', keynote: 'Perseverance — the abysmal', shadow: 'Half-heartedness', gift: 'Commitment', siddhi: 'Devotion' },
  30: { center: 'Solar Plexus', circuit: 'Collective', keynote: 'Recognition of feelings', shadow: 'Desire', gift: 'Lightness', siddhi: 'Rapture' },
  31: { center: 'Throat', circuit: 'Collective', keynote: 'Influence — leading', shadow: 'Arrogance', gift: 'Leadership', siddhi: 'Humility' },
  32: { center: 'Spleen', circuit: 'Tribal', keynote: 'Continuity — duration', shadow: 'Failure', gift: 'Preservation', siddhi: 'Veneration' },
  33: { center: 'Throat', circuit: 'Collective', keynote: 'Privacy — retreat', shadow: 'Forgetting', gift: 'Mindfulness', siddhi: 'Revelation' },
  34: { center: 'Sacral', circuit: 'Individual', keynote: 'Power — power of the great', shadow: 'Force', gift: 'Strength', siddhi: 'Majesty' },
  35: { center: 'Throat', circuit: 'Collective', keynote: 'Change — progress', shadow: 'Hunger', gift: 'Adventure', siddhi: 'Boundlessness' },
  36: { center: 'Solar Plexus', circuit: 'Individual', keynote: 'Crisis — darkening of light', shadow: 'Turbulence', gift: 'Humanity', siddhi: 'Compassion' },
  37: { center: 'Solar Plexus', circuit: 'Tribal', keynote: 'Friendship — the family', shadow: 'Weakness', gift: 'Equality', siddhi: 'Tenderness' },
  38: { center: 'Root', circuit: 'Individual', keynote: 'The fighter — opposition', shadow: 'Struggle', gift: 'Perseverance', siddhi: 'Honour' },
  39: { center: 'Root', circuit: 'Individual', keynote: 'Provocation — obstruction', shadow: 'Provocation', gift: 'Dynamism', siddhi: 'Liberation' },
  40: { center: 'Heart', circuit: 'Tribal', keynote: 'Aloneness — deliverance', shadow: 'Exhaustion', gift: 'Resolve', siddhi: 'Divine Will' },
  41: { center: 'Root', circuit: 'Collective', keynote: 'Contraction — decrease', shadow: 'Fantasy', gift: 'Anticipation', siddhi: 'Emanation' },
  42: { center: 'Sacral', circuit: 'Collective', keynote: 'Growth — increase', shadow: 'Expectation', gift: 'Detachment', siddhi: 'Celebration' },
  43: { center: 'Ajna', circuit: 'Individual', keynote: 'Insight — breakthrough', shadow: 'Deafness', gift: 'Insight', siddhi: 'Epiphany' },
  44: { center: 'Spleen', circuit: 'Tribal', keynote: 'Alertness — coming to meet', shadow: 'Interference', gift: 'Teamwork', siddhi: 'Synarchy' },
  45: { center: 'Throat', circuit: 'Tribal', keynote: 'The gatherer — gathering', shadow: 'Dominance', gift: 'Synergy', siddhi: 'Communion' },
  46: { center: 'G/Self', circuit: 'Collective', keynote: 'Determination of the self', shadow: 'Seriousness', gift: 'Delight', siddhi: 'Ecstasy' },
  47: { center: 'Ajna', circuit: 'Collective', keynote: 'Realization — oppression', shadow: 'Oppression', gift: 'Transmutation', siddhi: 'Transfiguration' },
  48: { center: 'Spleen', circuit: 'Collective', keynote: 'Depth — the well', shadow: 'Inadequacy', gift: 'Resourcefulness', siddhi: 'Wisdom' },
  49: { center: 'Solar Plexus', circuit: 'Tribal', keynote: 'Principles — revolution', shadow: 'Reaction', gift: 'Revolution', siddhi: 'Rebirth' },
  50: { center: 'Spleen', circuit: 'Tribal', keynote: 'Values — the cauldron', shadow: 'Corruption', gift: 'Equilibrium', siddhi: 'Harmony' },
  51: { center: 'Heart', circuit: 'Individual', keynote: 'Shock — the arousing', shadow: 'Agitation', gift: 'Initiative', siddhi: 'Awakening' },
  52: { center: 'Root', circuit: 'Collective', keynote: 'Stillness — keeping still', shadow: 'Stress', gift: 'Restraint', siddhi: 'Stillness' },
  53: { center: 'Root', circuit: 'Collective', keynote: 'Beginnings — development', shadow: 'Immaturity', gift: 'Expansion', siddhi: 'Superabundance' },
  54: { center: 'Root', circuit: 'Tribal', keynote: 'Ambition — marrying maiden', shadow: 'Greed', gift: 'Aspiration', siddhi: 'Ascension' },
  55: { center: 'Solar Plexus', circuit: 'Individual', keynote: 'Spirit — abundance', shadow: 'Victimization', gift: 'Freedom', siddhi: 'Freedom' },
  56: { center: 'Throat', circuit: 'Collective', keynote: 'Stimulation — the wanderer', shadow: 'Distraction', gift: 'Enrichment', siddhi: 'Intoxication' },
  57: { center: 'Spleen', circuit: 'Individual', keynote: 'Intuitive clarity — the gentle', shadow: 'Unease', gift: 'Intuition', siddhi: 'Clarity' },
  58: { center: 'Root', circuit: 'Collective', keynote: 'Vitality — the joyous', shadow: 'Dissatisfaction', gift: 'Vitality', siddhi: 'Bliss' },
  59: { center: 'Sacral', circuit: 'Tribal', keynote: 'Sexuality — dispersion', shadow: 'Dishonesty', gift: 'Intimacy', siddhi: 'Transparency' },
  60: { center: 'Root', circuit: 'Individual', keynote: 'Acceptance — limitation', shadow: 'Limitation', gift: 'Realism', siddhi: 'Justice' },
  61: { center: 'Head', circuit: 'Individual', keynote: 'Mystery — inner truth', shadow: 'Psychosis', gift: 'Inspiration', siddhi: 'Sanctity' },
  62: { center: 'Throat', circuit: 'Collective', keynote: 'Details — preponderance', shadow: 'Intellect', gift: 'Precision', siddhi: 'Impeccability' },
  63: { center: 'Head', circuit: 'Collective', keynote: 'Doubt — after completion', shadow: 'Doubt', gift: 'Inquiry', siddhi: 'Truth' },
  64: { center: 'Head', circuit: 'Collective', keynote: 'Confusion — before completion', shadow: 'Confusion', gift: 'Imagination', siddhi: 'Illumination' },
}

/* ─── Center tooltip data ────────────────────────────────────────────────── */
const CENTER_TOOLTIPS = {
  HEAD:   { bio: 'Pineal gland', theme: 'Inspiration, mental pressure to know', defined: 'Consistent access to inspiration. Fixed way of thinking.', open: 'Amplifies others\' mental pressure. Wisdom: knowing which questions are truly yours.' },
  AJNA:   { bio: 'Pituitary gland', theme: 'Conceptualizing, processing, analyzing', defined: 'Fixed way of processing information. Reliable mental framework.', open: 'Sees things from many perspectives. Wisdom: no attachment to certainty.' },
  THROAT: { bio: 'Thyroid / parathyroid', theme: 'Communication, manifestation, metamorphosis', defined: 'Reliable access to expression and action. Can initiate communication.', open: 'Amplifies expression. Wisdom: knowing when silence is more powerful.' },
  G_SELF: { bio: 'Liver / blood', theme: 'Identity, direction, love', defined: 'Fixed sense of self and direction. Reliable access to love and purpose.', open: 'Identity shifts with environment. Wisdom: freedom of not having a fixed identity.' },
  HEART:  { bio: 'Heart / stomach / thymus', theme: 'Willpower, ego, self-worth', defined: 'Reliable willpower and sense of self-worth. Can make and keep promises.', open: 'Amplifies will. Wisdom: nothing to prove. Self-worth not tied to achievement.' },
  SACRAL: { bio: 'Ovaries / testes', theme: 'Life force, sexuality, work capacity', defined: 'Consistent life force energy. Designed to respond. Sustainable work.', open: 'Amplifies sacral energy. Wisdom: knowing when enough is enough.' },
  SPLEEN: { bio: 'Spleen / lymphatic / T-cells', theme: 'Intuition, survival, time, health', defined: 'Consistent spontaneous intuition. Reliable immune awareness.', open: 'Amplifies fears and intuition. Wisdom: learning what is truly healthy for you.' },
  SOLAR:  { bio: 'Kidneys / pancreas / nervous system', theme: 'Emotions, feelings, desire, sensitivity', defined: 'Emotional authority. Life in waves. Clarity comes over time.', open: 'Amplifies emotions. Wisdom: emotions you feel may not be yours.' },
  ROOT:   { bio: 'Adrenal glands', theme: 'Adrenaline, stress, drive, kundalini', defined: 'Consistent adrenal pressure. Can handle stress without overwhelm.', open: 'Amplifies stress. Wisdom: there is no real rush — urgency is borrowed.' },
}

/* ─── Tooltip component ──────────────────────────────────────────────────── */
function HDTooltip({ data, children, direction }) {
  const [show, setShow] = useState(false)
  if (!data) return children
  const isBelow = direction === 'below'
  return (
    <div style={{ position: 'relative', display: 'flex', width: '100%' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          ...(isBelow ? { top: '100%', marginTop: 6 } : { bottom: '100%', marginBottom: 6 }),
          left: '50%', transform: 'translateX(-50%)',
          width: 280, padding: '12px 14px', borderRadius: 10,
          background: 'var(--popover)', border: '1px solid rgba(201,168,76,.2)',
          backdropFilter: 'blur(20px)', zIndex: 999, pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}>
          {data.center && <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,.6)', marginBottom: 6 }}>{data.center} CENTER {data.circuit ? '\u00B7 ' + data.circuit + ' CIRCUIT' : ''}</div>}
          {data.keynote && <div style={{ fontSize: 11, color: 'var(--foreground)', marginBottom: 6, lineHeight: 1.4 }}>{data.keynote}</div>}
          {data.shadow && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(204,68,68,.15)', color: '#cc6666', border: '1px solid rgba(204,68,68,.2)' }}>Shadow: {data.shadow}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(201,168,76,.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.2)' }}>Gift: {data.gift}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(144,80,224,.12)', color: '#a878e8', border: '1px solid rgba(144,80,224,.2)' }}>Siddhi: {data.siddhi}</span>
            </div>
          )}
          {data.bio && <div style={{ fontSize: 9, color: 'rgba(201,168,76,.5)', marginBottom: 4 }}>Bio-correlation: {data.bio}</div>}
          {data.theme && <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 4, lineHeight: 1.4 }}>Theme: {data.theme}</div>}
          {data._isDefined !== undefined && (
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.4, fontStyle: 'italic' }}>
              {data._isDefined ? data.defined : data.open}
            </div>
          )}
          <div style={{
            position: 'absolute', left: '50%', width: 10, height: 10,
            background: 'var(--popover)',
            ...(isBelow
              ? { top: -5, transform: 'translateX(-50%) rotate(45deg)', borderLeft: '1px solid rgba(201,168,76,.2)', borderTop: '1px solid rgba(201,168,76,.2)' }
              : { bottom: -5, transform: 'translateX(-50%) rotate(45deg)', borderRight: '1px solid rgba(201,168,76,.2)', borderBottom: '1px solid rgba(201,168,76,.2)' }
            ),
          }} />
        </div>
      )}
    </div>
  )
}

/* ─── Center info ────────────────────────────────────────────────────────── */
const CENTER_INFO = {
  HEAD:   { name: 'Head',         glyph: '△',  meaning: 'Inspiration & pressure to think' },
  AJNA:   { name: 'Ajna',         glyph: '◇',  meaning: 'Conceptualization & mental processing' },
  THROAT: { name: 'Throat',       glyph: '◎',  meaning: 'Manifestation, communication & action' },
  G_SELF: { name: 'G/Self',       glyph: '⬡',  meaning: 'Identity, love, and direction' },
  HEART:  { name: 'Heart/Will',   glyph: '♥',  meaning: 'Will power, ego & tribal commitments' },
  SACRAL: { name: 'Sacral',       glyph: '▣',  meaning: 'Life force energy & sustainability' },
  SPLEEN: { name: 'Spleen',       glyph: '◆',  meaning: 'Spontaneous awareness & intuition' },
  SOLAR:  { name: 'Solar Plexus', glyph: '∿',  meaning: 'Emotional wave, feelings & sensitivity' },
  ROOT:   { name: 'Root',         glyph: '■',  meaning: 'Adrenaline pressure & drive to complete' },
}

const TYPE_COLORS = {
  Projector:             { bg: 'var(--accent)',   border: 'var(--ring)',   color: '#c9a84c' },
  Generator:             { bg: 'rgba(212,48,112,.1)',   border: 'rgba(240,96,160,.35)',   color: '#f060a0' },
  'Manifesting Generator': { bg: 'rgba(212,48,112,.1)', border: 'rgba(240,96,160,.35)', color: '#f060a0' },
  Manifestor:            { bg: 'rgba(238,68,68,.1)',    border: 'rgba(238,68,68,.35)',    color: '#ee5544' },
  Reflector:             { bg: 'rgba(144,80,224,.1)',   border: 'rgba(144,80,224,.35)',   color: '#9050e0' },
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const DESIGN_COLOR  = '#cc3333'
const PERSON_COLOR  = 'var(--foreground)'

const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  tabBar: {
    display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.1)',
    background: 'rgba(0,0,0,.25)', flexShrink: 0,
  },
  tab: (active) => ({
    padding: '12px 20px', cursor: 'pointer', fontSize: 11,
    fontFamily: "'Cinzel', serif", letterSpacing: '.15em', textTransform: 'uppercase',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    borderBottom: active ? '2px solid var(--foreground)' : '2px solid transparent',
    background: 'transparent', border: 'none', outline: 'none',
    transition: 'color .15s',
  }),
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 12,
  },
  glass: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 16, backdropFilter: 'blur(12px)',
  },
  badge: (bg, border, color) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '2px 8px', borderRadius: 10, fontSize: 8,
    fontFamily: "'Cinzel', serif", letterSpacing: '.08em', textTransform: 'uppercase',
    background: bg, border: `1px solid ${border}`, color,
  }),
}

/* ─── Color-Tone-Base dot row ────────────────────────────────────────────── */
// Each planet row optionally shows color/tone/base as tiny numbered circles.
// We derive them from gate/line as a rough approximation (6 colors, 6 tones, 5 bases).
function getColorToneBase(gate, line) {
  const color = ((gate - 1) % 6) + 1
  const tone  = line
  const base  = ((gate % 5) + 1)
  return { color, tone, base }
}

function CTBDots({ gate, line, side }) {
  const { color, tone, base } = getColorToneBase(gate, line)
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center', marginLeft: side === 'left' ? 4 : 0, marginRight: side === 'right' ? 4 : 0 }}>
      <span title={`Color ${color}`} style={{ width: 14, height: 14, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: 'monospace', flexShrink: 0 }}>{color}</span>
      <span title={`Tone ${tone}`}   style={{ width: 14, height: 14, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: 'monospace', flexShrink: 0 }}>{tone}</span>
      <span title={`Base ${base}`}   style={{ width: 14, height: 14, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: 'monospace', flexShrink: 0 }}>{base}</span>
    </span>
  )
}

/* ─── Arrow indicator (▲ ▼ based on line) ────────────────────────────────── */
function LineArrow({ line, color }) {
  // Lines 4-6 point up, lines 1-3 point down (rough convention)
  const arrow = line >= 4 ? '▲' : '▼'
  return <span style={{ fontSize: 9, color, opacity: 0.7 }}>{arrow}</span>
}

/* ─── Planet row for the left (Design) column ────────────────────────────── */
function DesignPlanetRow({ planetKey, planet }) {
  if (!planet) return null
  const sym = PLANET_SYMBOLS[planetKey] || '?'
  const label = `${planet.gate}.${planet.line}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', minWidth: 0 }}>
      <span style={{ fontSize: 16, color: DESIGN_COLOR, minWidth: 18, textAlign: 'center' }}>{sym}</span>
      <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: DESIGN_COLOR, fontWeight: 600, minWidth: 36 }}>{label}</span>
      <LineArrow line={planet.line} color={DESIGN_COLOR} />
      <CTBDots gate={planet.gate} line={planet.line} side="left" />
    </div>
  )
}

/* ─── Planet row for the right (Personality) column ──────────────────────── */
function PersonalityPlanetRow({ planetKey, planet }) {
  if (!planet) return null
  const sym = PLANET_SYMBOLS[planetKey] || '?'
  const label = `${planet.gate}.${planet.line}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', justifyContent: 'flex-end', minWidth: 0 }}>
      <CTBDots gate={planet.gate} line={planet.line} side="right" />
      <LineArrow line={planet.line} color={PERSON_COLOR} />
      <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: PERSON_COLOR, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{label}</span>
      <span style={{ fontSize: 16, color: PERSON_COLOR, minWidth: 18, textAlign: 'center' }}>{sym}</span>
    </div>
  )
}

/* ─── Generate design summary narrative ──────────────────────────────────── */
function generateDesignSummary(chart) {
  if (!chart || !chart.type) return null

  const typeDescriptions = {
    'Generator': "You're built to respond. Your sacral life force is your compass — wait for life to come to you. Once you feel that clear gut response, you have sustainable energy to follow through.",
    'Manifesting Generator': "You're a multi-passionate responder with initiative. Your sacral responds AND you can initiate — but always after the response hits. Trust the combination.",
    'Projector': "You're here to guide and direct. Your gift is seeing others deeply — their gifts, their blindspots, their potential — but only when invited. Wait for the recognition.",
    'Manifestor': "You're an initiator. You're here to start things and inform others before acting. Your impact comes from moving first, not from waiting.",
    'Reflector': "You're a mirror of your environment. Your lunar cycle is your authority — wait 28 days for major decisions. You're designed to sample and reflect, not to commit quickly.",
  }

  const authorityDescriptions = {
    'Emotional / Solar Plexus': "You ride the emotional wave. Never decide in the highs or lows — wait for clarity to emerge.",
    'Sacral': "Your gut response is your compass. Trust that spontaneous yes or no — your body knows before your mind does.",
    'Splenic': "You trust the spontaneous hit. Your intuition speaks once and quietly — catch it early, or it fades.",
    'Self-Projected / G Center': "Listen to what you hear yourself say. Your truth comes through your own voice, not others'.",
    'Ego / Heart': "Your willpower and heart are your guide. If your heart's not in it, don't force it.",
    'None / Outer': "You sample environments and people. Clarity comes from reflection and trying, not from internal pressure.",
  }

  const type = chart.type || '—'
  const authority = chart.authority || '—'
  const profile = chart.profile || '—'
  const definition = chart.definition || '—'
  const signature = chart.signature || '—'
  const notSelf = chart.notSelf || '—'

  // Count defined centers
  const centers = chart.centers || {}
  const definedCount = Object.values(centers).filter(c => c && c.defined).length
  const totalCenters = Object.keys(centers).length
  const definitionRatio = `${definedCount} of ${totalCenters}`

  // Count channels
  const channelCount = (chart.activeChannels || []).length

  let summary = []

  // Type + meaning
  const typeDesc = typeDescriptions[type] || `You are a ${type}.`
  summary.push(typeDesc)

  // Authority + how they decide
  const authDesc = authorityDescriptions[authority] || `Your authority is ${authority}.`
  summary.push(authDesc)

  // Profile + lines
  const profileParts = profile.split('/').map(p => parseInt(p, 10))
  let profileMsg = `Your profile is ${profile}. `
  if (profileParts[0]) {
    const firstLineThemes = {
      1: 'the investigator within you brings grounding and truth-seeking',
      2: 'you naturally attract mentorship and are most productive alone',
      3: 'you learn through trial and error — experimentation is your path',
      4: 'you are the connector, building trust and loyalty in relationships',
      5: "you're here to solve problems others face; people project onto you",
      6: 'you watch from a distance first, then become a guide',
    }
    profileMsg += firstLineThemes[profileParts[0]] || ''
  }
  if (profileParts[1]) {
    const secondLineThemes = {
      1: ', and then you synthesize insights into wisdom',
      2: ', while remaining available and open to unexpected turns',
      3: ', adapting and pivoting as needed',
      4: ', bringing structure and loyalty to what you build',
      5: ', then you inspire others to action',
      6: ', becoming a mentor or guide to others',
    }
    profileMsg += secondLineThemes[profileParts[1]] || ''
  }
  profileMsg += '.'
  summary.push(profileMsg)

  // Definition + how they process
  const definitionThemes = {
    'Single': 'You process linearly — one path at a time. Clarity comes step-by-step.',
    'Split': "Your definition is split, requiring a bridge from another. You're designed for collaboration or environment-dependent clarity.",
    'Triple Split': 'Your design fragments across multiple unconnected themes. You need different people or environments to activate each part.',
    'Quadruple Split': 'Your definition is highly dispersed. Integration requires the right environment and people to bring all parts alive.',
  }
  const defMsg = definitionThemes[definition] || `Your definition is ${definition}.`
  summary.push(defMsg)

  // Signature + compass
  let sigMsg = `Your signature is ${signature} — that's the emotional tone of life lived correctly. `
  let notSelfMsg = `When you're out of alignment, you feel ${notSelf}.`
  summary.push(`${sigMsg}${notSelfMsg}`)

  // Centers + ratio
  let centerMsg = `You have ${definedCount} defined centers and ${totalCenters - definedCount} open. `
  if (definedCount >= 6) {
    centerMsg += 'You carry fixed, consistent themes — your definition is strong.'
  } else if (definedCount >= 4) {
    centerMsg += 'You have a balanced mix of definition and openness — you can initiate and adapt.'
  } else if (definedCount > 0) {
    centerMsg += 'You amplify what you encounter. Your openness is a gift, though it can feel overwhelming.'
  } else {
    centerMsg += 'You are highly sensitive to your environment — you reflect and absorb what surrounds you.'
  }
  summary.push(centerMsg)

  // Channels + energy patterns
  if (channelCount > 0) {
    let channelMsg = `You have ${channelCount} active channel${channelCount !== 1 ? 's' : ''}, `
    const circuitCounts = {}
    ;(chart.activeChannels || []).forEach(ch => {
      const ckt = ch.circuit || 'Collective'
      circuitCounts[ckt] = (circuitCounts[ckt] || 0) + 1
    })
    const circuits = Object.entries(circuitCounts).map(([ckt, count]) => `${count} ${ckt}`).join(', ')
    channelMsg += `connecting centers across your design: ${circuits}.`
    summary.push(channelMsg)
  }

  // Cross (life theme)
  if (chart.cross) {
    summary.push(`Your life theme is the ${chart.cross} — this is the underlying archetype that guides your growth and purpose.`)
  }

  return summary.join(' ')
}

/* ─── RAVECHART TAB ──────────────────────────────────────────────────────── */
function RavechartTab({ chart }) {
  const hd = chart || FALLBACK
  const tc = TYPE_COLORS[hd.type] || TYPE_COLORS.Projector

  const designSummary = useMemo(() => generateDesignSummary(chart), [chart])

  return (
    <div style={{ padding: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── DESIGN | BODYGRAPH | PERSONALITY three-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gap: 0, alignItems: 'start', minHeight: 480, padding: '0 4px' }}>

        {/* LEFT: Design column */}
        <div style={{ padding: '48px 8px 8px 8px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: DESIGN_COLOR, marginBottom: 2 }}>DESIGN</div>
          <div style={{ fontSize: 10, color: DESIGN_COLOR, opacity: 0.7, marginBottom: 12, fontStyle: 'italic' }}>The Unconscious</div>
          {PLANET_ORDER.map(key => (
            <DesignPlanetRow key={key} planetKey={key} planet={hd.design?.[key]} />
          ))}
        </div>

        {/* CENTER: Bodygraph */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'visible', minHeight: 440 }}>
          <HumanDesign />
        </div>

        {/* RIGHT: Personality column */}
        <div style={{ padding: '48px 8px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: PERSON_COLOR, marginBottom: 2 }}>PERSONALITY</div>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 12, fontStyle: 'italic' }}>The Conscious</div>
          {PLANET_ORDER.map(key => (
            <PersonalityPlanetRow key={key} planetKey={key} planet={hd.personality?.[key]} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM: Core profile info ── */}
      <div style={{ padding: '0 16px 0 16px', borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!chart ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🔮</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
              Add Birth Data
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              Enter your birth date, time &amp; location in your profile to unlock your full Human Design chart — Type, Authority, Profile, Definition and more.
            </div>
          </div>
        ) : (
          <>
            {/* Type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 80 }}>Personality Type</span>
              <span style={{ ...S.badge(tc.bg, tc.border, tc.color), fontSize: 11, padding: '4px 16px', letterSpacing: '.12em' }}>{hd.type}</span>
            </div>

            {/* NARRATIVE SUMMARY */}
            {designSummary && (
              <div style={{ ...S.glass, padding: '14px 16px', marginTop: 8, marginBottom: 8 }}>
                <div style={S.sectionTitle}>Your Design Summary</div>
                <div style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  {designSummary}
                </div>
              </div>
            )}

            {/* Profile, Authority, Definition, Strategy */}
            {[
              ['Profile',    hd.profile ? `${hd.profile} — ${hd.profileNames || ''}` : '—'],
              ['Authority',  hd.authority || '—'],
              ['Definition', hd.definition || '—'],
              ['Strategy',   hd.strategy || '—'],
              ['Not-Self',   hd.notSelf || '—'],
              ['Signature',  hd.signature || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 80, paddingTop: 2 }}>{label}</span>
                <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: 'var(--foreground)', lineHeight: 1.4 }}>{val}</span>
              </div>
            ))}

            {hd.cross && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 80, paddingTop: 2 }}>Cross</span>
                <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{hd.cross}</span>
              </div>
            )}

            {chart?.designDate && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 80, paddingTop: 2 }}>Design Date</span>
                <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 11, color: DESIGN_COLOR, lineHeight: 1.4 }}>{chart.designDate}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── MECHANICS TAB ──────────────────────────────────────────────────────── */
function MechanicsTab({ chart }) {
  const hd = chart || FALLBACK
  const centers = hd.centers || {}
  const channels = hd.activeChannels || []

  const centerRows = Object.entries(CENTER_INFO).map(([key, info]) => {
    const centerData = centers[key] || { defined: false }
    return { key, ...info, defined: centerData.defined }
  })

  const definedCount = centerRows.filter(c => c.defined).length

  // Group channels by circuit
  const byCircuit = { Individual: [], Tribal: [], Collective: [] }
  channels.forEach(ch => {
    const ckt = ch.circuit || 'Collective'
    if (!byCircuit[ckt]) byCircuit[ckt] = []
    byCircuit[ckt].push(ch)
  })

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* CENTERS */}
      <div>
        <div style={S.sectionTitle}>
          Energy Centers
          <span style={{ float: 'right', fontFamily: "'Inconsolata',monospace", fontSize: 10 }}>
            <span style={{ color: 'var(--foreground)' }}>{definedCount} defined</span>{' / '}
            <span style={{ color: 'var(--muted-foreground)' }}>{centerRows.length - definedCount} undefined</span>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {centerRows.map((c, i) => {
            const tip = CENTER_TOOLTIPS[c.key]
            const tipData = tip ? { ...tip, _isDefined: c.defined } : null
            return (
            <HDTooltip key={i} data={tipData} direction="below">
            <div style={{
              ...S.glass,
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              borderColor: c.defined ? 'rgba(201,168,76,.2)' : 'var(--border)',
              background: c.defined ? 'var(--secondary)' : 'var(--secondary)',
              cursor: 'help', width: '100%',
            }}>
              <span style={{ fontSize: 22, color: c.defined ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: c.defined ? 1 : 0.4, minWidth: 28, textAlign: 'center' }}>{c.glyph}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: c.defined ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: 600 }}>{c.name}</span>
                  <span style={S.badge(
                    c.defined ? 'var(--accent)' : 'var(--secondary)',
                    c.defined ? 'rgba(201,168,76,.3)'  : 'rgba(255,255,255,.1)',
                    c.defined ? 'var(--foreground)'           : 'var(--muted-foreground)',
                  )}>{c.defined ? 'Defined' : 'Open'}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>{c.meaning}</span>
              </div>
            </div>
            </HDTooltip>
            )
          })}
        </div>
      </div>

      {/* ACTIVE CHANNELS */}
      <div>
        <div style={S.sectionTitle}>Active Channels ({channels.length})</div>
        {channels.length === 0
          ? <div style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: 13 }}>No channels computed yet</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(byCircuit).map(([circuit, chs]) => {
                if (!chs.length) return null
                const circuitColor = circuit === 'Individual' ? 'var(--violet2)' : circuit === 'Tribal' ? 'var(--rose2)' : 'var(--aqua2)'
                const circuitBg = circuit === 'Individual' ? 'rgba(144,80,224,.08)' : circuit === 'Tribal' ? 'rgba(212,48,112,.08)' : 'rgba(64,204,221,.08)'
                const circuitBorder = circuit === 'Individual' ? 'rgba(144,80,224,.2)' : circuit === 'Tribal' ? 'rgba(212,48,112,.2)' : 'rgba(64,204,221,.2)'
                return (
                  <div key={circuit}>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: circuitColor, marginBottom: 8 }}>{circuit} Circuit</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {chs.map((ch, i) => (
                        <div key={i} style={{ ...S.glass, padding: '10px 14px', background: circuitBg, borderColor: circuitBorder }}>
                          <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 13, color: circuitColor, fontWeight: 700, letterSpacing: '.06em', marginBottom: 4 }}>{ch.gates?.join('-') || '?'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 2 }}>{ch.name}</div>
                          {ch.centers && <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{ch.centers.join(' ↔ ')}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}

/* ─── VARIABLES & PHS TAB ────────────────────────────────────────────────── */
function VariablesTab({ chart }) {
  const hd = chart || FALLBACK

  // Compute arrows from Design/Personality sun and nodes
  // Design sun arrow (left/right brain) and Personality sun arrow
  // This is a simplified calculation; full PHS requires more data
  const designSun     = hd.design?.sun
  const personalitySun = hd.personality?.sun
  const designNode    = hd.design?.northNode
  const personalityNode = hd.personality?.northNode

  // Arrow direction: even gates → right, odd gates → left (simplified)
  const arrowDir = (p) => p ? (p.gate % 2 === 0 ? '→' : '←') : '–'
  const arrowLabel = (p) => p ? (p.gate % 2 === 0 ? 'Right' : 'Left') : '–'

  const variables = [
    { label: 'Digestion (Design Sun)',       planet: designSun,     arrow: arrowDir(designSun),     side: arrowLabel(designSun) },
    { label: 'Environment (Design Node)',    planet: designNode,    arrow: arrowDir(designNode),    side: arrowLabel(designNode) },
    { label: 'Perspective (P\' Sun)',        planet: personalitySun, arrow: arrowDir(personalitySun), side: arrowLabel(personalitySun) },
    { label: 'Motivation (P\' Node)',        planet: personalityNode, arrow: arrowDir(personalityNode), side: arrowLabel(personalityNode) },
  ]

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={S.sectionTitle}>Primary Health System (PHS)</div>
        <div style={{ ...S.glass, padding: '14px 18px', fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.7 }}>
          PHS is the most advanced level of Human Design, focusing on the four variables
          that optimize your bio-energetic environment, digestion, and perception.
          Full PHS analysis requires advanced chart calculation beyond gate/line positions.
        </div>
      </div>

      <div>
        <div style={S.sectionTitle}>Four Transformations (Variables)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variables.map((v, i) => (
            <div key={i} style={{ ...S.glass, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', minWidth: 140 }}>{v.label}</span>
              <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: 'var(--foreground)', minWidth: 40 }}>
                {v.planet ? `${v.planet.gate}.${v.planet.line}` : '—'}
              </span>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--aqua2)', minWidth: 20 }}>{v.arrow}</span>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--muted-foreground)' }}>{v.side}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Gates summary */}
      <div>
        <div style={S.sectionTitle}>Active Gates ({chart ? [...new Set([
          ...Object.values(chart.personality).map(p => p.gate),
          ...Object.values(chart.design).map(p => p.gate),
        ])].length : 0})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {chart && [...new Set([
            ...Object.values(chart.personality).map(p => p.gate),
            ...Object.values(chart.design).map(p => p.gate),
          ])].sort((a, b) => a - b).map(gate => {
            const isPerson = Object.values(chart.personality).some(p => p.gate === gate)
            const isDesign  = Object.values(chart.design).some(p => p.gate === gate)
            const color = (isPerson && isDesign) ? 'var(--foreground)' : isPerson ? PERSON_COLOR : DESIGN_COLOR
            return (
              <HDTooltip key={gate} data={GATE_TOOLTIPS[gate]}>
              <div style={{
                padding: '6px 10px', borderRadius: 8, cursor: 'help',
                border: `1px solid ${(isPerson && isDesign) ? 'rgba(201,168,76,.3)' : isPerson ? 'var(--muted-foreground)' : 'rgba(204,51,51,.3)'}`,
                background: (isPerson && isDesign) ? 'rgba(201,168,76,.06)' : isPerson ? 'var(--secondary)' : 'rgba(204,51,51,.05)',
              }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color, textAlign: 'center' }}>{gate}</div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)', textAlign: 'center', marginTop: 2 }}>{GATE_DESCRIPTIONS[gate] || `Gate ${gate}`}</div>
              </div>
              </HDTooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function HDDetail() {
  const [activeTab, setActiveTab] = useState('ravechart')
  const profile = useActiveProfile()

  const chart = useMemo(() => {
    try {
      const { dob, tob } = profile
      if (!dob) return null
      return computeHDChart({ dateOfBirth: dob, timeOfBirth: tob || '00:00', utcOffset: profile.birthTimezone ?? -3 })
    } catch (e) {
      console.error('HDDetail chart error:', e)
      return null
    }
  }, [profile?.dob, profile?.tob, profile?.birthTimezone])

  const TABS = [
    { id: 'ravechart',   label: 'Ravechart' },
    { id: 'mechanics',   label: 'Mechanics' },
    { id: 'variables',   label: 'Variables & PHS' },
  ]

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 0' }}>
          <div style={S.sectionTitle}>Human Design</div>
          <AboutSystemButton systemName="Human Design" />
        </div>
      </div>
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'ravechart'  && <RavechartTab chart={chart} />}
      {activeTab === 'mechanics'  && <MechanicsTab chart={chart} />}
      {activeTab === 'variables'  && <VariablesTab chart={chart} />}
    </div>
  )
}
