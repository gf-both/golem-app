import { useMemo } from 'react'
import TransitWheel from '../canvas/TransitWheel'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { useGolemStore } from '../../store/useGolemStore'
import { getNatalChart } from '../../engines/natalEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

const PLANET_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']
const PLANET_SYMS_T = { sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇' }
const PLANET_SPEED = { sun:'Normal',moon:'Fast',mercury:'Normal',venus:'Normal',mars:'Normal',jupiter:'Slow',saturn:'Slow',uranus:'Very Slow',neptune:'Very Slow',pluto:'Very Slow' }
const ASPECT_DEFS_T = [
  { aspect: 'Conjunction', angle: 0,   orb: 8, type: 'activating',  col: '#f0c040' },
  { aspect: 'Sextile',     angle: 60,  orb: 6, type: 'flowing',     col: '#50c8a0' },
  { aspect: 'Square',      angle: 90,  orb: 8, type: 'challenging', col: '#ee4466' },
  { aspect: 'Trine',       angle: 120, orb: 8, type: 'flowing',     col: '#40ccdd' },
  { aspect: 'Opposition',  angle: 180, orb: 8, type: 'challenging', col: '#7890ee' },
]

function mod360(x) { return ((x % 360) + 360) % 360 }
function formatDeg2(deg) {
  const d = Math.floor(deg); const m = Math.round((deg - d) * 60)
  return `${d}\u00B0${String(m).padStart(2,'0')}\u2032`
}

function parseDOB(dob) {
  if (!dob) return null
  const [y, m, d] = dob.split('-').map(Number)
  return { year: y, month: m, day: d }
}
function parseTOB(tob) {
  if (!tob) return { hour: 12, minute: 0 }
  const [h, m] = tob.split(':').map(Number)
  return { hour: h || 0, minute: m || 0 }
}

function findAspect(transitLon, natalLon) {
  let diff = Math.abs(mod360(transitLon - natalLon))
  if (diff > 180) diff = 360 - diff
  for (const asp of ASPECT_DEFS_T) {
    const orb = Math.abs(diff - asp.angle)
    if (orb <= asp.orb) return { aspect: asp.aspect, orb, type: asp.type }
  }
  return null
}

/** Return which natal house (1-12) a transit longitude falls in */
function getTransitHouse(lon, cusps) {
  if (!cusps || cusps.length < 12) return 0
  for (let i = 0; i < 12; i++) {
    const start = cusps[i].lon
    const end = cusps[(i + 1) % 12].lon
    const l = mod360(lon - start)
    const span = mod360(end - start) || 360
    if (l < span) return i + 1
  }
  return 1
}

/** Compute live transits against natal chart — reads raw store directly to avoid stale memo */
function useCurrentTransits() {
  const raw = useGolemStore(s => s.activeViewProfile || s.primaryProfile)
  return useMemo(() => {
    const dob = parseDOB(raw?.dob)
    const tob = parseTOB(raw?.tob)
    if (!dob) return { transits: [], natal: null }

    let natal
    try {
      natal = getNatalChart({
        day: dob.day, month: dob.month, year: dob.year,
        hour: tob.hour, minute: tob.minute,
        lat: raw.birthLat || 0,
        lon: raw.birthLon || 0,
        timezone: raw.birthTimezone ?? 0,
      })
    } catch (e) {
      console.error('TransitsDetail natal error:', e)
      return { transits: [], natal: null }
    }

    const now = new Date()
    let current
    try {
      current = getNatalChart({
        day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear(),
        hour: now.getUTCHours(), minute: now.getUTCMinutes(),
        lat: raw.birthLat || 0,
        lon: raw.birthLon || 0,
        timezone: 0,
      })
    } catch (e) {
      console.error('TransitsDetail current sky error:', e)
      return { transits: [], natal }
    }

    const natalCusps = natal.houses

    const transits = []
    for (const key of PLANET_ORDER) {
      const tp = current.planets[key]
      if (!tp) continue

      const bestAsp = { aspect: '\u2014', aspOrb: '\u2014', aspType: 'neutral' }
      let minOrb = 999

      for (const [nKey, np] of Object.entries(natal.planets)) {
        const asp = findAspect(tp.lon, np.lon)
        if (asp && asp.orb < minOrb) {
          minOrb = asp.orb
          bestAsp.aspect = `${asp.aspect} Natal ${nKey.charAt(0).toUpperCase() + nKey.slice(1)}`
          bestAsp.aspOrb = formatDeg2(asp.orb)
          bestAsp.aspType = asp.type
        }
      }
      for (const [aKey, angle] of Object.entries(natal.angles)) {
        const asp = findAspect(tp.lon, angle.lon)
        if (asp && asp.orb < minOrb) {
          minOrb = asp.orb
          bestAsp.aspect = `${asp.aspect} ${aKey.toUpperCase()}`
          bestAsp.aspOrb = formatDeg2(asp.orb)
          bestAsp.aspType = asp.type
        }
      }

      const house = getTransitHouse(tp.lon, natalCusps)

      transits.push({
        planet: key.charAt(0).toUpperCase() + key.slice(1),
        sym: PLANET_SYMS_T[key] || '?',
        sign: tp.sign,
        deg: formatDeg2(tp.degree),
        house,
        retro: tp.retrograde,
        speed: PLANET_SPEED[key] || 'Normal',
        aspect: bestAsp.aspect,
        aspOrb: bestAsp.aspOrb,
        aspType: bestAsp.aspType,
      })
    }
    return { transits, natal }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw?.id, raw?.name, raw?.dob, raw?.tob, raw?.birthLat, raw?.birthLon, raw?.birthTimezone])
}

const ASP_COLORS = {
  flowing:     { color: '#40ccdd', bg: 'rgba(64,204,221,.08)',   border: 'rgba(64,204,221,.2)' },
  challenging: { color: '#ee4466', bg: 'rgba(238,68,102,.08)',   border: 'rgba(238,68,102,.2)' },
  activating:  { color: '#f0c040', bg: 'rgba(240,192,64,.08)',   border: 'rgba(240,192,64,.2)' },
  transforming:{ color: '#9050e0', bg: 'rgba(144,80,224,.08)',   border: 'rgba(144,80,224,.2)' },
  dissolving:  { color: '#6699ee', bg: 'rgba(102,153,238,.08)',  border: 'rgba(102,153,238,.2)' },
  neutral:     { color: 'var(--muted-foreground)', bg: 'transparent', border: 'var(--border)' },
}

const SPEED_COLORS = {
  Fast: '#40ccdd',
  Normal: 'var(--muted-foreground)',
  Slow: '#f0c040',
  'Very Slow': '#d43070',
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
    borderRadius: 12, padding: 16, backdropFilter: 'blur(12px)',
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

function formatDateHeader(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function TransitsDetail() {
  const profile = useActiveProfile()
  const { transits: liveTransits, natal } = useCurrentTransits()
  const hasDob = !!(profile?.dob)
  const today = new Date()
  const todayLabel = formatDateHeader(today)

  if (!hasDob) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12, opacity:.5 }}>
      <div style={{ fontSize:40 }}>☽</div>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--gold)' }}>Add birth date to see transits</div>
      <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>Transit calculations require your natal chart</div>
    </div>
  )

  return (
    <div style={S.panel}>

      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'☿'} Planetary Transits</div>
          <AboutSystemButton systemName="Transits" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          {todayLabel} — Current sky positions and natal aspects for {profile?.name || 'your chart'}
        </div>
      </div>

      {/* TRANSIT WHEEL */}
      <div>
        <div style={S.sectionTitle}>Transit Wheel Overlay</div>
        <div style={{ ...S.glass, padding: 0, overflow: 'hidden', height: 460, position: 'relative' }}>
          <TransitWheel />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--ring)', fontFamily: "'Cinzel',serif" }}>
            {'●'} Inner Ring: Natal
          </span>
          <span style={{ fontSize: 10, color: 'rgba(64,204,221,.5)', fontFamily: "'Cinzel',serif" }}>
            {'●'} Outer Ring: Transits
          </span>
          <span style={{ fontSize: 10, color: 'rgba(144,80,224,.4)', fontFamily: "'Cinzel',serif" }}>
            --- Aspect Lines
          </span>
        </div>
      </div>

      {/* CURRENT POSITIONS TABLE */}
      <div>
        <div style={S.sectionTitle}>Current Planetary Positions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 80px 80px 60px 50px 50px 60px 1fr', gap: 8, padding: '4px 12px' }}>
            {['', 'PLANET', 'SIGN', 'DEGREE', 'HOUSE', 'SPEED', 'STATUS', 'NATAL ASPECT'].map((h, i) => (
              <span key={i} style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, color: 'var(--muted-foreground)' }}>{h}</span>
            ))}
          </div>
          {liveTransits.map((t, i) => {
            const ac = ASP_COLORS[t.aspType] || ASP_COLORS.neutral
            return (
              <div key={i} style={{
                ...S.row, display: 'grid',
                gridTemplateColumns: '30px 80px 80px 60px 50px 50px 60px 1fr',
                gap: 8, borderLeftColor: ac.color, borderLeftWidth: 2,
              }}>
                <span style={{ fontSize: 18, textAlign: 'center', color: ac.color }}>{t.sym}</span>
                <span style={{ ...S.mono }}>{t.planet}</span>
                <span style={{ ...S.mono }}>{t.sign}</span>
                <span style={S.monoSm}>{t.deg}</span>
                <span style={{ ...S.monoSm, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
                    fontFamily: "'Cinzel', serif", fontSize: 10, color: 'var(--foreground)',
                  }}>{t.house || '—'}</span>
                </span>
                <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, color: SPEED_COLORS[t.speed] || 'var(--muted-foreground)' }}>{t.speed}</span>
                <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, color: t.retro ? 'var(--rose)' : 'var(--muted-foreground)' }}>
                  {t.retro ? '\u211E Rx' : 'Direct'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {t.aspType !== 'neutral' && (
                    <span style={S.badge(ac.bg, ac.border, ac.color)}>{t.aspType}</span>
                  )}
                  <span style={{ ...S.monoSm, fontSize: 10, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.aspect}
                  </span>
                  {t.aspOrb !== '\u2014' && (
                    <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)', flexShrink: 0 }}>{t.aspOrb}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RETROGRADE STATUS */}
      <div>
        <div style={S.sectionTitle}>Retrograde Status</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {liveTransits.map((t, i) => {
            const isRetro = t.retro
            return (
              <div key={i} style={{
                ...S.glass, padding: '10px 14px', minWidth: 90, textAlign: 'center',
                borderColor: isRetro ? 'rgba(212,48,112,.2)' : 'var(--border)',
                background: isRetro ? 'rgba(212,48,112,.04)' : 'rgba(5,5,26,.5)',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4, color: isRetro ? 'var(--rose)' : 'var(--muted-foreground)' }}>{t.sym}</div>
                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: isRetro ? 'var(--rose2)' : 'var(--muted-foreground)' }}>
                  {isRetro ? '\u211E Retro' : 'Direct'}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '.1em', color: 'var(--muted-foreground)', marginTop: 2, textTransform: 'uppercase' }}>{t.planet}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* NATAL REFERENCE */}
      {natal && (
        <div>
          <div style={S.sectionTitle}>Natal Positions — {profile?.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PLANET_ORDER.filter(k => natal.planets[k]).map(k => {
              const p = natal.planets[k]
              const h = getTransitHouse(p.lon, natal.houses)
              return (
                <div key={k} style={{ ...S.glass, padding: '8px 12px', minWidth: 88, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: 'var(--gold)' }}>{PLANET_SYMS_T[k] || '?'}</div>
                  <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--foreground)', marginTop: 2 }}>
                    {p.sign} {formatDeg2(p.degree)}
                  </div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.08em', color: 'var(--muted-foreground)', marginTop: 2, textTransform: 'uppercase' }}>
                    {k} · H{h}
                  </div>
                </div>
              )
            })}
            {Object.entries(natal.angles).map(([k, a]) => (
              <div key={k} style={{ ...S.glass, padding: '8px 12px', minWidth: 88, textAlign: 'center', borderColor: 'rgba(201,168,76,.2)' }}>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontFamily: "'Cinzel',serif", letterSpacing: '.1em' }}>{k.toUpperCase()}</div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--foreground)', marginTop: 2 }}>
                  {a.sign} {formatDeg2(a.degree)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE TRANSIT SUMMARY */}
      <div>
        <div style={S.sectionTitle}>Active Aspects Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {liveTransits.filter(t => t.aspType !== 'neutral' && t.aspect !== '\u2014').map((t, i) => {
            const ac = ASP_COLORS[t.aspType] || ASP_COLORS.activating
            return (
              <div key={i} style={{ ...S.row, borderLeftColor: ac.color, borderLeftWidth: 2, gap: 10 }}>
                <span style={{ fontSize: 16, color: ac.color, minWidth: 20 }}>{t.sym}</span>
                <span style={{ ...S.mono, minWidth: 70 }}>{t.planet}</span>
                <span style={{ ...S.monoSm, minWidth: 90 }}>{t.sign} {t.deg}</span>
                <span style={S.badge(ac.bg, ac.border, ac.color)}>{t.aspType}</span>
                <span style={{ ...S.monoSm, fontSize: 10, color: 'var(--muted-foreground)', flex: 1 }}>
                  {t.aspect}{t.aspOrb !== '\u2014' ? ` (${t.aspOrb})` : ''}
                </span>
                <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)' }}>H{t.house}</span>
              </div>
            )
          })}
          {liveTransits.every(t => t.aspType === 'neutral' || t.aspect === '\u2014') && (
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '8px 0' }}>
              No major natal aspects active today. A quiet, self-directed window.
            </div>
          )}
        </div>
      </div>

      {/* DAILY ENERGY SNAPSHOT */}
      <div>
        <div style={S.sectionTitle}>Daily Energy Snapshot — {todayLabel}</div>
        <div style={S.interpretation}>
          {(() => {
            const active = liveTransits
              .filter(t => t.aspType !== 'neutral' && t.aspect !== '\u2014')
              .sort((a, b) => {
                const order = { activating: 0, challenging: 1, transforming: 2, dissolving: 3, flowing: 4 }
                return (order[a.aspType] ?? 5) - (order[b.aspType] ?? 5)
              }).slice(0, 3)

            if (active.length === 0) {
              return (
                <span style={{ color: 'var(--muted-foreground)' }}>
                  The sky makes no close aspects to your natal chart today. A day for internal work,
                  rest, or steady progress on existing projects — not a day of external activation.
                </span>
              )
            }
            return active.map((t, i) => {
              const ac = ASP_COLORS[t.aspType] || ASP_COLORS.activating
              const desc = {
                flowing: 'Ease and harmony support action in this domain.',
                challenging: 'Productive friction — tension that demands conscious navigation.',
                activating: 'High activation. Significant energy and potential events here.',
                transforming: 'Deep transformative pressure — something fundamental is shifting.',
                dissolving: 'Dissolution and boundary-softening. Stay grounded and discerning.',
              }[t.aspType] || ''
              return (
                <span key={i}>
                  {i > 0 && <><br /><br /></>}
                  <span style={{ color: ac.color }}>{t.planet} {t.sign} — {t.aspect}</span>
                  {t.aspOrb !== '\u2014' && <span style={{ color: 'var(--muted-foreground)' }}> ({t.aspOrb})</span>}
                  {'. '}
                  <span style={{ color: 'var(--muted-foreground)' }}>{desc} Transit through H{t.house}.</span>
                </span>
              )
            })
          })()}
        </div>
      </div>

    </div>
  )
}
