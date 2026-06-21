import { useState } from 'react'
import { useComputedProfile } from '../../hooks/useActiveProfile'
import IntegralFigure from '../canvas/IntegralFigure'
import AboutSystemButton from '../ui/AboutSystemButton'

const ZONES = [
  {
    id: 'crown', label: 'Crown', icon: '✧', color: 'rgba(144,80,224,',
    systems: [
      { fw: 'Kabbalah',    key: 'kab',  getVal: p => 'Kether — Divine Will', desc: 'The source of transcendent awareness. Crown of the Tree of Life.' },
      { fw: 'Numerology',  key: 'num',  getVal: p => `Life Path ${p.lifePath || '?'}`, desc: 'The overarching theme and soul purpose of your incarnation.' },
      { fw: 'Chakra',      key: 'cha',  getVal: () => 'Sahasrāra', desc: 'Thousand-petaled lotus. Cosmic consciousness and infinite connection.' },
    ],
  },
  {
    id: 'third', label: 'Third Eye', icon: '◎', color: 'rgba(100,120,220,',
    systems: [
      { fw: 'Enneagram',   key: 'enn',  getVal: p => p.enneagramType ? `Type ${p.enneagramType}${p.enneagramWing ? `w${p.enneagramWing}` : ''}` : 'Take quiz →', desc: 'Core perception type — how your psyche filters and interprets reality.' },
      { fw: 'Myers-Briggs', key: 'mbti', getVal: p => p.mbtiType || 'Not determined', desc: 'Cognitive function stack — how you process information and decide.' },
      { fw: 'Chakra',      key: 'cha',  getVal: () => 'Ājñā', desc: 'Command center. Intuition, insight, and vision beyond the veil.' },
    ],
  },
  {
    id: 'throat', label: 'Throat', icon: '◈', color: 'rgba(64,204,221,',
    systems: [
      { fw: 'Astrology',      key: 'astr', getVal: p => `Mercury in ${p.sign || '?'}`, desc: 'Mercury colors how you communicate, think, and transmit ideas.' },
      { fw: 'Human Design',   key: 'hd',   getVal: p => p.hdAuth ? `${p.hdAuth} Authority` : 'Authority unknown', desc: 'Your Decision Authority — how you make aligned choices.' },
      { fw: 'Chakra',         key: 'cha',  getVal: () => 'Viśuddha', desc: 'Purification through authentic expression. Truth-speaking, creative voice.' },
    ],
  },
  {
    id: 'heart', label: 'Heart', icon: '☉', color: 'rgba(201,168,76,',
    systems: [
      { fw: 'Astrology',   key: 'astr', getVal: p => `Sun in ${p.sign || '?'}`, desc: 'Your Sun sign — core identity, vitality, and the organizing principle of your self.' },
      { fw: 'Kabbalah',    key: 'kab',  getVal: () => 'Tiphereth — Beauty', desc: 'Heart of the Tree. Integrator of opposites — beauty born from perfect balance.' },
      { fw: 'Gene Keys',   key: 'gk',   getVal: p => p.crossGK ? `Key ${p.crossGK.split('|')[0]?.split('/')[0]}` : 'Gene Key ?', desc: 'Your Purpose sphere — the highest expression of your creative genius.' },
    ],
  },
  {
    id: 'solar', label: 'Solar Plexus', icon: '⊕', color: 'rgba(240,192,64,',
    systems: [
      { fw: 'Human Design', key: 'hd', getVal: p => p.hdDef ? `${p.hdDef} Definition` : 'Definition unknown', desc: 'Your Definition type — how energy flows through your bodygraph.' },
      { fw: 'Human Design', key: 'hd', getVal: p => p.hdProfile ? `Profile ${p.hdProfile}` : 'Profile unknown', desc: 'The costume you wear and the role you play in the theater of life.' },
      { fw: 'Chakra',       key: 'cha', getVal: () => 'Maṇipūra', desc: 'Lustrous gem. Personal will, transformation, and the fire of self-determination.' },
    ],
  },
  {
    id: 'sacral', label: 'Sacral', icon: '☽', color: 'rgba(238,102,68,',
    systems: [
      { fw: 'Astrology',    key: 'astr', getVal: p => `Moon in ${p.moon || '?'}`, desc: 'Your Moon sign — emotional nature, instinctive patterns, and the subconscious driver.' },
      { fw: 'Human Design', key: 'hd',   getVal: p => p.hdType || 'Type unknown', desc: 'Your Type — the most fundamental aspect of your design and aura.' },
      { fw: 'Mayan',        key: 'mayan', getVal: () => 'Galactic Kin', desc: 'Your Mayan signature — galactic mission and cosmic frequency.' },
    ],
  },
  {
    id: 'root', label: 'Root', icon: '⊞', color: 'rgba(212,48,112,',
    systems: [
      { fw: 'Astrology',  key: 'astr', getVal: p => `${p.asc || '?'} Rising`, desc: 'Your Ascendant — the mask you wear and how the world first perceives you.' },
      { fw: 'Kabbalah',   key: 'kab',  getVal: () => 'Malkuth — Kingdom', desc: 'The physical realm. Embodied manifestation — bringing the spiritual into matter.' },
      { fw: 'Chinese',    key: 'chi',  getVal: () => 'Earthly Branch', desc: 'Chinese zodiac animal — ancestral patterns and earthly rhythms.' },
    ],
  },
]

export default function IntegralDetail() {
  const profile = useComputedProfile()
  const [activeZone, setActiveZone] = useState('heart')

  const zone = ZONES.find(z => z.id === activeZone) || ZONES[3]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      {/* Canvas figure — main hero */}
      <div style={{ flex: '0 0 420px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <IntegralFigure />
        {/* Zone selector pills overlaid at bottom of canvas */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center',
          padding: '0 16px',
        }}>
          {ZONES.map(z => {
            const isActive = z.id === activeZone
            return (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id)}
                style={{
                  padding: '4px 10px', borderRadius: 12, cursor: 'pointer',
                  fontSize: 9, fontFamily: "'Cinzel',serif", letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  background: isActive ? z.color + '0.25)' : 'rgba(5,5,20,0.75)',
                  border: `1px solid ${isActive ? z.color + '0.6)' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#fff' : 'var(--muted-foreground)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all .15s',
                }}
              >
                {z.icon} {z.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Zone header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600,
              letterSpacing: '.12em', textTransform: 'uppercase',
              color: zone.color + '0.9)',
            }}>
              {zone.icon} {zone.label} Center
            </div>
            <AboutSystemButton systemName="Integral" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            {zone.systems.length} integrated systems
          </div>
        </div>

        {/* Systems */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {zone.systems.map((sys, i) => {
            const val = sys.getVal(profile)
            return (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 10,
                background: zone.color + '0.04)',
                border: `1px solid ${zone.color + '0.18)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                    fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    background: zone.color + '0.1)',
                    border: `1px solid ${zone.color + '0.25)'}`,
                    color: zone.color + '0.9)',
                  }}>{sys.fw}</span>
                  <span style={{
                    fontSize: 13, fontFamily: "'Cinzel',serif",
                    color: zone.color + '0.95)', fontWeight: 600,
                  }}>{val}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {sys.desc}
                </div>
              </div>
            )
          })}
        </div>

        {/* Integration paragraph */}
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: 'var(--accent)', border: '1px solid var(--border)',
          fontSize: 13, lineHeight: 1.8, color: 'var(--muted-foreground)', fontStyle: 'italic',
        }}>
          Your <span style={{ color: 'var(--foreground)', fontStyle: 'normal' }}>{profile.hdType || '?'} Human Design</span> operates
          through the throat, while your <span style={{ color: zone.color + '0.9)', fontStyle: 'normal' }}>
            Life Path {profile.lifePath || '?'}
          </span> provides the crown directive.
          The heart center, ruled by your <span style={{ color: 'var(--foreground)', fontStyle: 'normal' }}>{profile.sign || '?'} Sun</span>,
          is the great integrator — where {profile.moon || '?'} Moon emotions and {profile.hdDef || '?'} definition meet.
          Select each center above to explore how all systems converge into one unified field of consciousness.
        </div>
      </div>
    </div>
  )
}
