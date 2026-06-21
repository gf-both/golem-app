import { useMemo, useState, useRef } from 'react'
import { SEPHIROTH, PATHS } from '../../data/kabbalahData'
import { getKabbalahProfile, profileToKabArgs } from '../../engines/kabbalahEngine'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import KabbalahTree from '../canvas/KabbalahTree'
import AboutSystemButton from '../ui/AboutSystemButton'

const SEPHIROTH_INTERP = [
  { name: 'Kether',    attr: 'Crown',         pillar: 'Equilibrium',
    interp: 'The source of divine will. Your Kether activation indicates a strong connection to transcendent awareness and the origin point of consciousness.',
    dormInterp: 'The Crown remains veiled — an invitation to dissolve the ego and open to the divine source beyond personal will.' },
  { name: 'Chokmah',   attr: 'Wisdom',         pillar: 'Mercy',
    interp: 'Primal masculine force and the first flash of creative insight. Your activation here reveals raw visionary capacity -- ideas arise before form.',
    dormInterp: 'The flash of primal wisdom is dormant — a growth edge to cultivate spontaneous knowing beyond linear thought.' },
  { name: 'Binah',     attr: 'Understanding',  pillar: 'Severity',
    interp: 'The Great Mother who gives form to the formless. Deep receptive intelligence, capacity to hold paradox, and structural comprehension.',
    dormInterp: 'Understanding waits in potential — the capacity to receive and give form to raw inspiration is still developing.' },
  { name: 'Chesed',    attr: 'Mercy',           pillar: 'Mercy',
    interp: 'Loving-kindness and expansion. Chesed active in your tree opens channels of generosity, abundance, and magnanimous vision.',
    dormInterp: 'Loving-kindness and expansion are dormant — a growth edge inviting you to cultivate generosity without condition.' },
  { name: 'Geburah',   attr: 'Severity',        pillar: 'Severity',
    interp: 'The warrior\'s discipline. Active in your tree -- you carry the capacity for discernment, boundaries, and the courage to cut away what no longer serves.',
    dormInterp: 'The sword of discernment rests — boundaries and disciplined judgment are still being forged.' },
  { name: 'Tiphareth', attr: 'Beauty',           pillar: 'Equilibrium',
    interp: 'The heart of the Tree, the Christ/Buddha center. Your strongest activation -- the integrator of all opposites, beauty born from balance.',
    dormInterp: 'The heart center awaits integration — the path to Tiphareth opens through harmonizing the opposing forces in your life.' },
  { name: 'Netzach',   attr: 'Emotions',         pillar: 'Mercy',
    interp: 'Victory through endurance and feeling. Active -- emotional intelligence and creative passion are live currents in your field.',
    dormInterp: 'Victory through feeling is dormant — an invitation to develop trust in emotional intelligence and creative passion.' },
  { name: 'Hod',       attr: 'Mind',             pillar: 'Severity',
    interp: 'Splendor of the intellect, communication, and form. Active -- your analytical and communicative faculties are well-developed and precise.',
    dormInterp: 'The mind\'s splendor awaits clarity — analytical precision and effective communication are areas of growth.' },
  { name: 'Yesod',     attr: 'Foundation',       pillar: 'Equilibrium',
    interp: 'The astral bridge between the seen and unseen. Active -- strong dream life, psychic sensitivity, and capacity to channel higher energies into daily reality.',
    dormInterp: 'The dream bridge is quiet — the subconscious and astral sensitivities are still being cultivated.' },
  { name: 'Malkuth',   attr: 'Kingdom',          pillar: 'Equilibrium',
    interp: 'The physical realm and embodied presence. Active -- grounded manifestation is your birthright, bringing the spiritual into matter.',
    dormInterp: 'Malkuth is always grounded in physical reality.' },
]

const PILLARS = [
  { name: 'Pillar of Severity', hebrew: 'Din', side: 'Left',
    sephiroth: ['Binah', 'Geburah', 'Hod'],
    desc: 'The feminine, receptive, form-giving pillar. Represents discipline, structure, and the power to limit and define. Active Geburah and Hod on this pillar indicate strong analytical boundaries.',
    color: 'var(--rose)' },
  { name: 'Pillar of Equilibrium', hebrew: 'Shvil haZahav', side: 'Middle',
    sephiroth: ['Kether', 'Tiphareth', 'Yesod', 'Malkuth'],
    desc: 'The central column of balance and consciousness. All four sephiroth are active -- the spine of your Tree is fully illuminated, indicating a soul path focused on integration and wholeness.',
    color: 'var(--foreground)' },
  { name: 'Pillar of Mercy', hebrew: 'Chesed', side: 'Right',
    sephiroth: ['Chokmah', 'Chesed', 'Netzach'],
    desc: 'The masculine, expansive, force-giving pillar. Chokmah is active but Chesed and Netzach are dormant -- wisdom flows but may struggle to find its generous, loving expression.',
    color: 'var(--aqua2)' },
]

const ACTIVE_PATHS = [
  { num: 14, from: 'Kether', to: 'Tiphareth', tarot: 'The Empress (III)', desc: 'Creative abundance flowing from crown to heart' },
  { num: 17, from: 'Chokmah', to: 'Tiphareth', tarot: 'The Lovers (VI)', desc: 'Wisdom integrating through the heart center' },
  { num: 25, from: 'Tiphareth', to: 'Yesod', tarot: 'Temperance (XIV)', desc: 'Balanced alchemy between beauty and foundation' },
  { num: 30, from: 'Yesod', to: 'Malkuth', tarot: 'The Sun (XIX)', desc: 'Solar vitality grounding into physical reality' },
  { num: 31, from: 'Netzach', to: 'Malkuth', tarot: 'Judgment (XX)', desc: 'Emotional resurrection manifesting in the world' },
  { num: 7, from: 'Binah', to: 'Hod', tarot: 'The Chariot (VII)', desc: 'Understanding disciplining the mind into motion' },
  { num: 11, from: 'Geburah', to: 'Hod', tarot: 'Justice (VIII)', desc: 'Severity refining intellectual discernment' },
]

const PILLAR_COLORS = {
  Severity: 'var(--rose)',
  Equilibrium: 'var(--foreground)',
  Mercy: 'var(--aqua2)',
}

/* ─── Sephiroth tooltip data ─────────────────────────────────────────────── */
const SEPH_TOOLTIPS = {
  Kether:    { hebrew: '\u05DB\u05EA\u05E8', divine: 'Ehyeh Asher Ehyeh', planet: 'Primum Mobile', body: 'Crown of the head', element: 'Spirit', archangel: 'Metatron', virtue: 'Attainment / Completion of the Great Work', vice: 'None (beyond duality)' },
  Chokmah:   { hebrew: '\u05D7\u05DB\u05DE\u05D4', divine: 'Yah', planet: 'Zodiac / Neptune', body: 'Left brain', element: 'Fire', archangel: 'Raziel', virtue: 'Devotion', vice: 'None applicable' },
  Binah:     { hebrew: '\u05D1\u05D9\u05E0\u05D4', divine: 'YHVH Elohim', planet: 'Saturn', body: 'Right brain', element: 'Water', archangel: 'Tzaphkiel', virtue: 'Silence', vice: 'Avarice' },
  Chesed:    { hebrew: '\u05D7\u05E1\u05D3', divine: 'El', planet: 'Jupiter', body: 'Left arm', element: 'Water', archangel: 'Tzadkiel', virtue: 'Obedience', vice: 'Bigotry / Hypocrisy / Tyranny' },
  Geburah:   { hebrew: '\u05D2\u05D1\u05D5\u05E8\u05D4', divine: 'Elohim Gibor', planet: 'Mars', body: 'Right arm', element: 'Fire', archangel: 'Khamael', virtue: 'Energy / Courage', vice: 'Cruelty / Destruction' },
  Tiphareth: { hebrew: '\u05EA\u05E4\u05D0\u05E8\u05EA', divine: 'YHVH Eloah va-Daath', planet: 'Sun', body: 'Heart / chest', element: 'Air', archangel: 'Raphael', virtue: 'Devotion to the Great Work', vice: 'Pride' },
  Netzach:   { hebrew: '\u05E0\u05E6\u05D7', divine: 'YHVH Tzabaoth', planet: 'Venus', body: 'Left hip / leg', element: 'Fire', archangel: 'Haniel', virtue: 'Unselfishness', vice: 'Unchastity / Lust' },
  Hod:       { hebrew: '\u05D4\u05D5\u05D3', divine: 'Elohim Tzabaoth', planet: 'Mercury', body: 'Right hip / leg', element: 'Water', archangel: 'Michael', virtue: 'Truthfulness', vice: 'Falsehood / Dishonesty' },
  Yesod:     { hebrew: '\u05D9\u05E1\u05D5\u05D3', divine: 'Shaddai El Chai', planet: 'Moon', body: 'Generative organs', element: 'Air', archangel: 'Gabriel', virtue: 'Independence', vice: 'Idleness' },
  Malkuth:   { hebrew: '\u05DE\u05DC\u05DB\u05D5\u05EA', divine: 'Adonai ha-Aretz', planet: 'Earth', body: 'Feet / physical body', element: 'Earth', archangel: 'Sandalphon', virtue: 'Discrimination', vice: 'Avarice / Inertia' },
}

/* ─── Kabbalah Tooltip component ─────────────────────────────────────────── */
function KabTooltip({ data, children }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)
  if (!data) return children
  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ x: rect.left + rect.width / 2, y: rect.top })
    }
    setShow(true)
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'fixed', left: Math.max(10, pos.x - 150), top: Math.max(10, pos.y - 180),
          width: 300, padding: '14px 16px', borderRadius: 10,
          background: 'var(--popover)', border: '1px solid rgba(201,168,76,.2)',
          backdropFilter: 'blur(20px)', zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20, fontFamily: 'serif', color: '#c9a84c' }}>{data.hebrew}</span>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,.6)' }}>DIVINE NAME: {data.divine}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Planet: <span style={{ color: '#c9a84c' }}>{data.planet}</span></div>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Element: <span style={{ color: '#c9a84c' }}>{data.element}</span></div>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Body: <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>{data.body}</span></div>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Archangel: <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>{data.archangel}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(201,168,76,.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.2)' }}>Virtue: {data.virtue}</span>
            {data.vice !== 'None (beyond duality)' && data.vice !== 'None applicable' && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(204,68,68,.1)', color: '#cc6666', border: '1px solid rgba(204,68,68,.2)' }}>Vice: {data.vice}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
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

export default function KabbalahDetail() {
  const profile = useActiveProfile()

  // Compute live active states from birth data
  const { SEPHIROTH_DETAIL, PILLARS_LIVE, ACTIVE_PATHS_LIVE } = useMemo(() => {
    let liveResult = null
    try {
const kabArgs = profileToKabArgs(profile)
      if (kabArgs) liveResult = getKabbalahProfile(kabArgs)
    } catch {
      // fall back to static data
    }

    const detail = SEPHIROTH_INTERP.map((s, i) => {
      const liveS = liveResult?.sephiroth?.find(r => r.name === s.name)
      const active = liveS ? liveS.active : SEPHIROTH[i]?.active ?? true
      return {
        ...s,
        num: i + 1,
        active,
        interp: active ? s.interp : s.dormInterp,
      }
    })

    const activeNames = new Set(detail.filter(s => s.active).map(s => s.name))
    const severityActive = ['Binah','Geburah','Hod'].filter(n => activeNames.has(n)).length
    const mercyActive    = ['Chokmah','Chesed','Netzach'].filter(n => activeNames.has(n)).length

    const pillars = [
      { name: 'Pillar of Severity', hebrew: 'Din', side: 'Left',
        sephiroth: ['Binah', 'Geburah', 'Hod'],
        desc: severityActive >= 2
          ? 'The left pillar of form and discipline is active — strong analytical boundaries and the power to limit and define shape your path.'
          : 'The pillar of severity is largely dormant — discipline and structural thinking are growth areas.',
        color: 'var(--rose)' },
      { name: 'Pillar of Equilibrium', hebrew: 'Shvil haZahav', side: 'Middle',
        sephiroth: ['Kether', 'Tiphareth', 'Yesod', 'Malkuth'],
        desc: (() => {
          const eq = ['Kether','Tiphareth','Yesod','Malkuth'].filter(n => activeNames.has(n)).length
          return eq === 4
            ? 'All four sephiroth are active — the spine of your Tree is fully illuminated, indicating a soul path focused on integration and wholeness.'
            : `${eq} of 4 equilibrium sephiroth are active — the central column is partially illuminated.`
        })(),
        color: 'var(--foreground)' },
      { name: 'Pillar of Mercy', hebrew: 'Chesed', side: 'Right',
        sephiroth: ['Chokmah', 'Chesed', 'Netzach'],
        desc: mercyActive >= 2
          ? 'The right pillar of expansion and force is active — generous, outward-moving energy shapes your expression.'
          : 'Chokmah may flow but expansive mercy and emotional victory are dormant — wisdom seeks its loving expression.',
        color: 'var(--aqua2)' },
    ]

    const activePaths = liveResult?.activePaths?.filter(p => p.active).map(p => ({
      num: p.num, from: p.from, to: p.to, tarot: p.tarot,
      desc: `${p.letter} — ${p.from} → ${p.to}`,
    })) ?? ACTIVE_PATHS

    return { SEPHIROTH_DETAIL: detail, PILLARS_LIVE: pillars, ACTIVE_PATHS_LIVE: activePaths }
  }, [profile?.dob, profile?.tob, profile?.birthLat, profile?.birthLon, profile?.birthTimezone])

  const activeCount = SEPHIROTH_DETAIL.filter(s => s.active).length

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u2721'} Kabbalah</div>
          <AboutSystemButton systemName="Kabbalah" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Tree of Life -- Sephiroth, pillars, paths, and the hidden Da'ath
        </div>
      </div>

      {/* INTERACTIVE TREE */}
      <div>
        <div style={S.sectionTitle}>Tree of Life</div>
        <div style={{
          ...S.glass, padding: 0, overflow: 'visible',
          height: 480, position: 'relative',
        }}>
          <KabbalahTree />
        </div>
      </div>

      {/* SEPHIROTH */}
      <div>
        <div style={S.sectionTitle}>
          The 10 Sephiroth
          <span style={{ float: 'right', fontFamily: "'Inconsolata', monospace", fontSize: 10 }}>
            <span style={{ color: 'var(--foreground)' }}>{activeCount} active</span>
            {' / '}
            <span style={{ color: 'var(--muted-foreground)' }}>{10 - activeCount} dormant</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SEPHIROTH_DETAIL.map((s, i) => {
            const orig = SEPHIROTH.find(o => o.name === s.name)
            return (
              <KabTooltip key={i} data={SEPH_TOOLTIPS[s.name]}>
              <div style={{
                ...S.row, cursor: 'help',
                borderColor: s.active ? 'rgba(201,168,76,0.2)' : 'var(--secondary)',
                background: s.active ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,.015)',
                flexDirection: 'column', alignItems: 'stretch', gap: 6,
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 22, minWidth: 36, textAlign: 'center',
                    color: s.active ? 'rgba(201,168,76,0.9)' : 'var(--muted-foreground)',
                    opacity: s.active ? 1 : 0.4,
                  }}>
                    {orig?.glyph || '\u25CB'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: '.1em',
                        color: s.active ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}>
                        {s.name}
                      </span>
                      <span style={{
                        fontFamily: "'Inconsolata', monospace", fontSize: 11,
                        color: 'var(--muted-foreground)', opacity: 0.6,
                      }}>#{s.num}</span>
                      <span style={S.badge(
                        PILLAR_COLORS[s.pillar] ? PILLAR_COLORS[s.pillar].replace(')', '') + ', .08)' : 'var(--secondary)',
                        PILLAR_COLORS[s.pillar] ? PILLAR_COLORS[s.pillar].replace(')', '') + ', .2)' : 'rgba(255,255,255,.08)',
                        PILLAR_COLORS[s.pillar] || 'var(--muted-foreground)',
                      )}>
                        {s.pillar}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.12em',
                      textTransform: 'uppercase', color: 'var(--muted-foreground)', marginTop: 2,
                    }}>
                      {s.attr}
                    </div>
                  </div>
                  <span style={S.badge(
                    s.active ? 'var(--accent)' : 'var(--secondary)',
                    s.active ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.08)',
                    s.active ? 'var(--foreground)' : 'var(--muted-foreground)',
                  )}>
                    {s.active ? 'Active' : 'Dormant'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 48 }}>
                  {s.interp}
                </div>
              </div>
              </KabTooltip>
            )
          })}
        </div>
      </div>

      {/* THE THREE PILLARS */}
      <div>
        <div style={S.sectionTitle}>The Three Pillars</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PILLARS_LIVE.map((p, i) => (
            <div key={i} style={{
              ...S.glass,
              borderColor: p.color.includes('var') ? undefined : p.color + '22',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '.12em',
                  color: p.color, marginBottom: 2,
                }}>{p.name}</div>
                <div style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'var(--muted-foreground)',
                }}>{p.hebrew} -- {p.side}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {p.sephiroth.map((sn, j) => {
                  const sd = SEPHIROTH_DETAIL.find(s => s.name === sn)
                  return (
                    <span key={j} style={S.badge(
                      sd?.active ? 'var(--accent)' : 'var(--secondary)',
                      sd?.active ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)',
                      sd?.active ? 'var(--foreground)' : 'var(--muted-foreground)',
                    )}>{sn}</span>
                  )
                })}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.5, textAlign: 'center' }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE PATHS */}
      <div>
        <div style={S.sectionTitle}>Active Paths &amp; Tarot Arcana</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACTIVE_PATHS_LIVE.map((p, i) => (
            <div key={i} style={S.row}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, background: 'var(--accent)', border: '1px solid var(--accent)',
                flexShrink: 0,
              }}>{p.num}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...S.mono, color: 'var(--muted-foreground)', fontSize: 11 }}>
                    {p.from} {'\u2192'} {p.to}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{p.desc}</span>
              </div>
              <span style={{
                ...S.badge('rgba(144,80,224,.1)', 'rgba(144,80,224,.25)', 'var(--violet2)'),
                flexShrink: 0, whiteSpace: 'nowrap',
              }}>{p.tarot}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DA'ATH */}
      <div>
        <div style={S.sectionTitle}>Da'ath -- The Hidden Knowledge</div>
        <div style={{
          ...S.glass,
          background: 'rgba(104,32,176,.04)', borderColor: 'rgba(144,80,224,.15)',
          textAlign: 'center', padding: '24px 20px',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 24, color: 'var(--violet2)',
            letterSpacing: '.2em', marginBottom: 8,
          }}>Da'ath</div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 14,
          }}>The Abyss -- Knowledge Beyond Understanding</div>
          <div style={{
            fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.7,
            maxWidth: 600, margin: '0 auto',
          }}>
            Da'ath is the invisible Sephirah that sits between the Supernal Triad (Kether, Chokmah, Binah)
            and the lower seven. It represents the crossing of the Abyss -- the ego-death necessary to
            access higher consciousness. With both Chokmah and Binah active in your tree, Da'ath becomes
            a gateway. The challenge is to cross without grasping -- to let go of what you think you know
            and embrace the void of unknowing. This is where intellect surrenders to gnosis.
          </div>
        </div>
      </div>

      {/* LIFE PATH ANALYSIS */}
      <div>
        <div style={S.sectionTitle}>Personal Kabbalah Life Path</div>
        <div style={S.interpretation}>
          Your Tree of Life reveals a <span style={{ color: 'var(--foreground)' }}>strongly illuminated central pillar</span> --
          Kether, Tiphareth, Yesod, and Malkuth are all active, forming an unbroken channel from
          divine crown to earthly kingdom. This is the mark of a soul whose purpose is{' '}
          <span style={{ color: 'var(--aqua2)' }}>integration and embodiment</span> rather than retreat
          from the world. The active Geburah-Hod axis on the Pillar of Severity gives you sharp
          discernment and intellectual discipline, while the dormant Chesed and Netzach suggest that
          your growth edge lies in opening to <span style={{ color: 'var(--rose2)' }}>unconditional
          generosity and emotional expression</span>. The path from Kether to Tiphareth through The
          Empress archetype (Path 14) indicates that your creative power flows most naturally when
          rooted in beauty, sensuality, and natural abundance rather than forced effort.
        </div>
      </div>
    </div>
  )
}
