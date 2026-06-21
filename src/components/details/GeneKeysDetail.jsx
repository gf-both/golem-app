import { useMemo, useState } from 'react'
import { computeGeneKeysData } from '../../data/geneKeysData'
import { GENE_KEYS_DATA } from '../../engines/geneKeysEngine'
import GeneKeysWheel from '../canvas/GeneKeysWheel'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ─── Sphere color map ──────────────────────────────────────────────────────── */
const SPHERE_COLORS = {
  "Life's Work": '#50b4dc',
  Evolution: '#dc5050',
  Radiance: '#e0a040',
  Purpose: '#9050e0',
  // Venus
  Attraction: '#d43070',
  IQ: '#50b4dc',
  EQ: '#9050e0',
  SQ: '#c9a84c',
  // Pearl
  Vocation: '#f0c040',
  Culture: '#64b450',
  Brand: '#50b4dc',
  Pearl: '#c9a84c',
}

/* ─── Tooltip component (HD-style with sphere colors) ──────────────────────── */
function GKTooltip({ gk, children }) {
  const [show, setShow] = useState(false)
  if (!gk) return children
  const key = gk.gate || gk.num || gk.key
  const d = GENE_KEYS_DATA[key] || {}
  const sphereColor = SPHERE_COLORS[gk.sphere || gk.role] || '#c9a84c'
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, minWidth: 260, maxWidth: 320, padding: '12px 14px',
          background: 'rgba(12,12,20,.96)', border: `1px solid ${sphereColor}33`,
          borderRadius: 10, backdropFilter: 'blur(20px)', pointerEvents: 'none',
          boxShadow: `0 8px 32px rgba(0,0,0,.5), 0 0 20px ${sphereColor}15`,
          marginBottom: 6,
        }}>
          {/* Sphere label header */}
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em',
            textTransform: 'uppercase', color: sphereColor + 'aa', marginBottom: 6,
          }}>
            {gk.sphere || gk.role || ''} SPHERE
          </div>
          {/* Key number + name */}
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--foreground)', marginBottom: 4 }}>
            Gene Key {key}
          </div>
          <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }}>
            Line {gk.line} · {d.iching || ''}
          </div>
          {/* Shadow / Gift / Siddhi badges — color-coded like HD */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(204,68,68,.15)', color: '#cc6666', border: '1px solid rgba(204,68,68,.2)' }}>
              Shadow: {d.shadow}
            </span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${sphereColor}18`, color: sphereColor, border: `1px solid ${sphereColor}33` }}>
              Gift: {d.gift}
            </span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(144,80,224,.12)', color: '#a878e8', border: '1px solid rgba(144,80,224,.2)' }}>
              Siddhi: {d.siddhi}
            </span>
          </div>
          {/* Amino acid if available */}
          {d.aminoAcid && (
            <div style={{ fontSize: 9, color: 'rgba(201,168,76,.5)', marginTop: 4 }}>Amino acid: {d.aminoAcid}</div>
          )}
          {/* Arrow pointer */}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: 'rgba(12,12,20,.96)',
            borderRight: `1px solid ${sphereColor}33`,
            borderBottom: `1px solid ${sphereColor}33`,
          }} />
        </div>
      )}
    </div>
  )
}

/* ─── Glow sphere — circle with hover glow effect (matches HD gate badges) ── */
function GlowSphere({ gk, color, size = 48, children }) {
  const [hovered, setHovered] = useState(false)
  const d = GENE_KEYS_DATA[gk.key || gk.num] || {}
  return (
    <GKTooltip gk={{ gate: gk.key || gk.num, line: gk.line, sphere: gk.role, role: gk.role }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: size, height: size, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: hovered ? color + '1a' : color + '0c',
          border: `2px solid ${hovered ? color + '88' : color + '44'}`,
          fontFamily: "'Cinzel',serif", fontSize: size * 0.44, color, fontWeight: 600,
          position: 'relative', cursor: 'help',
          transition: 'all .25s ease',
          boxShadow: hovered ? `0 0 18px ${color}44, 0 0 6px ${color}22` : 'none',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {gk.key || gk.num}
        {children}
      </div>
    </GKTooltip>
  )
}

/* ─── Spectrum bar ──────────────────────────────────────────────────────────── */
function SpectrumBar({ shadow, gift, siddhi, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 8, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ flex: 1, height: '100%', background: 'rgba(220,60,60,.5)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: 1, height: '100%', background: color + '88' }} />
        <div style={{ flex: 1, height: '100%', background: 'rgba(201,168,76,.6)', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#dc6060' }}>Shadow: {shadow}</span>
        <span style={{ fontSize: 10, color: color }}>{'\u2192'} Gift: {gift}</span>
        <span style={{ fontSize: 10, color: 'var(--foreground)' }}>{'\u2192'} Siddhi: {siddhi}</span>
      </div>
    </div>
  )
}

/* ─── Sequence node with hover glow ────────────────────────────────────────── */
function SequenceNode({ sColor, gk, d, isFirst, isLast }) {
  const [hovered, setHovered] = useState(false)
  return (
    <GKTooltip gk={{ gate: gk.key, line: gk.line, sphere: gk.role, role: gk.role }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          flex: 1, textAlign: 'center', padding: '14px 6px',
          background: hovered ? sColor + '12' : sColor + '06',
          border: '1px solid ' + (hovered ? sColor + '44' : sColor + '18'),
          borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : '0',
          borderLeft: isFirst ? undefined : 'none',
          transition: 'all .25s ease',
          cursor: 'help',
          boxShadow: hovered ? `0 0 16px ${sColor}22` : 'none',
        }}
      >
        <div style={{
          fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.2em',
          textTransform: 'uppercase', color: sColor + 'aa', marginBottom: 4,
        }}>{gk.role}</div>
        <div style={{
          fontFamily: "'Cinzel',serif", fontSize: 18, color: sColor, fontWeight: 600,
          transition: 'text-shadow .25s',
          textShadow: hovered ? `0 0 12px ${sColor}66` : 'none',
        }}>{gk.key}</div>
        <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 2 }}>
          .{gk.line} · {d.gift || ''}
        </div>
      </div>
    </GKTooltip>
  )
}

/* ─── Sequence flow visualization ───────────────────────────────────────────── */
function SequenceFlow({ spheres, color, label, desc }) {
  if (!spheres || spheres.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: '.12em', color }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', flex: 1 }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {spheres.map((s, i) => {
          const sColor = SPHERE_COLORS[s.role] || color
          const d = GENE_KEYS_DATA[s.key] || {}
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <SequenceNode sColor={sColor} gk={s} d={d} isFirst={i === 0} isLast={i === spheres.length - 1} />
              {i < spheres.length - 1 && (
                <div style={{ fontSize: 14, color: 'var(--muted-foreground)', padding: '0 1px', zIndex: 1 }}>{'\u2192'}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Map badge with hover glow (Full Map tab) ────────────────────────────── */
function MapBadge({ gk, fallbackColor }) {
  const [hovered, setHovered] = useState(false)
  const c = SPHERE_COLORS[gk.role] || fallbackColor
  const d = GENE_KEYS_DATA[gk.key] || {}
  return (
    <GKTooltip gk={{ gate: gk.key, line: gk.line, sphere: gk.role, role: gk.role }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          borderRadius: 10,
          background: hovered ? c + '14' : c + '08',
          border: '1px solid ' + (hovered ? c + '44' : c + '22'),
          cursor: 'help',
          transition: 'all .25s ease',
          boxShadow: hovered ? `0 0 14px ${c}22` : 'none',
        }}
      >
        <div style={{
          fontFamily: "'Cinzel',serif", fontSize: 18, color: c, fontWeight: 600,
          transition: 'text-shadow .25s',
          textShadow: hovered ? `0 0 10px ${c}55` : 'none',
        }}>{gk.key}</div>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: c }}>{gk.role}</div>
          <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)' }}>
            {d.shadow} → {d.gift} → {d.siddhi}
          </div>
        </div>
      </div>
    </GKTooltip>
  )
}

/* ─── Detailed key card ─────────────────────────────────────────────────────── */
function KeyCard({ gk, color }) {
  const d = GENE_KEYS_DATA[gk.key || gk.num] || {}
  const shadow = gk.shadow?.name || d.shadow || ''
  const gift = gk.gift?.name || d.gift || ''
  const siddhi = gk.siddhi?.name || d.siddhi || ''
  const iching = gk.iching || d.iching || ''
  const shadowDesc = gk.shadow?.desc || `Unconscious pattern of ${shadow.toLowerCase()}`
  const giftDesc = gk.gift?.desc || `Awakened potential of ${gift.toLowerCase()}`
  const siddhiDesc = gk.siddhi?.desc || `Highest expression: ${siddhi.toLowerCase()}`

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 13, padding: '18px 20px', borderColor: color + '18',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <GlowSphere gk={gk} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: '.1em', color }}>
            Gene Key {gk.key || gk.num} — {gk.role || gk.sphere}
          </div>
          <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
            Line {gk.line} · {iching}
          </div>
        </div>
      </div>

      {/* Spectrum Bar */}
      <SpectrumBar shadow={shadow} gift={gift} siddhi={siddhi} color={color} />

      {/* Three levels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(220,60,60,.04)', border: '1px solid rgba(220,60,60,.12)' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: '#dc6060', marginBottom: 4 }}>Shadow</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: '#dc6060', marginBottom: 4 }}>{shadow}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>{shadowDesc}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: color + '06', border: '1px solid ' + color + '18' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color, marginBottom: 4 }}>Gift</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color, marginBottom: 4 }}>{gift}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>{giftDesc}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--accent)' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: 4 }}>Siddhi</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--foreground)', marginBottom: 4 }}>{siddhi}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>{siddhiDesc}</div>
        </div>
      </div>

      {/* I-Ching */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--secondary)', borderRadius: 6, border: '1px solid var(--secondary)' }}>
        <span style={{ fontSize: 18 }}>{'\u2630'}</span>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>I-Ching Hexagram</div>
          <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 12, color: 'var(--muted-foreground)' }}>{iching}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared styles ─────────────────────────────────────────────────────────── */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 28,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.18em',
    color: 'var(--foreground)', marginBottom: 4,
  },
  glass: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 13, padding: 18, backdropFilter: 'blur(12px)',
  },
  interpretation: {
    fontSize: 14, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic',
    padding: '14px 18px', borderRadius: 10,
    background: 'var(--accent)', border: '1px solid var(--border)',
  },
}

/* ─── Tab definitions ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'hologenetic', label: 'Hologenetic', color: '#c9a84c', icon: '\u2B21' },
  { id: 'activation',  label: 'Activation',  color: '#50b4dc', icon: '\u25C9' },
  { id: 'venus',       label: 'Venus',       color: '#d43070', icon: '\u2661' },
  { id: 'pearl',       label: 'Pearl',       color: '#f0c040', icon: '\u25C8' },
]

const TAB_DESCRIPTIONS = {
  hologenetic: 'Your complete hologenetic genome across all three sequences. The full map of your inner architecture.',
  activation: 'The Activation Sequence traces the path from Life\'s Work through Evolution and Radiance to Purpose, revealing how your deepest gifts unfold through lived experience.',
  venus: 'The Venus Sequence opens the heart field. It reveals how you attract others (Attraction), how your mind processes relationship (IQ), how your emotions navigate intimacy (EQ), and how your spirit transcends separation (SQ).',
  pearl: 'The Pearl Sequence connects your inner gifts to outer abundance. It reveals your true Vocation, the Culture you create, the Brand you embody, and the Pearl — the distilled essence of your contribution to the world.',
}

const TAB_TITLES = {
  hologenetic: 'Complete Hologenetic Profile',
  activation: 'Activation Sequence — The Awakening Path',
  venus: 'Venus Sequence — The Path of Love',
  pearl: 'Pearl Sequence — The Path of Prosperity',
}

export default function GeneKeysDetail() {
  const profile = useActiveProfile()
  const [activeTab, setActiveTab] = useState('hologenetic')

  const profileData = useMemo(() => {
    if (!profile?.dob) return null
    try {
      const [year, month, day] = profile.dob.split('-').map(Number)
      const tob = profile.tob || profile.birthTime || '12:00'
      const [hour, minute] = tob.split(':').map(Number)
      const timezone = profile.birthTimezone ?? profile.timezone ?? -3
      const result = computeGeneKeysData({ day, month, year, hour: hour || 12, minute: minute || 0, timezone })
      return result
    } catch (e) {
      console.error('GeneKeysDetail error:', e)
      return null
    }
  }, [profile?.dob, profile?.tob, profile?.birthTime, profile?.birthTimezone, profile?.timezone])

  const activationSpheres = profileData?.SPHERES?.filter(s => !s.center) || []
  const centerSphere = profileData?.SPHERES?.find(s => s.center)
  const venusSpheres = profileData?.VENUS_SPHERES || []
  const pearlSpheres = profileData?.PEARL_SPHERES || []
  const allSpheres = [...activationSpheres, ...venusSpheres, ...pearlSpheres]
  const allSpheresWheel = profileData?.ALL_SPHERES_WHEEL || []

  // Which spheres to show based on active tab
  const tabSpheres = activeTab === 'hologenetic' ? allSpheres
    : activeTab === 'activation' ? activationSpheres
    : activeTab === 'venus' ? venusSpheres
    : pearlSpheres

  // Spheres for the wheel canvas (with xf/yf positions) — changes per tab
  const wheelSpheres = useMemo(() => {
    if (activeTab === 'hologenetic') return allSpheresWheel
    if (activeTab === 'activation') return [...activationSpheres, ...(centerSphere ? [centerSphere] : [])]
    if (activeTab === 'venus') return venusSpheres
    return pearlSpheres
  }, [activeTab, allSpheresWheel, activationSpheres, venusSpheres, pearlSpheres, centerSphere])

  const tabColor = TABS.find(t => t.id === activeTab)?.color || '#c9a84c'

  // Empty state
  if (!profile?.dob) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: .5, flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 40 }}>{'\u2B21'}</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)' }}>Add birth date to see your Gene Keys</div>
      </div>
    )
  }

  if (!activationSpheres.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: .5, flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 40 }}>{'\u2B21'}</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)' }}>Computing your Gene Keys...</div>
      </div>
    )
  }

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u2B21'} Gene Keys</div>
          <AboutSystemButton systemName="Gene Keys" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 8 }}>
          Hologenetic Profile — {allSpheres.length} keys across three sequences
        </div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        marginBottom: 0,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 6px 8px', cursor: 'pointer',
                background: isActive ? tab.color + '10' : 'transparent',
                border: 'none', borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                color: isActive ? tab.color : 'var(--muted-foreground)',
                fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '.1em',
                textTransform: 'uppercase', fontWeight: isActive ? 600 : 400,
                transition: 'all .2s', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 14, opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ═══ TAB CONTENT ═══ */}

      {/* Tab description */}
      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5 }}>
        {TAB_DESCRIPTIONS[activeTab]}
      </div>

      {/* Wheel visualization */}
      <div>
        <div style={S.sectionTitle}>{TAB_TITLES[activeTab]}</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 360, position: 'relative' }}>
          <GeneKeysWheel spheres={wheelSpheres} />
        </div>
      </div>

      {/* Sequence flow (for specific sequences) or all three (for hologenetic) */}
      {activeTab === 'hologenetic' ? (
        <div>
          <div style={S.sectionTitle}>The Three Sequences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SequenceFlow
              spheres={activationSpheres}
              color="#50b4dc"
              label="Activation Sequence"
              desc="The awakening path — from Life's Work to Purpose"
            />
            <SequenceFlow
              spheres={venusSpheres}
              color="#d43070"
              label="Venus Sequence"
              desc="The love path — relationships, emotional intelligence, spirit"
            />
            <SequenceFlow
              spheres={pearlSpheres}
              color="#f0c040"
              label="Pearl Sequence"
              desc="The prosperity path — vocation, culture, brand, abundance"
            />
          </div>
        </div>
      ) : (
        <div>
          <SequenceFlow
            spheres={tabSpheres}
            color={tabColor}
            label={TAB_TITLES[activeTab]}
            desc=""
          />
        </div>
      )}

      {/* Sphere grid */}
      <div>
        <div style={S.sectionTitle}>
          {activeTab === 'hologenetic'
            ? `Complete Profile — ${allSpheres.length} Spheres`
            : `${TABS.find(t => t.id === activeTab)?.label} Spheres — ${tabSpheres.length} Keys`}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {tabSpheres.map((gk, i) => {
            const color = SPHERE_COLORS[gk.role] || '#40ccdd'
            const d = GENE_KEYS_DATA[gk.key] || {}
            return (
              <div key={i} style={{
                ...S.glass, textAlign: 'center', padding: '16px 10px',
                borderColor: color + '22',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.2em',
                  textTransform: 'uppercase', color: color + 'aa',
                }}>{gk.role}</div>
                <GlowSphere gk={gk} color={color}>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--card)', border: '1px solid ' + color + '44',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)',
                  }}>.{gk.line}</div>
                </GlowSphere>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)' }}>
                  {d.gift || ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Map badges by sequence (hologenetic) or single sequence view */}
      {activeTab === 'hologenetic' ? (
        <div>
          <div style={S.sectionTitle}>Hologenetic Map — All {allSpheres.length} Keys</div>
          <div style={{
            ...S.glass, padding: '24px 20px', position: 'relative',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* Activation ring */}
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: '#50b4dc88', marginBottom: 8 }}>
                Activation — Awakening
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activationSpheres.map((s, i) => (
                  <MapBadge key={i} gk={s} fallbackColor="#50b4dc" />
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,.15), transparent)' }} />
            {/* Venus ring */}
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: '#d4307088', marginBottom: 8 }}>
                Venus — Love
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {venusSpheres.map((s, i) => (
                  <MapBadge key={i} gk={s} fallbackColor="#d43070" />
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,.15), transparent)' }} />
            {/* Pearl ring */}
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: '#f0c04088', marginBottom: 8 }}>
                Pearl — Prosperity
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pearlSpheres.map((s, i) => (
                  <MapBadge key={i} gk={s} fallbackColor="#f0c040" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Key cards for active tab */}
      <div>
        <div style={S.sectionTitle}>
          {activeTab === 'hologenetic' ? 'All Gene Key Profiles' : `${TABS.find(t => t.id === activeTab)?.label} Key Profiles`}
        </div>
        {tabSpheres.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tabSpheres.map((s, i) => (
              <KeyCard key={i} gk={s} color={SPHERE_COLORS[s.role] || tabColor} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: .4, padding: 40, fontFamily: "'Cinzel',serif", fontSize: 12 }}>
            {activeTab === 'venus' ? 'Venus Sequence requires planetary data' : 'Pearl Sequence requires planetary data'}
          </div>
        )}
      </div>

      {/* Contemplation (hologenetic tab only) */}
      {activeTab === 'hologenetic' && (
        <div>
          <div style={S.sectionTitle}>Hologenetic Contemplation</div>
          <div style={S.interpretation}>
            {(() => {
              if (!allSpheres.length) return "Add birth data to see your contemplation."
              const activationKeys = activationSpheres.map(s => s.key)
              const venusKeys = venusSpheres.map(s => s.key)
              const pearlKeys = pearlSpheres.map(s => s.key)
              const coreGifts = activationSpheres.map(s => {
                const d = GENE_KEYS_DATA[s.key]
                return d?.gift || 'integration'
              })
              const coreShadows = activationSpheres.map(s => {
                const d = GENE_KEYS_DATA[s.key]
                return d?.shadow || 'pattern'
              })
              const allKeyNumbers = [...activationKeys, ...venusKeys, ...pearlKeys]
              const repeatedKeys = allKeyNumbers.filter((k, i, arr) => arr.indexOf(k) !== i && arr.lastIndexOf(k) === i)

              let prose = `${profile?.name || 'Your'} hologenetic genome is written across ${activationKeys.length} pillars of awakening. `
              prose += `Your core path unfolds: from the shadow of ${coreShadows[0]} into the gift of ${coreGifts[0]}.`
              if (activationKeys.length > 1) {
                prose += ` Through ${activationKeys.slice(1).join(' and ')}, this gift spirals deeper\u2014each key revealing a new octave of your original consciousness.`
              }
              if (venusKeys.length > 0) {
                prose += ` Your relational field\u2014the Venus Sequence\u2014is encoded in Keys ${venusKeys.join(', ')}: how you attract, how you love, how your intelligence navigates the heart.`
              }
              if (pearlKeys.length > 0) {
                prose += ` Your prosperity arc\u2014the Pearl Sequence\u2014lives in Keys ${pearlKeys.join(', ')}: your vocation, your cultural expression, the abundance that flows through your unique offering.`
              }
              if (repeatedKeys.length > 0) {
                prose += ` The key(s) ${repeatedKeys.join(', ')} appear across multiple sequences\u2014this is rare. This key is a mirror point in your hologenetic design, asking you to look from many angles.`
              }
              prose += ` The journey from Shadow to Siddhi is not linear\u2014it is spiral, recursive, alive. You will return to each frequency at deeper levels of integration, each time seeing new facets of the same eternal pattern.`
              prose += ` <span style="color: var(--foreground)">Transformation happens through contemplation, not effort.</span> Sit with these keys. Let them show you what you already know.`

              return <div dangerouslySetInnerHTML={{ __html: prose }} />
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
