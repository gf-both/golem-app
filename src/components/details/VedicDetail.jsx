import { useMemo } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { getVedicChart, VEDIC_SIGNS, VEDIC_SIGN_MEANINGS, NAKSHATRAS, DASHA_LORDS, DASHA_YEARS } from '../../engines/vedicEngine'
import { resolvePob } from '../../utils/profileUtils'
import AboutSystemButton from '../ui/AboutSystemButton'

const PLANET_LABELS = {
  sun: 'Sun (Surya)', moon: 'Moon (Chandra)', mercury: 'Mercury (Budha)',
  venus: 'Venus (Shukra)', mars: 'Mars (Mangala)', jupiter: 'Jupiter (Guru)',
  saturn: 'Saturn (Shani)', rahu: 'Rahu', ketu: 'Ketu',
}

const PLANET_COLORS = {
  sun: '#c9a84c', moon: '#c9a84c',
  mercury: '#4caa7c', venus: '#4caa7c', jupiter: '#4caa7c',
  mars: '#cc4444', saturn: '#cc4444',
  rahu: '#9966cc', ketu: '#9966cc',
}

const PLANET_TYPE = {
  sun: 'Luminary', moon: 'Luminary',
  mercury: 'Benefic', venus: 'Benefic', jupiter: 'Benefic',
  mars: 'Malefic', saturn: 'Malefic',
  rahu: 'Shadow', ketu: 'Shadow',
}

function computeChart(profile) {
  if (!profile?.dob) return null
  try {
    const [y, m, d] = profile.dob.split('-').map(Number)
    const [h, min] = (profile.tob || '12:00').split(':').map(Number)
    const { lat, lon, tz } = resolvePob(profile)
    return getVedicChart({ day: d, month: m, year: y, hour: h, minute: min, lat, lon, timezone: tz })
  } catch { return null }
}

function formatDeg(deg) {
  const d = Math.floor(deg)
  const m = Math.round((deg - d) * 60)
  return `${d}\u00B0${String(m).padStart(2, '0')}\u2032`
}

const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
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
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 12,
    fontFamily: "'Inconsolata', monospace",
  },
  th: {
    fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 600, letterSpacing: '.15em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)',
    padding: '6px 8px', borderBottom: '1px solid var(--border)', textAlign: 'left',
  },
  td: {
    padding: '6px 8px', borderBottom: '1px solid var(--secondary)', color: 'var(--foreground)',
    fontSize: 12,
  },
  goldText: { color: '#c9a84c' },
  dimText: { color: 'var(--muted-foreground)', fontSize: 12 },
}

export default function VedicDetail() {
  const profile = useGolemStore(s => s.activeViewProfile || s.primaryProfile)
  const chart = useMemo(() => computeChart(profile),
    [profile?.dob, profile?.tob, profile?.birthLat, profile?.birthLon, profile?.birthTimezone, profile?.pob])

  if (!chart) {
    return (
      <div style={{ ...S.panel, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...S.heading, opacity: 0.4, fontSize: 13 }}>AWAITING BIRTH DATA</div>
      </div>
    )
  }

  const { lagna, planets, moonNakshatra, dasha, ayanamsa } = chart
  const planetKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
  const now = new Date()

  // Find current dasha period
  const currentDasha = dasha.sequence.find(d => {
    const start = new Date(d.start)
    const end = new Date(d.end)
    return now >= start && now <= end
  }) || dasha.sequence[0]

  return (
    <div style={S.panel}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>JYOTISH KUNDALI</div>
          <AboutSystemButton systemName="Vedic Astrology" />
        </div>
        <div style={S.dimText}>Vedic Birth Chart Analysis</div>
      </div>

      {/* Lagna (Ascendant) */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>LAGNA (ASCENDANT)</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          <div>
            <div style={{ ...S.mono, fontSize: 16, ...S.goldText }}>{lagna.sign}</div>
            <div style={S.monoSm}>{VEDIC_SIGN_MEANINGS[lagna.sign]}</div>
          </div>
          <div>
            <div style={S.monoSm}>Degree</div>
            <div style={S.mono}>{formatDeg(lagna.degree)}</div>
          </div>
          <div>
            <div style={S.monoSm}>Sidereal Lon</div>
            <div style={S.mono}>{lagna.siderealLon}\u00B0</div>
          </div>
          {lagna.nakshatra && (
            <div>
              <div style={S.monoSm}>Nakshatra</div>
              <div style={S.mono}>{lagna.nakshatra.name} (Pada {lagna.nakshatra.pada})</div>
            </div>
          )}
        </div>
      </div>

      {/* Moon Nakshatra */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>MOON NAKSHATRA (JANMA NAKSHATRA)</div>
        {moonNakshatra && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ ...S.mono, fontSize: 16, ...S.goldText }}>{moonNakshatra.name}</div>
              <span style={S.badge('rgba(201,168,76,0.1)', 'rgba(201,168,76,0.3)', '#c9a84c')}>
                Pada {moonNakshatra.pada}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={S.keyVal}>
                <span style={S.monoSm}>Lord</span>
                <span style={S.mono}>{moonNakshatra.lord}</span>
              </div>
              <div style={S.keyVal}>
                <span style={S.monoSm}>Deity</span>
                <span style={S.mono}>{moonNakshatra.deity}</span>
              </div>
              <div style={S.keyVal}>
                <span style={S.monoSm}>Symbol</span>
                <span style={S.mono}>{moonNakshatra.symbol}</span>
              </div>
              <div style={S.keyVal}>
                <span style={S.monoSm}>Longitude</span>
                <span style={S.mono}>{moonNakshatra.longitude != null ? moonNakshatra.longitude.toFixed(2) + '\u00B0' : '--'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Planetary Positions Table */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>GRAHA POSITIONS (NINE PLANETS)</div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Planet</th>
                <th style={S.th}>Rashi</th>
                <th style={S.th}>Degree</th>
                <th style={S.th}>Nakshatra</th>
                <th style={S.th}>Pada</th>
                <th style={S.th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {planetKeys.map(key => {
                const p = planets[key]
                if (!p) return null
                const col = PLANET_COLORS[key] || '#c9a84c'
                return (
                  <tr key={key}>
                    <td style={{ ...S.td, color: col, fontWeight: 600, fontFamily: "'Cinzel', serif", fontSize: 11 }}>
                      {PLANET_LABELS[key]}
                    </td>
                    <td style={S.td}>{p.sign}</td>
                    <td style={S.td}>{formatDeg(p.degree)}</td>
                    <td style={S.td}>{p.nakshatra?.name || '--'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{p.nakshatra?.pada || '--'}</td>
                    <td style={S.td}>
                      <span style={S.badge(
                        PLANET_TYPE[key] === 'Benefic' ? 'rgba(76,170,124,0.1)' :
                        PLANET_TYPE[key] === 'Malefic' ? 'rgba(204,68,68,0.1)' :
                        PLANET_TYPE[key] === 'Shadow' ? 'rgba(153,102,204,0.1)' :
                        'rgba(201,168,76,0.1)',
                        PLANET_TYPE[key] === 'Benefic' ? 'rgba(76,170,124,0.3)' :
                        PLANET_TYPE[key] === 'Malefic' ? 'rgba(204,68,68,0.3)' :
                        PLANET_TYPE[key] === 'Shadow' ? 'rgba(153,102,204,0.3)' :
                        'rgba(201,168,76,0.3)',
                        col
                      )}>
                        {PLANET_TYPE[key]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rashi Descriptions for Key Placements */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>KEY RASHI PLACEMENTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {['sun', 'moon', 'mars', 'jupiter', 'saturn'].map(key => {
            const p = planets[key]
            if (!p) return null
            const meaning = VEDIC_SIGN_MEANINGS[p.sign]
            return (
              <div key={key} style={S.interpretation}>
                <span style={{ ...S.goldText, fontStyle: 'normal', fontWeight: 600 }}>
                  {PLANET_LABELS[key]}
                </span>{' '}
                in{' '}
                <span style={{ fontWeight: 600, fontStyle: 'normal' }}>{p.sign}</span>
                {meaning && <span> — {meaning}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Vimshottari Dasha */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>VIMSHOTTARI DASHA</div>
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={S.monoSm}>Current Maha Dasha:</span>
            <span style={{ ...S.mono, fontSize: 15, ...S.goldText }}>{currentDasha.lord}</span>
            <span style={S.badge('rgba(201,168,76,0.1)', 'rgba(201,168,76,0.3)', '#c9a84c')}>
              {DASHA_YEARS[currentDasha.lord]} years
            </span>
          </div>
          <div style={{ ...S.monoSm, marginTop: 4 }}>
            {currentDasha.start} to {currentDasha.end}
          </div>
        </div>
        <div style={S.subHeading}>Full Dasha Sequence</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {dasha.sequence.map((d, i) => {
            const isCurrent = d.lord === currentDasha.lord && d.start === currentDasha.start
            return (
              <div key={i} style={{
                ...S.row,
                background: isCurrent ? 'rgba(201,168,76,0.08)' : 'var(--secondary)',
                border: isCurrent ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
              }}>
                <span style={{
                  ...S.mono, minWidth: 70, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#c9a84c' : 'var(--foreground)',
                }}>
                  {d.lord}
                </span>
                <span style={S.monoSm}>{d.years}y</span>
                <span style={{ ...S.monoSm, flex: 1, textAlign: 'right' }}>
                  {d.start} \u2192 {d.end}
                </span>
                {isCurrent && (
                  <span style={S.badge('rgba(201,168,76,0.15)', 'rgba(201,168,76,0.4)', '#c9a84c')}>
                    ACTIVE
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Ayanamsa */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>AYANAMSA</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
          <div>
            <div style={S.monoSm}>System</div>
            <div style={S.mono}>Lahiri (Chitrapaksha)</div>
          </div>
          <div>
            <div style={S.monoSm}>Value</div>
            <div style={{ ...S.mono, ...S.goldText, fontSize: 15 }}>{ayanamsa}\u00B0</div>
          </div>
        </div>
        <div style={{ ...S.dimText, marginTop: 8 }}>
          The ayanamsa is the angular difference between the tropical and sidereal zodiacs,
          accounting for the precession of equinoxes. All planetary positions above are sidereal (Jyotish).
        </div>
      </div>

      {/* 27 Nakshatras Reference */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>27 NAKSHATRAS REFERENCE</div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 24 }}>#</th>
                <th style={S.th}>Nakshatra</th>
                <th style={S.th}>Lord</th>
                <th style={S.th}>Deity</th>
                <th style={S.th}>Symbol</th>
                <th style={S.th}>Span</th>
              </tr>
            </thead>
            <tbody>
              {NAKSHATRAS.map((nak, i) => {
                const spanStart = (i * (360 / 27)).toFixed(1)
                const spanEnd = ((i + 1) * (360 / 27)).toFixed(1)
                const isActive = moonNakshatra && moonNakshatra.name === nak.name
                return (
                  <tr key={i} style={isActive ? { background: 'rgba(201,168,76,0.06)' } : undefined}>
                    <td style={{ ...S.td, textAlign: 'center', color: 'var(--muted-foreground)' }}>{i + 1}</td>
                    <td style={{
                      ...S.td,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#c9a84c' : 'var(--foreground)',
                    }}>
                      {nak.name}{isActive ? ' \u2605' : ''}
                    </td>
                    <td style={S.td}>{nak.lord}</td>
                    <td style={S.td}>{nak.deity}</td>
                    <td style={{ ...S.td, fontSize: 11 }}>{nak.symbol}</td>
                    <td style={{ ...S.td, color: 'var(--muted-foreground)', fontSize: 10 }}>
                      {spanStart}\u00B0\u2013{spanEnd}\u00B0
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rashi Reference */}
      <div style={S.glass}>
        <div style={S.sectionTitle}>12 RASHIS (SIGNS)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {VEDIC_SIGNS.map((sign, i) => (
            <div key={sign} style={{
              ...S.row,
              flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              background: sign === lagna.sign ? 'rgba(201,168,76,0.08)' : 'var(--secondary)',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--muted-foreground)' }}>{i + 1}.</span>
                <span style={{
                  ...S.mono, fontWeight: 600,
                  color: sign === lagna.sign ? '#c9a84c' : 'var(--foreground)',
                }}>
                  {sign}
                </span>
                {sign === lagna.sign && <span style={{ fontSize: 9, color: '#c9a84c' }}>ASC</span>}
              </div>
              <div style={{ ...S.monoSm, fontSize: 10 }}>{VEDIC_SIGN_MEANINGS[sign]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ ...S.dimText, textAlign: 'center', fontSize: 10, opacity: 0.5, paddingBottom: 16 }}>
        Calculated using Lahiri Ayanamsa \u00B7 Whole-sign house system
      </div>
    </div>
  )
}
