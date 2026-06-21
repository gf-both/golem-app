import { useMemo } from 'react'
import NatalWheel from '../canvas/NatalWheel'
import NatalRadialBars from '../canvas/NatalRadialBars'
import NatalHemisphere from '../canvas/NatalHemisphere'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import { getNatalChart } from '../../engines/natalEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

const PLANET_SYMS = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  northNode: '☊', chiron: '⚷',
}

// Dignities table: [sign] → { planet: 'detriment'|'exaltation'|'fall'|'domicile' }
const DIGNITIES = {
  Aries:       { mars: 'domicile', sun: 'exaltation', venus: 'detriment', saturn: 'fall' },
  Taurus:      { venus: 'domicile', moon: 'exaltation', mars: 'detriment', uranus: 'detriment', pluto: 'fall' },
  Gemini:      { mercury: 'domicile', jupiter: 'detriment' },
  Cancer:      { moon: 'domicile', jupiter: 'exaltation', saturn: 'detriment', mars: 'fall' },
  Leo:         { sun: 'domicile', saturn: 'detriment', uranus: 'detriment', neptune: 'fall' },
  Virgo:       { mercury: 'domicile', mercury2: 'exaltation', jupiter: 'detriment', venus: 'fall', neptune: 'detriment' },
  Libra:       { venus: 'domicile', saturn: 'exaltation', mars: 'detriment', sun: 'fall' },
  Scorpio:     { mars: 'domicile', pluto: 'domicile', moon: 'fall', venus: 'detriment', uranus: 'exaltation' },
  Sagittarius: { jupiter: 'domicile', mercury: 'detriment', neptune: 'domicile' },
  Capricorn:   { saturn: 'domicile', mars: 'exaltation', moon: 'detriment', jupiter: 'fall' },
  Aquarius:    { saturn: 'domicile', uranus: 'domicile', sun: 'detriment', neptune: 'exaltation' },
  Pisces:      { jupiter: 'domicile', neptune: 'domicile', venus: 'exaltation', mercury: 'detriment', mercury2: 'fall' },
}

function getPlanetDignity(planetKey, sign) {
  const signData = DIGNITIES[sign]
  if (!signData) return null
  const status = signData[planetKey]
  if (!status) return null
  if (status === 'exaltation') return 'Exalt'
  if (status === 'detriment') return 'Detr'
  if (status === 'fall') return 'Fall'
  if (status === 'domicile') return 'Dom'
  return null
}

const PLANET_COLORS_TABLE = {
  sun: '#b87800', moon: '#4455aa', mercury: '#2277aa', venus: '#993322',
  mars: '#bb2222', jupiter: '#997700', saturn: '#5a6645', uranus: '#2288aa',
  neptune: '#3355cc', pluto: '#774488', northNode: '#886633', chiron: '#885544',
}

const ASPECT_SYMBOLS = {
  conjunction: '\u260C', opposition: '\u260D', trine: '\u25B3', square: '\u25A1', sextile: '\u26BA',
}
const ASPECT_COLORS_MAP = {
  conjunction: '#f0c040', opposition: '#7890ee', trine: '#40ccdd', square: '#dd5555', sextile: '#50c8a0',
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

function useNatalChart() {
  const profile = useActiveProfile()
  return useMemo(() => {
    const dob = parseDOB(profile.dob)
    const tob = parseTOB(profile.tob)
    if (!dob) return null
    try {
      return getNatalChart({
        day: dob.day, month: dob.month, year: dob.year,
        hour: tob.hour, minute: tob.minute,
        lat: profile.birthLat ?? -34.6037,
        lon: profile.birthLon ?? -58.3816,
        timezone: profile.birthTimezone ?? -3,
      })
    } catch { return null }
  }, [profile.dob, profile.tob, profile.birthLat, profile.birthLon, profile.birthTimezone])
}

/** Determine which house a planet longitude falls in */
function getHouseFor(lon, houses) {
  for (let i = 0; i < 12; i++) {
    const cuspStart = houses[i].lon
    const cuspEnd = houses[(i + 1) % 12].lon
    let within
    if (cuspStart <= cuspEnd) {
      within = lon >= cuspStart && lon < cuspEnd
    } else {
      // Wrap around 0/360
      within = lon >= cuspStart || lon < cuspEnd
    }
    if (within) return i + 1
  }
  return 1
}

function formatDeg(deg) {
  const d = Math.floor(deg)
  const m = Math.round((deg - d) * 60)
  return `${d}\u00B0${String(m).padStart(2,'0')}\u2032`
}

const ELEMENT_COLORS = {
  Fire: '#ee4444',
  Earth: '#60b030',
  Air: '#40ccdd',
  Water: '#4488ee',
}

const MODALITY_COLORS = {
  Cardinal: '#f0c040',
  Fixed: '#d43070',
  Mutable: '#9050e0',
}

const SIGN_ELEMENTS = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

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
  symbolLg: { fontSize: 22, minWidth: 28, textAlign: 'center' },
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

export default function NatalDetail() {
  const chart = useNatalChart()

  // Build dynamic PLANETS list from chart
  const PLANETS = useMemo(() => {
    if (!chart) return []
    const list = []
    const planetOrder = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northNode','chiron']
    for (const key of planetOrder) {
      const p = chart.planets[key]
      if (!p) continue
      const shortName = key === 'northNode' ? 'Node' : key === 'chiron' ? 'Chiron'
        : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      list.push({
        name: shortName,
        key,
        sym: PLANET_SYMS[key] || '?',
        sign: p.sign,
        deg: formatDeg(p.degree),
        house: getHouseFor(p.lon, chart.houses),
        retro: p.retrograde,
        dignity: getPlanetDignity(key, p.sign),
      })
    }
    // Add ASC and MC
    list.push({ name: 'ASC', key: 'asc', sym: 'AC', sign: chart.angles.asc.sign, deg: formatDeg(chart.angles.asc.degree), house: 1, retro: false, dignity: null })
    list.push({ name: 'MC', key: 'mc', sym: 'MC', sign: chart.angles.mc.sign, deg: formatDeg(chart.angles.mc.degree), house: 10, retro: false, dignity: null })
    return list
  }, [chart])

  // Build dynamic HOUSES list from chart
  const HOUSES = useMemo(() => {
    if (!chart) return []
    return chart.houses.map(h => ({ num: h.house, sign: h.sign, deg: formatDeg(h.degree) }))
  }, [chart])

  // Build dynamic ASPECTS list from chart
  const ASPECTS = useMemo(() => {
    if (!chart) return []
    return (chart?.aspects ?? []).slice(0, 15).map(a => ({
      p1: a.planet1.charAt(0).toUpperCase() + a.planet1.slice(1).replace(/([A-Z])/g, ' $1'),
      p2: a.planet2.charAt(0).toUpperCase() + a.planet2.slice(1).replace(/([A-Z])/g, ' $1'),
      type: a.aspect.charAt(0).toUpperCase() + a.aspect.slice(1),
      symbol: ASPECT_SYMBOLS[a.aspect] || '\u25CB',
      orb: formatDeg(a.orb),
      color: ASPECT_COLORS_MAP[a.aspect] || '#aaaaaa',
    }))
  }, [chart])

  // Element/Modality balance from chart planets
  const { ELEMENTS, MODALITIES } = useMemo(() => {
    const elMap = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
    const modMap = { Cardinal: 0, Fixed: 0, Mutable: 0 }
    const signEl = { Aries:'Fire',Leo:'Fire',Sagittarius:'Fire', Taurus:'Earth',Virgo:'Earth',Capricorn:'Earth', Gemini:'Air',Libra:'Air',Aquarius:'Air', Cancer:'Water',Scorpio:'Water',Pisces:'Water' }
    const signMod = { Aries:'Cardinal',Cancer:'Cardinal',Libra:'Cardinal',Capricorn:'Cardinal', Taurus:'Fixed',Leo:'Fixed',Scorpio:'Fixed',Aquarius:'Fixed', Gemini:'Mutable',Virgo:'Mutable',Sagittarius:'Mutable',Pisces:'Mutable' }
    if (chart) {
      for (const p of Object.values(chart.planets)) {
        if (signEl[p.sign]) elMap[signEl[p.sign]]++
        if (signMod[p.sign]) modMap[signMod[p.sign]]++
      }
    }
    return { ELEMENTS: elMap, MODALITIES: modMap }
  }, [chart])

  const totalEl = Object.values(ELEMENTS).reduce((a, b) => a + b, 0)
  const totalMod = Object.values(MODALITIES).reduce((a, b) => a + b, 0)

  const RISING_SIGN = useMemo(() => {
    if (!chart) return null
    const asc = chart.angles.asc
    // Determine the ruler of the rising sign dynamically
    const SIGN_RULERS = {
      Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon', Leo: 'sun',
      Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars', Sagittarius: 'jupiter',
      Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
    }
    const rulerKey = SIGN_RULERS[asc.sign] || 'sun'
    const rulerPlanet = chart.planets[rulerKey]
    const rulerName = rulerKey.charAt(0).toUpperCase() + rulerKey.slice(1)
    return {
      sign: asc.sign,
      degree: formatDeg(asc.degree),
      ruler: rulerName,
      rulerSign: rulerPlanet?.sign || '',
      rulerHouse: rulerPlanet ? getHouseFor(rulerPlanet.lon, chart.houses) : null,
      qualities: [],
      appearance: '',
      firstImpression: '',
      lifeApproach: '',
    }
  }, [chart])

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u2609'} Natal Astrology</div>
          <AboutSystemButton systemName="Natal Astrology" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Full birth chart analysis — planets, houses, aspects, rising sign, and elemental balance
        </div>
      </div>

      {/* INTERACTIVE CHART */}
      <div>
        <div style={S.sectionTitle}>Birth Chart Wheel</div>
        <div style={{
          ...S.glass, padding: 0, overflow: 'hidden',
          height: 460, position: 'relative',
        }}>
          <NatalWheel showAspects={true} showHouses={true} />
        </div>
      </div>

      {/* RADIAL DATA ARCHITECTURE */}
      <div>
        <div style={S.sectionTitle}>Radial Data Architecture</div>
        <div style={{
          ...S.glass, padding: 0, overflow: 'hidden',
          height: 460, position: 'relative',
        }}>
          <NatalRadialBars />
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 6, opacity: 0.6 }}>
          Bar height encodes planetary weight. Color maps to element. Curved lines show aspects between planets.
        </div>
      </div>

      {/* SPLIT HEMISPHERE */}
      <div>
        <div style={S.sectionTitle}>Hemisphere View</div>
        <div style={{
          ...S.glass, padding: 0, overflow: 'hidden',
          height: 520, position: 'relative',
        }}>
          <NatalHemisphere />
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 6, opacity: 0.6 }}>
          Day-sect planets (Sun, Jupiter, Saturn) extend left. Night-sect (Moon, Venus, Mars) extend right. Linear zodiac spine from Aries to Pisces.
        </div>
      </div>

      {/* RISING SIGN / ASCENDANT */}
      {RISING_SIGN && <div>
        <div style={S.sectionTitle}>Rising Sign (Ascendant)</div>
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(96,176,48,.08)', border: '2px solid rgba(96,176,48,.3)',
              fontFamily: "'Cinzel', serif", fontSize: 28, color: '#60b030',
            }}>{'\u264D'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: 'var(--foreground)', letterSpacing: '.1em' }}>
                {RISING_SIGN.sign} Rising
              </div>
              <div style={{ ...S.monoSm, color: 'var(--muted-foreground)', marginTop: 2 }}>
                {RISING_SIGN.degree} {'\u00B7'} Ruler: {RISING_SIGN.ruler}{RISING_SIGN.rulerSign ? ` in ${RISING_SIGN.rulerSign}` : ''}{RISING_SIGN.rulerHouse ? ` (House ${RISING_SIGN.rulerHouse})` : ''}
              </div>
            </div>
          </div>
          {RISING_SIGN.qualities.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {RISING_SIGN.qualities.map((q, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 10,
                background: 'rgba(96,176,48,.08)', border: '1px solid rgba(96,176,48,.2)',
                color: '#60b030', fontFamily: "'Cinzel', serif", letterSpacing: '.06em',
              }}>{q}</span>
            ))}
          </div>}
        </div>
      </div>}

      {/* PLANETS TABLE — astro.com style */}
      <div>
        <div style={S.sectionTitle}>Planetary Placements</div>
        <div style={{
          borderRadius: 10,
          border: '1px solid rgba(201,168,76,.18)',
          overflow: 'hidden',
          background: 'var(--card)',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 28px 90px 90px 90px 52px 46px',
            gap: 0,
            padding: '6px 12px',
            background: 'rgba(201,168,76,.06)',
            borderBottom: '1px solid rgba(201,168,76,.18)',
          }}>
            {['', '', 'PLANET', 'DEGREE', 'SIGN', 'HSE', ''].map((h, i) => (
              <span key={i} style={{
                fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingLeft: i > 1 ? 4 : 0,
              }}>{h}</span>
            ))}
          </div>

          {/* Data rows */}
          {PLANETS.map((p, i) => {
            const elColor = SIGN_ELEMENTS[p.sign] ? ELEMENT_COLORS[SIGN_ELEMENTS[p.sign]] : 'var(--muted-foreground)'
            const planetColor = PLANET_COLORS_TABLE[p.key] || 'var(--foreground)'
            const isEven = i % 2 === 0
            const dignityColor = p.dignity === 'Exalt' ? '#2a8040'
              : p.dignity === 'Dom' ? '#2266aa'
              : p.dignity === 'Detr' ? '#aa3322'
              : p.dignity === 'Fall' ? '#996622' : null
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '36px 28px 90px 90px 90px 52px 46px',
                gap: 0,
                padding: '5px 12px',
                alignItems: 'center',
                background: isEven ? 'rgba(0,0,0,0)' : 'rgba(201,168,76,.025)',
                borderBottom: i < PLANETS.length - 1 ? '1px solid var(--secondary)' : 'none',
                transition: 'background .15s',
              }}>
                {/* Planet glyph (colored by planet) */}
                <span style={{
                  fontSize: 18, textAlign: 'center', lineHeight: 1,
                  color: planetColor, fontFamily: 'serif',
                }}>{p.sym}</span>
                {/* Retrograde marker */}
                <span style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 600, textAlign: 'center' }}>
                  {p.retro ? 'Rx' : ''}
                </span>
                {/* Planet name */}
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 11, color: planetColor,
                  letterSpacing: '.04em', paddingLeft: 4,
                }}>{p.name}</span>
                {/* Degree (monospace) */}
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 13, fontWeight: 600,
                  color: 'var(--foreground)', letterSpacing: '.02em', paddingLeft: 4,
                }}>{p.deg}</span>
                {/* Sign glyph + name (colored by element) */}
                <span style={{
                  fontFamily: 'serif', fontSize: 14, color: elColor, paddingLeft: 4,
                }}>
                  <span style={{ fontSize: 16, marginRight: 5 }}>
                    {['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'][
                      ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(p.sign)
                    ] || ''}
                  </span>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 10, color: elColor, letterSpacing: '.03em',
                  }}>{p.sign}</span>
                </span>
                {/* House number */}
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 11, color: 'var(--foreground)',
                  textAlign: 'center', paddingLeft: 4,
                }}>{p.key !== 'mc' ? p.house : '—'}</span>
                {/* Dignity badge */}
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.05em',
                  color: dignityColor || 'transparent',
                  fontWeight: 700,
                }}>{p.dignity || ''}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* HOUSES */}
      <div>
        <div style={S.sectionTitle}>House Cusps</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {HOUSES.map((h, i) => (
            <div key={i} style={{
              ...S.glass, padding: '10px 14px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--foreground)',
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--accent)',
                }}>{h.num}</span>
                <span style={{ ...S.mono, fontSize: 12, color: ELEMENT_COLORS[SIGN_ELEMENTS[h.sign]] || 'var(--muted-foreground)' }}>
                  {h.sign}
                </span>
              </div>
              <span style={{ ...S.monoSm, fontSize: 10, color: 'var(--muted-foreground)', textAlign: 'right' }}>{h.deg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ASPECTS TABLE */}
      <div>
        <div style={S.sectionTitle}>Major Aspects</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* header */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 24px 100px 110px 70px', gap: 8, padding: '4px 12px' }}>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>PLANET 1</span>
            <span></span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>PLANET 2</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>ASPECT</span>
            <span style={{ ...S.monoSm, fontSize: 9, color: 'var(--muted-foreground)' }}>ORB</span>
          </div>
          {ASPECTS.map((a, i) => (
            <div key={i} style={{
              ...S.row,
              display: 'grid', gridTemplateColumns: '100px 24px 100px 110px 70px', gap: 8,
            }}>
              <span style={{ ...S.mono, color: 'var(--foreground)' }}>{a.p1}</span>
              <span style={{ fontSize: 16, textAlign: 'center', color: a.color }}>{a.symbol}</span>
              <span style={{ ...S.mono, color: 'var(--foreground)' }}>{a.p2}</span>
              <span style={S.badge(
                a.type === 'Conjunction' ? 'rgba(240,192,64,.1)' :
                a.type === 'Trine' ? 'rgba(64,204,221,.1)' :
                a.type === 'Sextile' ? 'rgba(80,200,160,.1)' :
                a.type === 'Square' ? 'rgba(238,68,102,.1)' :
                a.type === 'Opposition' ? 'rgba(120,144,238,.1)' : 'rgba(255,255,255,.05)',
                a.type === 'Conjunction' ? 'rgba(240,192,64,.25)' :
                a.type === 'Trine' ? 'rgba(64,204,221,.25)' :
                a.type === 'Sextile' ? 'rgba(80,200,160,.25)' :
                a.type === 'Square' ? 'rgba(238,68,102,.25)' :
                a.type === 'Opposition' ? 'rgba(120,144,238,.25)' : 'rgba(255,255,255,.1)',
                a.color,
              )}>{a.type}</span>
              <span style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>{a.orb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ELEMENT / MODALITY BALANCE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Elements */}
        <div style={S.glass}>
          <div style={S.subHeading}>Element Balance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(ELEMENTS).map(([el, count]) => (
              <div key={el} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...S.mono, color: ELEMENT_COLORS[el], fontSize: 13 }}>{el}</span>
                  <span style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>{count} / {totalEl}</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(count / totalEl) * 100}%`,
                    background: ELEMENT_COLORS[el],
                    opacity: 0.7,
                    transition: 'width .6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modalities */}
        <div style={S.glass}>
          <div style={S.subHeading}>Modality Balance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(MODALITIES).map(([mod, count]) => (
              <div key={mod} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...S.mono, color: MODALITY_COLORS[mod], fontSize: 13 }}>{mod}</span>
                  <span style={{ ...S.monoSm, color: 'var(--muted-foreground)' }}>{count} / {totalMod}</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(count / totalMod) * 100}%`,
                    background: MODALITY_COLORS[mod],
                    opacity: 0.7,
                    transition: 'width .6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      {chart && <div>
        <div style={S.sectionTitle}>Chart Interpretation</div>
        <div style={S.interpretation}>
          <span style={{ color: 'var(--foreground)' }}>{chart.planets.sun?.sign} Sun</span>
          {RISING_SIGN && <> with a{' '}
          <span style={{ color: '#60b030' }}>{chart.planets.moon?.sign} Moon and {RISING_SIGN.sign} Rising</span></>}
          {' '}— a unique configuration of solar consciousness, emotional nature, and outward presentation.
          {ASPECTS.length > 0 && <> The {ASPECTS[0].p1}–{ASPECTS[0].p2} {ASPECTS[0].type.toLowerCase()} shapes
          your energy in significant ways.</>}
          {' '}The element balance ({Object.entries(ELEMENTS).map(([el, n]) => `${n} ${el}`).join(', ')}) reveals
          the dominant energies in the chart. Each planet, house, and aspect tells a chapter of your soul's
          story — encoded in the precise moment and place of your birth.
        </div>
      </div>}
    </div>
  )
}
