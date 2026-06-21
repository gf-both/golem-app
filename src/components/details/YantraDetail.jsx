import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  YANTRAS, PLANET_DATA, getCurrentHora, getTithi,
  getAuspiciousnessScore, findNextWindow, getCountdown, getHoras,
} from '../../engines/yantraEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.18em',
    color: 'var(--foreground)',
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
  glass: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 13, padding: 18, backdropFilter: 'blur(12px)',
  },
}

/* ─── SVG Yantra Generator ────────────────────────────────────────────────── */
function YantraSVG({ yantra, size = 300, animate = false, creating = false }) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.42
  const pulse = animate ? 'yantra-pulse' : ''

  // Generate concentric rings
  const rings = []
  for (let i = 0; i < yantra.rings; i++) {
    const ringR = r * (0.3 + (i / yantra.rings) * 0.7)
    rings.push(
      <circle key={`r${i}`} cx={cx} cy={cy} r={ringR}
        fill="none" stroke="rgba(201,168,76,.12)" strokeWidth="0.5"
        style={animate ? { animation: `yantra-ring ${3 + i * 0.5}s ease-in-out infinite alternate` } : {}}
      />
    )
  }

  // Generate triangles (pointing up and down alternating)
  const triangles = []
  const triCount = Math.min(yantra.triangles, 12) // visual cap
  for (let i = 0; i < triCount; i++) {
    const triR = r * (0.25 + (i / triCount) * 0.55)
    const angle = (i * 137.5 * Math.PI) / 180 // golden angle
    const up = i % 2 === 0
    const points = up
      ? [
          [cx + triR * Math.sin(angle), cy - triR * Math.cos(angle)],
          [cx + triR * Math.sin(angle + 2.094), cy - triR * Math.cos(angle + 2.094)],
          [cx + triR * Math.sin(angle + 4.189), cy - triR * Math.cos(angle + 4.189)],
        ]
      : [
          [cx + triR * Math.sin(angle + Math.PI), cy - triR * Math.cos(angle + Math.PI)],
          [cx + triR * Math.sin(angle + Math.PI + 2.094), cy - triR * Math.cos(angle + Math.PI + 2.094)],
          [cx + triR * Math.sin(angle + Math.PI + 4.189), cy - triR * Math.cos(angle + Math.PI + 4.189)],
        ]
    const color = up ? 'rgba(201,168,76,' : 'rgba(160,120,200,'
    triangles.push(
      <polygon key={`t${i}`}
        points={points.map(p => p.join(',')).join(' ')}
        fill="none" stroke={color + (creating ? '.5)' : '.18)')}
        strokeWidth={creating ? 1.2 : 0.7}
        style={animate ? {
          animation: `yantra-tri ${2 + i * 0.3}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.15}s`,
        } : {}}
      />
    )
  }

  // Bindu (center point)
  const binduColor = PLANET_DATA[yantra.planet]?.color || '#c9a84c'

  // Lotus petals (outer)
  const petals = []
  const petalCount = yantra.id === 'sri' ? 16 : 8
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2 - Math.PI / 2
    const pr = r * 0.88
    const pw = r * 0.12
    const px = cx + pr * Math.cos(a)
    const py = cy + pr * Math.sin(a)
    petals.push(
      <ellipse key={`p${i}`}
        cx={px} cy={py}
        rx={pw} ry={pw * 0.4}
        fill="none" stroke="rgba(201,168,76,.1)"
        strokeWidth="0.5"
        transform={`rotate(${(a * 180 / Math.PI) + 90}, ${px}, ${py})`}
      />
    )
  }

  // Bhupura (outer square gate)
  const sq = r * 0.95
  const gateSize = sq * 0.15

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
      <style>{`
        @keyframes yantra-pulse { 0% { opacity: .6 } 100% { opacity: 1 } }
        @keyframes yantra-ring { 0% { stroke-opacity: .08 } 100% { stroke-opacity: .25 } }
        @keyframes yantra-tri { 0% { stroke-opacity: .15 } 100% { stroke-opacity: .45 } }
        @keyframes yantra-create { 0% { stroke-dashoffset: 1000 } 100% { stroke-dashoffset: 0 } }
        @keyframes bindu-glow { 0% { r: 3 } 50% { r: 6 } 100% { r: 3 } }
      `}</style>

      {/* Bhupura — outer square */}
      <rect x={cx - sq} y={cy - sq} width={sq * 2} height={sq * 2}
        fill="none" stroke="rgba(201,168,76,.15)" strokeWidth="1"
        rx="2"
      />
      {/* Gate openings */}
      {[0, 1, 2, 3].map(i => {
        const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
        const a = angles[i]
        const gx = cx + sq * Math.cos(a)
        const gy = cy + sq * Math.sin(a)
        return (
          <line key={`g${i}`} x1={gx - gateSize * Math.sin(a)} y1={gy + gateSize * Math.cos(a)}
            x2={gx + gateSize * Math.sin(a)} y2={gy - gateSize * Math.cos(a)}
            stroke="rgba(201,168,76,.2)" strokeWidth="0.5" />
        )
      })}

      {/* Concentric rings */}
      {rings}

      {/* Lotus petals */}
      {petals}

      {/* Triangles */}
      {triangles}

      {/* Bindu — center */}
      <circle cx={cx} cy={cy} r={creating ? 5 : 3}
        fill={binduColor} opacity={creating ? .9 : .6}
        style={creating ? { animation: 'bindu-glow 2s ease-in-out infinite' } : {}}
      />

      {/* Outer glow when creating */}
      {creating && (
        <circle cx={cx} cy={cy} r={r * 0.95}
          fill="none" stroke={binduColor} strokeWidth="1.5"
          opacity=".2"
          strokeDasharray="4 4"
          style={{ animation: 'yantra-ring 2s linear infinite' }}
        />
      )}

      {/* Sanskrit label */}
      <text x={cx} y={size - 8} textAnchor="middle"
        fontFamily="serif" fontSize="11" fill="rgba(201,168,76,.4)"
      >{yantra.sanskrit}</text>
    </svg>
  )
}

/* ─── Auspiciousness Meter ────────────────────────────────────────────────── */
function AuspiciousnessMeter({ score }) {
  const color = score >= 75 ? '#60b030' : score >= 50 ? '#c9a84c' : score >= 30 ? '#e0a040' : '#e05040'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${color}44, ${color})`,
          transition: 'width .8s ease',
        }} />
      </div>
      <span style={{
        fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600, color,
        minWidth: 36, textAlign: 'right',
      }}>{score}</span>
    </div>
  )
}

/* ─── Hora Timeline ───────────────────────────────────────────────────────── */
function HoraTimeline({ horas, currentPlanet }) {
  const now = new Date()
  return (
    <div style={{ display: 'flex', gap: 1, height: 32, borderRadius: 6, overflow: 'hidden' }}>
      {horas.slice(0, 24).map((h, i) => {
        const isCurrent = h.planet === currentPlanet && now >= h.startTime && now < h.endTime
        const pd = PLANET_DATA[h.planet] || {}
        const timeStr = h.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return (
          <div key={i} title={`${h.planet} · ${timeStr}`} style={{
            flex: 1,
            background: isCurrent ? pd.color + '40' : pd.color + '08',
            borderBottom: isCurrent ? `2px solid ${pd.color}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: pd.color + (isCurrent ? 'ff' : '66'),
            cursor: 'default', transition: 'all .2s',
          }}>
            {pd.symbol}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function YantraDetail() {
  const [selectedYantra, setSelectedYantra] = useState(YANTRAS[0])
  const [now, setNow] = useState(new Date())
  const [creating, setCreating] = useState(false)
  const [showWindows, setShowWindows] = useState(false)
  const timerRef = useRef(null)

  // Update time every 30 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Vedic timing
  const hora = useMemo(() => getCurrentHora(now), [now])
  const tithi = useMemo(() => getTithi(now), [now])
  const assessment = useMemo(() => getAuspiciousnessScore(now, selectedYantra), [now, selectedYantra])
  const nextWindows = useMemo(() => findNextWindow(selectedYantra), [selectedYantra, now])
  const nextBest = nextWindows[0] || null
  const countdown = nextBest ? getCountdown(nextBest.start) : null

  const canCreate = assessment.score >= 50

  const handleCreate = useCallback(() => {
    if (!canCreate) return
    setCreating(true)
    // Simulate creation process (in real app, this would generate the yantra)
    setTimeout(() => setCreating(false), 8000)
  }, [canCreate])

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u25C7'} Yantra — Sacred Geometry</div>
          <AboutSystemButton systemName="Yantra" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Vedic-timed creation · Hora · Tithi · Planetary alignment
        </div>
      </div>

      {/* CURRENT VEDIC TIME */}
      <div>
        <div style={S.sectionTitle}>Current Vedic Time</div>
        <div style={{ ...S.glass, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Current Hora */}
          <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Current Hora
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 28, color: PLANET_DATA[hora.planet]?.color || '#c9a84c',
              }}>{PLANET_DATA[hora.planet]?.symbol}</span>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: PLANET_DATA[hora.planet]?.color }}>
                  {hora.planet}
                </div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, opacity: .5 }}>
                  {hora.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {hora.endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Day Ruler */}
          <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Day Ruler
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, color: PLANET_DATA[hora.dayRuler]?.color || '#c9a84c' }}>
                {PLANET_DATA[hora.dayRuler]?.symbol}
              </span>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: PLANET_DATA[hora.dayRuler]?.color }}>
                  {assessment.dayName}
                </div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, opacity: .5 }}>
                  Ruled by {hora.dayRuler}
                </div>
              </div>
            </div>
          </div>

          {/* Tithi */}
          <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 7, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Tithi (Lunar Day)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, opacity: .7 }}>
                {tithi.isWaxing ? '\u263D' : '\u263E'}
              </span>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: tithi.quality === 'excellent' ? '#60b030' : tithi.quality === 'avoid' ? '#e05040' : '#c9a84c' }}>
                  {tithi.name}
                </div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, opacity: .5 }}>
                  {tithi.pakshaLabel} · {tithi.quality}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HORA TIMELINE */}
      <div>
        <div style={S.sectionTitle}>Today's Hora Sequence</div>
        <HoraTimeline horas={hora.allHoras || []} currentPlanet={hora.planet} />
      </div>

      {/* YANTRA SELECTOR */}
      <div>
        <div style={S.sectionTitle}>Select Yantra</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {YANTRAS.map(y => {
            const active = selectedYantra.id === y.id
            const pd = PLANET_DATA[y.planet] || {}
            return (
              <button key={y.id} onClick={() => setSelectedYantra(y)} style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '.08em',
                background: active ? pd.color + '18' : 'var(--card)',
                color: active ? pd.color : 'var(--muted-foreground)',
                border: active ? `1px solid ${pd.color}40` : '1px solid var(--border)',
                transition: 'all .2s',
              }}>
                {pd.symbol} {y.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* SELECTED YANTRA + AUSPICIOUSNESS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Yantra Preview */}
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <YantraSVG yantra={selectedYantra} size={260} animate={creating} creating={creating} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: PLANET_DATA[selectedYantra.planet]?.color }}>
              {selectedYantra.name}
            </div>
            <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, opacity: .5, marginTop: 2 }}>
              {selectedYantra.deity} · {selectedYantra.purpose}
            </div>
          </div>
        </div>

        {/* Auspiciousness Assessment */}
        <div style={{ ...S.glass, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Auspiciousness for {selectedYantra.name}
          </div>

          <AuspiciousnessMeter score={assessment.score} />

          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 12,
            color: assessment.score >= 75 ? '#60b030' : assessment.score >= 50 ? '#c9a84c' : '#e05040',
            textAlign: 'center', padding: '6px 12px', borderRadius: 8,
            background: assessment.score >= 75 ? 'rgba(96,176,48,.06)' : assessment.score >= 50 ? 'rgba(201,168,76,.06)' : 'rgba(224,80,64,.06)',
          }}>
            {assessment.recommendation}
          </div>

          {/* Factors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {assessment.factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ color: f.positive ? '#60b030' : '#e05040', fontSize: 10, width: 12 }}>
                  {f.positive ? '+' : '−'}
                </span>
                <span style={{ color: 'var(--muted-foreground)', flex: 1 }}>{f.label}</span>
                <span style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: f.positive ? '#60b030' : '#e05040' }}>
                  {f.value > 0 ? '+' : ''}{f.value}
                </span>
              </div>
            ))}
          </div>

          {/* Best day info */}
          <div style={{
            fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic',
            padding: '8px 12px', borderRadius: 6, background: 'var(--accent)',
            borderLeft: `2px solid ${PLANET_DATA[selectedYantra.planet]?.color || '#c9a84c'}22`,
          }}>
            Best: {selectedYantra.bestDay}s during {selectedYantra.planet} Hora,
            Shukla Paksha, Tithi {selectedYantra.bestTithis.join('/')}.
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            style={{
              padding: '12px 20px', borderRadius: 10, border: 'none', cursor: canCreate && !creating ? 'pointer' : 'default',
              fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase',
              background: canCreate
                ? creating
                  ? 'rgba(201,168,76,.1)'
                  : 'linear-gradient(135deg, rgba(201,168,76,.15), rgba(201,168,76,.08))'
                : 'rgba(255,255,255,.02)',
              color: canCreate ? '#c9a84c' : 'var(--muted-foreground)',
              border: canCreate ? '1px solid rgba(201,168,76,.3)' : '1px solid rgba(255,255,255,.05)',
              transition: 'all .3s',
            }}
          >
            {creating ? 'Energizing Yantra...' : canCreate ? 'Create Yantra' : 'Wait for Auspicious Window'}
          </button>
        </div>
      </div>

      {/* NEXT WINDOWS */}
      <div>
        <div style={S.sectionTitle}>
          Next Auspicious Windows
          {nextBest && countdown && !countdown.expired && (
            <span style={{ float: 'right', fontFamily: "'Inconsolata',monospace", fontSize: 10, color: '#60b030' }}>
              Next best: {countdown.label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {nextWindows.slice(0, showWindows ? 10 : 4).map((w, i) => {
            const cd = getCountdown(w.start)
            const pd = PLANET_DATA[w.planet] || {}
            return (
              <div key={i} style={{
                ...S.glass, padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderColor: i === 0 ? '#60b03022' : undefined,
                background: i === 0 ? 'rgba(96,176,48,.02)' : undefined,
              }}>
                <span style={{ fontSize: 18, color: pd.color }}>{pd.symbol}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: pd.color }}>
                    {w.dayName} · {w.planet} Hora
                  </div>
                  <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, opacity: .5 }}>
                    {w.start.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                    {w.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {w.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · Tithi '}{w.tithi.tithiInPaksha}{' '}{w.tithi.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600,
                    color: w.score >= 75 ? '#60b030' : w.score >= 50 ? '#c9a84c' : '#e0a040',
                  }}>{w.score}</div>
                  <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 9, color: 'var(--muted-foreground)' }}>
                    {cd.expired ? 'Now' : cd.label}
                  </div>
                </div>
              </div>
            )
          })}
          {nextWindows.length > 4 && (
            <button onClick={() => setShowWindows(!showWindows)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--muted-foreground)',
              padding: 8, textAlign: 'center',
            }}>
              {showWindows ? 'Show fewer' : `Show all ${nextWindows.length} windows`}
            </button>
          )}
        </div>
      </div>

      {/* YANTRA DESCRIPTIONS */}
      <div>
        <div style={S.sectionTitle}>About {selectedYantra.name}</div>
        <div style={{
          fontSize: 14, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic',
          padding: '14px 18px', borderRadius: 10,
          background: 'var(--accent)', border: '1px solid var(--border)',
        }}>
          <span style={{ color: PLANET_DATA[selectedYantra.planet]?.color, fontWeight: 600 }}>
            {selectedYantra.sanskrit}
          </span>{' — '}
          {selectedYantra.description}
          <div style={{ marginTop: 10, fontSize: 12, opacity: .7 }}>
            Complexity: {'★'.repeat(selectedYantra.complexity)}{'☆'.repeat(5 - selectedYantra.complexity)}
            {' · '}{selectedYantra.rings} rings · {selectedYantra.triangles} triangles
            {' · '}{selectedYantra.planet} ruled
          </div>
        </div>
      </div>

      {/* YANTRA LIBRARY GRID */}
      <div>
        <div style={S.sectionTitle}>Yantra Library</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {YANTRAS.map(y => {
            const pd = PLANET_DATA[y.planet] || {}
            const isSelected = selectedYantra.id === y.id
            return (
              <div key={y.id} onClick={() => setSelectedYantra(y)} style={{
                ...S.glass, padding: '12px 8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all .2s',
                borderColor: isSelected ? pd.color + '33' : undefined,
                background: isSelected ? pd.color + '06' : undefined,
              }}>
                <YantraSVG yantra={y} size={100} />
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color: pd.color, marginTop: 4, letterSpacing: '.08em' }}>
                  {y.name}
                </div>
                <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 8, opacity: .4, marginTop: 2 }}>
                  {y.deity}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DISCLAIMER */}
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', opacity: .4, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
        Timing calculations use simplified astronomical positions. For precise muhurta,
        consult a Vedic astrologer or panchang.
      </div>
    </div>
  )
}
