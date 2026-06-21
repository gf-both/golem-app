import { useState, useMemo, useRef, useEffect } from 'react'
import { useComputedProfile } from '../../hooks/useActiveProfile'
import { getRecommendedRituals, TRADITIONS, getRitualById } from '../../engines/ritualEngine'
import { getMoonPhase } from '../../engines/cycleEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

const ELEMENTS = { fire: '🔥', water: '💧', air: '🌬', earth: '🌍', spirit: '✦' }
const DIFFICULTY = { beginner: { label: 'Beginner', color: '#60b030' }, intermediate: { label: 'Intermediate', color: '#e8a040' }, advanced: { label: 'Advanced', color: '#d44070' } }
const TAU = Math.PI * 2

// ─── Step-aware ritual visualization ───
// Uses Canvas 2D paths, lines, curves, and gradients — NOT particle blobs.
// Each shape is rendered as clean geometry with glow, animated smoothly.

function detectShape(text) {
  if (!text) return 'sphere'
  const t = text.toLowerCase()
  if (t.includes('fire') || t.includes('flame') || t.includes('candle') || t.includes('burn') || t.includes('ignite') || t.includes('copal')) return 'flame'
  if (t.includes('breath') || t.includes('inhale') || t.includes('exhale') || t.includes('pranayama')) return 'breath'
  if (t.includes('heart') || t.includes('love') || t.includes('compassion') || t.includes('kindness')) return 'heart'
  if (t.includes('eye') || t.includes('gaze') || t.includes('see') || t.includes('vision') || t.includes('third eye') || t.includes('perceive')) return 'eye'
  if (t.includes('water') || t.includes('ocean') || t.includes('river') || t.includes('wave') || t.includes('flow') || t.includes('lake') || t.includes('offering')) return 'water'
  if (t.includes('earth') || t.includes('ground') || t.includes('mountain') || t.includes('root') || t.includes('floor') || t.includes('sit') || t.includes('descen')) return 'mountain'
  if (t.includes('spin') || t.includes('turn') || t.includes('whirl') || t.includes('orbit') || t.includes('spiral') || t.includes('circl') || t.includes('direction')) return 'spiral'
  if (t.includes('tree') || t.includes('spine') || t.includes('channel') || t.includes('pillar') || t.includes('vertical') || t.includes('central') || t.includes('crown')) return 'tree'
  if (t.includes('star') || t.includes('heaven') || t.includes('sky') || t.includes('divine') || t.includes('light') || t.includes('white')) return 'star'
  if (t.includes('hand') || t.includes('palm') || t.includes('touch') || t.includes('finger') || t.includes('lips') || t.includes('mouth')) return 'hands'
  if (t.includes('silence') || t.includes('still') || t.includes('quiet') || t.includes('listen') || t.includes('rest') || t.includes('awareness')) return 'stillness'
  if (t.includes('sun') || t.includes('sunrise') || t.includes('dawn') || t.includes('east')) return 'sun'
  if (t.includes('moon') || t.includes('lunar') || t.includes('night')) return 'moon'
  if (t.includes('speak') || t.includes('chant') || t.includes('mantra') || t.includes('vibrat') || t.includes('voice') || t.includes('repeat') || t.includes('say')) return 'sound'
  return 'sphere'
}

// ─── Draw functions: clean line/path geometry with glow ───

const SHAPE_COLORS = {
  flame:     { primary: '#ff9030', secondary: '#ff5010', glow: 'rgba(255,140,40,' },
  breath:    { primary: '#80c8ff', secondary: '#a0d8ff', glow: 'rgba(140,200,255,' },
  heart:     { primary: '#e04080', secondary: '#ff6090', glow: 'rgba(230,80,140,' },
  eye:       { primary: '#90a8e0', secondary: '#b0c0ff', glow: 'rgba(160,180,240,' },
  water:     { primary: '#40a0e8', secondary: '#70c0ff', glow: 'rgba(80,170,240,' },
  mountain:  { primary: '#70b050', secondary: '#90c870', glow: 'rgba(110,180,80,' },
  spiral:    { primary: '#c9a84c', secondary: '#e0c070', glow: 'rgba(200,170,80,' },
  tree:      { primary: '#60a848', secondary: '#a0c080', glow: 'rgba(100,170,70,' },
  star:      { primary: '#e0c050', secondary: '#f0d878', glow: 'rgba(230,200,90,' },
  hands:     { primary: '#d0a860', secondary: '#e0c080', glow: 'rgba(210,170,100,' },
  stillness: { primary: '#a0a8b8', secondary: '#c0c8d8', glow: 'rgba(180,185,200,' },
  sun:       { primary: '#f0b030', secondary: '#ffd060', glow: 'rgba(240,180,50,' },
  moon:      { primary: '#b0b8d8', secondary: '#d0d8f0', glow: 'rgba(180,190,220,' },
  sound:     { primary: '#c0a0e0', secondary: '#d8c0f0', glow: 'rgba(190,160,225,' },
  sphere:    { primary: '#c9a84c', secondary: '#e0c070', glow: 'rgba(200,170,80,' },
}

// ─── Particle agglomeration system — organic clusters, no blobs, no straight lines ───
// Each shape uses 40-80 particles that cluster into recognizable forms with organic drift

function seededRandom(seed) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

function generateShapeParticles(shape, count) {
  const rng = seededRandom(shape.length * 7 + 42)
  const particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      phase: rng() * TAU,
      speed: 0.3 + rng() * 0.7,
      drift: (rng() - 0.5) * 0.15,
      size: 1.2 + rng() * 2.5,
      brightness: 0.4 + rng() * 0.6,
      offset: rng() * TAU,
      layer: Math.floor(rng() * 3),
    })
  }
  return particles
}

// Cache particles per shape
const shapeParticleCache = {}
function getShapeParticles(shape, count) {
  if (!shapeParticleCache[shape]) shapeParticleCache[shape] = generateShapeParticles(shape, count)
  return shapeParticleCache[shape]
}

// Get target position for a particle within a shape
function getShapeTarget(shape, i, count, t, scale) {
  const frac = i / count
  switch (shape) {
    case 'flame': {
      // Particles rise and sway like fire
      const rise = frac
      const sway = Math.sin(t * 3 + i * 0.7) * 0.15 * (1 - rise * 0.5)
      const width = 0.3 * (1 - rise * 0.7) * (1 + Math.sin(t * 4 + i) * 0.1)
      const x = sway + (Math.sin(i * 2.3 + t * 2) * width)
      const y = 0.5 - rise * 0.9 + Math.sin(t * 5 + i * 0.3) * 0.02
      return { x: x * scale, y: y * scale, size: (1 - rise * 0.6) }
    }
    case 'breath': {
      // Particles expand and contract in concentric breathing
      const breathPhase = Math.sin(t * 0.8)
      const ring = Math.floor(frac * 5)
      const posInRing = (frac * 5) % 1
      const angle = posInRing * TAU + ring * 0.5
      const baseR = (ring + 1) * 0.1
      const r = baseR * (1 + breathPhase * 0.35) * scale
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, size: 1 + breathPhase * 0.3 }
    }
    case 'heart': {
      const beat = 1 + Math.sin(t * 2) * 0.08
      const a = frac * TAU
      const hScale = scale * 0.03 * beat
      const x = hScale * 16 * Math.pow(Math.sin(a), 3)
      const y = -hScale * (13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a))
      return { x, y, size: 1 + Math.sin(t * 2) * 0.15 }
    }
    case 'water': {
      const row = Math.floor(frac * 6)
      const posInRow = (frac * 6) % 1
      const x = (posInRow - 0.5) * 1.4 * scale
      const y = (row - 2.5) * 0.15 * scale + Math.sin(posInRow * 8 + t * 2 + row * 1.5) * scale * 0.08
      return { x, y, size: 0.8 + Math.sin(t + i) * 0.2 }
    }
    case 'mountain': {
      // Particles cluster along mountain silhouette
      if (frac < 0.5) {
        const p = frac * 2
        const x = (-0.7 + p * 0.6) * scale
        const y = (0.35 - p * 0.75) * scale
        return { x, y, size: 0.8 }
      } else {
        const p = (frac - 0.5) * 2
        const x = (-0.1 + p * 0.8) * scale
        const y = (-0.4 + p * 0.75) * scale
        return { x, y, size: 0.8 }
      }
    }
    case 'spiral': {
      const a = frac * TAU * 3.5 + t * 0.3
      const r = frac * scale * 0.55
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: 0.5 + frac }
    }
    case 'tree': {
      if (frac < 0.25) {
        // Trunk particles
        const p = frac * 4
        return { x: (Math.sin(i + t * 0.3) * 0.02) * scale, y: (0.5 - p * 0.6) * scale, size: 1.2 }
      } else {
        // Branch/canopy particles — organic spread
        const p = (frac - 0.25) / 0.75
        const angle = -Math.PI / 2 + (Math.sin(i * 1.7) * 0.5) * Math.PI * 0.8
        const len = scale * (0.15 + p * 0.3 + Math.sin(t * 0.5 + i) * 0.02)
        return { x: Math.cos(angle) * len, y: -0.1 * scale + Math.sin(angle) * len, size: 0.7 + Math.sin(t + i) * 0.3 }
      }
    }
    case 'star': {
      const a = frac * TAU - Math.PI / 2 + t * 0.1
      const pointIndex = Math.floor(frac * 10)
      const r = pointIndex % 2 === 0 ? scale * 0.5 : scale * 0.2
      const jitter = Math.sin(i * 3.7 + t) * scale * 0.03
      return { x: Math.cos(a) * (r + jitter), y: Math.sin(a) * (r + jitter), size: 0.8 + Math.sin(t * 2 + i) * 0.3 }
    }
    case 'eye': {
      const blink = Math.max(0.1, Math.sin(t * 0.3))
      if (frac < 0.6) {
        // Eye outline particles
        const p = frac / 0.6
        const angle = (p - 0.5) * Math.PI * 0.8
        const top = p < 0.5
        const x = Math.sin(angle) * scale * 0.5
        const ySpread = scale * 0.28 * blink * (top ? -1 : 0.7)
        const y = Math.cos(angle) * ySpread * (top ? 0.5 : 0.35)
        return { x, y, size: 0.8 }
      } else {
        // Iris particles — clustered in center
        const p = (frac - 0.6) / 0.4
        const a = p * TAU + t * 0.2
        const r = scale * 0.08 * blink * (0.5 + p * 0.5)
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: 1.2 }
      }
    }
    case 'sun': {
      const pulse = 1 + Math.sin(t * 1.5) * 0.05
      if (frac < 0.4) {
        // Core particles
        const a = (frac / 0.4) * TAU + t * 0.2
        const r = scale * 0.15 * pulse * (0.3 + (frac / 0.4) * 0.7)
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: 1.5 }
      } else {
        // Ray particles
        const rayFrac = (frac - 0.4) / 0.6
        const rayIndex = Math.floor(rayFrac * 12)
        const a = rayIndex * TAU / 12 + t * 0.1
        const dist = scale * (0.2 + (rayFrac * 12 % 1) * 0.25) * pulse
        return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, size: 0.8 }
      }
    }
    case 'moon': {
      const a = frac * TAU
      const r = scale * 0.3
      // Only place particles on the crescent (left side)
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      const cutX = r * 0.4 // cutout center
      const cutR = r * 0.85
      const distFromCut = Math.sqrt((x - cutX) ** 2 + y ** 2)
      if (distFromCut < cutR * 0.9) return { x: Math.cos(a) * r * 1.02, y: Math.sin(a) * r, size: 0.6 }
      return { x, y, size: 1 }
    }
    case 'sound': {
      const wave = Math.floor(frac * 5)
      const posInWave = (frac * 5) % 1
      const angle = (posInWave - 0.5) * Math.PI * 0.8
      const r = scale * (0.08 + wave * 0.1) + Math.sin(t * 3 + wave) * scale * 0.02
      const ox = -0.3 * scale
      return { x: ox + Math.cos(angle) * r, y: Math.sin(angle) * r, size: 1 - wave * 0.1 }
    }
    case 'hands': {
      const side = frac < 0.5 ? -1 : 1
      const localFrac = (frac < 0.5 ? frac : frac - 0.5) * 2
      const hx = side * scale * 0.22
      if (localFrac < 0.4) {
        // Palm
        const a = (localFrac / 0.4) * TAU
        return { x: hx + Math.cos(a) * scale * 0.1, y: 0.05 * scale + Math.sin(a) * scale * 0.14, size: 1 }
      } else {
        // Fingers
        const f = Math.floor((localFrac - 0.4) / 0.12)
        const fa = (-0.5 + f * 0.25) * side
        const ext = ((localFrac - 0.4) / 0.12 % 1)
        const fx = hx + Math.sin(fa) * scale * 0.08
        const fy = -0.12 * scale
        return { x: fx + Math.sin(fa) * scale * 0.15 * ext, y: fy - scale * 0.18 * ext, size: 0.7 }
      }
    }
    case 'stillness': {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.6)
      const a = frac * TAU + t * 0.05
      const r = scale * 0.08 * (0.5 + pulse * 0.8) * (0.3 + frac * 0.7)
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: 0.5 + pulse * 0.5 }
    }
    default: {
      const a = frac * TAU + t * 0.2
      const r = scale * 0.3
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: 1 }
    }
  }
}

function drawShape(ctx, shape, cx, cy, scale, t) {
  const col = SHAPE_COLORS[shape] || SHAPE_COLORS.sphere
  const count = shape === 'flame' ? 70 : shape === 'breath' ? 60 : shape === 'stillness' ? 30 : 55
  const particles = getShapeParticles(shape, count)

  // Ambient glow behind the formation
  const ag = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.6)
  ag.addColorStop(0, col.glow + '0.08)')
  ag.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(cx, cy, scale * 0.6, 0, TAU)
  ctx.fillStyle = ag; ctx.fill()

  // Draw each particle with organic drift
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const target = getShapeTarget(shape, i, count, t, scale)

    // Add organic drift — sine-based wobble, not random noise
    const driftX = Math.sin(t * p.speed + p.phase) * scale * p.drift
    const driftY = Math.cos(t * p.speed * 0.7 + p.offset) * scale * p.drift * 0.8

    const px = cx + target.x + driftX
    const py = cy + target.y + driftY
    const pSize = p.size * target.size

    // Particle glow
    const alpha = p.brightness * (0.5 + 0.5 * Math.sin(t * 1.5 + p.phase))
    const glowR = pSize * 3
    const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR)
    grd.addColorStop(0, col.glow + Math.min(alpha * 0.6, 0.6).toFixed(2) + ')')
    grd.addColorStop(1, 'transparent')
    ctx.beginPath(); ctx.arc(px, py, glowR, 0, TAU)
    ctx.fillStyle = grd; ctx.fill()

    // Particle core
    ctx.beginPath(); ctx.arc(px, py, pSize * 0.7, 0, TAU)
    ctx.fillStyle = p.layer === 0 ? col.primary : p.layer === 1 ? col.secondary : col.glow + '0.7)'
    ctx.globalAlpha = 0.6 + alpha * 0.4
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Connecting filaments between nearby particles (organic, not straight)
  ctx.globalAlpha = 0.12
  for (let i = 0; i < Math.min(particles.length, 40); i += 2) {
    const j = (i + 3) % particles.length
    const pi = getShapeTarget(shape, i, count, t, scale)
    const pj = getShapeTarget(shape, j, count, t, scale)
    const di = particles[i], dj = particles[j]
    const x1 = cx + pi.x + Math.sin(t * di.speed + di.phase) * scale * di.drift
    const y1 = cy + pi.y + Math.cos(t * di.speed * 0.7 + di.offset) * scale * di.drift * 0.8
    const x2 = cx + pj.x + Math.sin(t * dj.speed + dj.phase) * scale * dj.drift
    const y2 = cy + pj.y + Math.cos(t * dj.speed * 0.7 + dj.offset) * scale * dj.drift * 0.8
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    if (dist < scale * 0.4) {
      // Curved filament, not straight
      const mx = (x1 + x2) / 2 + Math.sin(t + i) * scale * 0.05
      const my = (y1 + y2) / 2 + Math.cos(t + i) * scale * 0.04
      ctx.beginPath(); ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(mx, my, x2, y2)
      ctx.strokeStyle = col.glow + '0.3)'; ctx.lineWidth = 0.6; ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

function InlineParticles({ stepText, active }) {
  const canvasRef = useRef(null)
  const shapeRef = useRef('sphere')

  useEffect(() => {
    shapeRef.current = detectShape(stepText)
  }, [stepText])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf

    function draw(time) {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (W < 5 || H < 5) { raf = requestAnimationFrame(draw); return }
      canvas.width = W * dpr; canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2, scale = Math.min(W, H) * 0.4
      const t = time * 0.001

      drawShape(ctx, shapeRef.current, cx, cy, scale, t)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [stepText, active])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

export default function RitualDetail() {
  const profile = useComputedProfile()
  const [activeTab, setActiveTab] = useState('recommended') // recommended | traditions | active
  const [activeRitual, setActiveRitual] = useState(null) // ritual id for immersive view
  const [ritualStep, setRitualStep] = useState(0)
  const [filter, setFilter] = useState(null) // tradition key filter

  const result = useMemo(() => getRecommendedRituals(profile), [profile])
  const moon = useMemo(() => getMoonPhase(), [])

  // Active ritual object
  const ritual = activeRitual ? getRitualById(activeRitual) || result.rituals.find(r => r.id === activeRitual) : null

  // ─── Immersive Ritual View ────────────────────────────────
  if (ritual && activeTab === 'active') {
    const step = ritual.instructions[ritualStep]
    const progress = ((ritualStep + 1) / ritual.instructions.length) * 100
    const trad = ritual.tradition || TRADITIONS[ritual.tradition]

    return (
      <div style={{ padding: 0, minHeight: '100%' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => { setActiveTab('recommended'); setActiveRitual(null); setRitualStep(0) }}
            style={S.backBtn}>← Back</button>
          <div style={{ textAlign: 'center' }}>
            <div style={S.sectionLabel}>{trad?.name || ''} Tradition</div>
            <div style={{ fontSize: 15, color: '#fff', fontFamily: "'Cinzel',serif" }}>{ritual.name}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{ritual.duration} min</div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--border)', margin: '0 20px' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: trad?.color || '#c9a84c', transition: 'width .4s ease', borderRadius: 1 }} />
        </div>

        {/* Step-aware particle visualization — shape adapts to instruction content */}
        <div style={{ height: 220, position: 'relative', margin: '0 20px', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
          <InlineParticles stepText={step} active={true} />
        </div>

        {/* Step content */}
        <div style={{ padding: '20px 24px', textAlign: 'center', minHeight: 180 }}>
          <div style={{ fontSize: 11, color: trad?.color || '#c9a84c', letterSpacing: '.15em', fontFamily: "'Cinzel',serif", marginBottom: 8 }}>
            Step {ritualStep + 1} of {ritual.instructions.length}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--foreground)', fontFamily: "'Cormorant Garamond',serif", maxWidth: 480, margin: '0 auto', fontStyle: 'italic' }}>
            {step}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '0 20px 24px' }}>
          <button
            onClick={() => setRitualStep(s => Math.max(0, s - 1))}
            disabled={ritualStep === 0}
            style={{ ...S.navBtn, opacity: ritualStep === 0 ? 0.3 : 1 }}>
            ← Previous
          </button>
          {ritualStep < ritual.instructions.length - 1 ? (
            <button onClick={() => setRitualStep(s => s + 1)} style={{ ...S.navBtn, background: `${trad?.color || '#c9a84c'}20`, borderColor: `${trad?.color || '#c9a84c'}40`, color: trad?.color || '#c9a84c' }}>
              Next Step →
            </button>
          ) : (
            <button onClick={() => { setActiveTab('recommended'); setActiveRitual(null); setRitualStep(0) }}
              style={{ ...S.navBtn, background: 'rgba(96,176,48,.15)', borderColor: 'rgba(96,176,48,.3)', color: '#60b030' }}>
              ✦ Complete Ritual
            </button>
          )}
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '0 0 20px' }}>
          {ritual.instructions.map((_, i) => (
            <div key={i} onClick={() => setRitualStep(i)} style={{
              width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
              background: i === ritualStep ? (trad?.color || '#c9a84c') : i < ritualStep ? 'rgba(96,176,48,.5)' : 'rgba(255,255,255,.1)',
              transition: 'all .2s',
            }} />
          ))}
        </div>

        {/* Original name + element */}
        <div style={{ textAlign: 'center', padding: '12px 20px 24px', borderTop: '1px solid rgba(255,255,255,.04)' }}>
          {ritual.originalName && (
            <div style={{ fontSize: 18, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>
              {ritual.originalName}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            {ELEMENTS[ritual.element] || '✦'} {ritual.element} element · {DIFFICULTY[ritual.difficulty]?.label || ritual.difficulty}
          </div>
        </div>
      </div>
    )
  }

  // ─── Main View ────────────────────────────────────────────
  const displayRituals = filter
    ? result.rituals.filter(r => (r.tradition?.name || '').toLowerCase().includes(filter) || r.tradition === filter)
    : activeTab === 'recommended'
      ? result.rituals.slice(0, 8)
      : result.rituals

  return (
    <div style={{ padding: '0 0 30px' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>Ritual</div>
        <AboutSystemButton systemName="Ritual" />
      </div>

      {/* ── Conditions Banner ── */}
      <div style={{ padding: '16px 20px', background: 'rgba(201,168,76,.04)', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
        <div style={S.sectionLabel}>Current Conditions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <Pill color="#c9a84c">{moon.phaseEmoji} {moon.phaseName}</Pill>
          {result.conditions.personalDay && <Pill color="#9080e0">Personal Day {result.conditions.personalDay}</Pill>}
          {result.conditions.cyclePhase && <Pill color="#c44d7a">{result.conditions.cyclePhase} Phase</Pill>}
          {profile.hdType && profile.hdType !== '?' && <Pill color="#60b0dd">{profile.hdType}</Pill>}
          {profile.enneagramType && <Pill color="#d44070">Enn {profile.enneagramType}</Pill>}
          {profile.doshaType && <Pill color="#44cc88">{profile.doshaType}</Pill>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        {[
          { key: 'recommended', label: 'Recommended' },
          { key: 'traditions', label: 'By Tradition' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setFilter(null) }}
            style={{
              padding: '10px 16px', fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: '.1em',
              color: activeTab === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
              borderBottom: activeTab === tab.key ? '2px solid var(--foreground)' : '2px solid transparent',
              background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid',
              cursor: 'pointer', transition: 'all .2s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Top Recommendation ── */}
      {activeTab === 'recommended' && result.topRecommendation && (
        <div style={{ margin: '16px 20px', padding: 20, borderRadius: 12, background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={S.sectionLabel}>Today's Ritual</div>
              <div style={{ fontSize: 18, fontFamily: "'Cinzel',serif", color: '#fff', marginTop: 4 }}>
                {result.topRecommendation.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
                {result.topRecommendation.tradition?.name} · {result.topRecommendation.duration} min · {ELEMENTS[result.topRecommendation.element]} {result.topRecommendation.element}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 24, fontWeight: 300, fontFamily: "'Inconsolata',monospace",
                color: result.topRecommendation.score > 70 ? '#60b030' : result.topRecommendation.score > 40 ? '#c9a84c' : 'var(--muted-foreground)',
              }}>
                {result.topRecommendation.score}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted-foreground)', letterSpacing: '.1em' }}>ALIGNMENT</div>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif", marginTop: 12 }}>
            {result.topRecommendation.description}
          </div>
          <button
            onClick={() => { setActiveRitual(result.topRecommendation.id); setActiveTab('active'); setRitualStep(0) }}
            style={{ marginTop: 14, padding: '10px 28px', borderRadius: 20, background: '#b8860b', border: '2px solid #d4a017', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel',serif", letterSpacing: '.08em', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 0 16px rgba(201,168,76,.35)' }}>
            Begin Ritual →
          </button>
        </div>
      )}

      {/* ── Tradition Filter (traditions tab) ── */}
      {activeTab === 'traditions' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '14px 20px' }}>
          <button onClick={() => setFilter(null)} style={{ ...S.filterPill, ...(filter === null ? S.filterActive : {}) }}>All</button>
          {Object.entries(TRADITIONS).map(([key, t]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                ...S.filterPill,
                ...(filter === key ? { background: t.color + '25', borderColor: t.color + '50', color: t.color } : {}),
              }}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Ritual Cards ── */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {displayRituals.map(r => {
          const trad = r.tradition || {}
          const diff = DIFFICULTY[r.difficulty] || {}
          return (
            <div key={r.id} style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)',
              cursor: 'pointer', transition: 'all .2s',
            }}
              onClick={() => { setActiveRitual(r.id); setActiveTab('active'); setRitualStep(0) }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = (trad.color || '#c9a84c') + '40'; e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{trad.icon || '✦'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontFamily: "'Cinzel',serif", color: '#fff' }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {trad.name} · {r.duration} min · {ELEMENTS[r.element]} {r.element}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.moonAlignment && <span style={{ fontSize: 10, color: '#c9a84c' }}>🌙</span>}
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: diff.color + '15', border: `1px solid ${diff.color}25`, color: diff.color }}>
                    {diff.label}
                  </span>
                  <span style={{
                    fontSize: 13, fontFamily: "'Inconsolata',monospace", fontWeight: 600,
                    color: r.score > 70 ? '#60b030' : r.score > 40 ? '#c9a84c' : 'var(--muted-foreground)',
                  }}>
                    {r.score}%
                  </span>
                </div>
              </div>
              {r.originalName && (
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif", marginTop: 4, fontStyle: 'italic' }}>
                  {r.originalName}
                </div>
              )}
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted-foreground)', fontFamily: "'Cormorant Garamond',serif", marginTop: 6 }}>
                {r.description.length > 140 ? r.description.slice(0, 140) + '...' : r.description}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {r.purpose.slice(0, 4).map(p => (
                  <span key={p} style={{ fontSize: 9, padding: '1px 7px', borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Moon Alignment Section ── */}
      {activeTab === 'recommended' && result.moonAligned.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={S.sectionLabel}>
            {moon.phaseEmoji} Aligned with {moon.phaseName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4, fontFamily: "'Cormorant Garamond',serif" }}>
            {result.moonAligned.length} ritual{result.moonAligned.length > 1 ? 's' : ''} from {new Set(result.moonAligned.map(r => r.tradition?.name)).size} traditions align with tonight's moon.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Small Components ───────────────────────────────────────
function Pill({ color, children }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 10,
      background: color + '12', border: `1px solid ${color}25`, color: color,
      fontFamily: "'Cinzel',serif", letterSpacing: '.05em',
    }}>
      {children}
    </span>
  )
}

// ─── Styles ─────────────────────────────────────────────────
const S = {
  sectionLabel: {
    fontSize: 9, fontFamily: "'Cinzel',serif", letterSpacing: '.2em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,.5)',
  },
  backBtn: {
    background: '#1a1a2e', border: '2px solid #444',
    color: '#999', padding: '7px 16px', borderRadius: 14,
    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cinzel',serif",
  },
  navBtn: {
    padding: '10px 22px', borderRadius: 16,
    background: '#252540', border: '2px solid #555',
    color: '#ccc', fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel',serif",
    letterSpacing: '.06em', cursor: 'pointer', transition: 'all .2s',
  },
  filterPill: {
    padding: '6px 14px', borderRadius: 12, fontSize: 10,
    background: '#1a1a2e', border: '2px solid #444',
    color: '#999', cursor: 'pointer', fontFamily: "'Cinzel',serif",
    fontWeight: 700, letterSpacing: '.05em', transition: 'all .2s',
  },
  filterActive: {
    background: '#b8860b', borderColor: '#d4a017',
    color: '#fff',
  },
}
