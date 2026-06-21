import { useState, useRef, useCallback, useEffect } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'
import {
  MAJOR_LINES, MINOR_LINES, MOUNTS, HAND_SHAPES, FINGERS,
  SPECIAL_MARKINGS, DOMINANT_HAND_INFO,
  detectSpecularHighlights, detectSkinTone, buildPalmReadingPrompt,
} from '../../engines/palmistryEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ── Shared styles ──────────────────────────────────────────────── */
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
    borderBottom: '1px solid var(--accent)', marginBottom: 8,
  },
  glass: (extra = {}) => ({
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 16, ...extra,
  }),
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em',
    textTransform: 'uppercase', background: color + '20', border: `1px solid ${color}44`,
    color: color, flexShrink: 0,
  }),
  btn: (active, color = '#c9a84c') => ({
    padding: '10px 20px', borderRadius: 8, cursor: active ? 'pointer' : 'not-allowed',
    fontSize: 12, fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '.1em',
    textTransform: 'uppercase', transition: 'all .15s',
    background: active ? color : '#1a1a2e',
    border: `2px solid ${active ? color : '#333'}`,
    color: active ? '#000' : '#555',
    boxShadow: active ? `0 0 16px ${color}55` : 'none',
    opacity: active ? 1 : 0.5,
  }),
  row: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
    borderRadius: 9, background: 'var(--secondary)', border: '1px solid var(--border)',
  },
}

const PALM_COLOR = '#c9a84c'
const LINE_COLORS = {
  lifeLine: '#e85d75',
  heartLine: '#ff6b9d',
  headLine: '#64b5f6',
  fateLine: '#ab47bc',
  sunLine: '#ffd54f',
  mercuryLine: '#4db6ac',
}

/* ── Specular Highlight Overlay ────────────────────────────────── */
function HighlightOverlay({ hotspots, canvasW, canvasH, imgW, imgH }) {
  if (!hotspots?.length) return null
  const scaleX = canvasW / imgW
  const scaleY = canvasH / imgH
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, pointerEvents: 'none' }}>
      {hotspots.map((h, i) => (
        <circle
          key={i}
          cx={h.x * scaleX} cy={h.y * scaleY}
          r={Math.max(h.r * scaleX, 6)}
          fill="none" stroke="rgba(255,50,50,0.7)" strokeWidth={2}
          strokeDasharray="4 3"
        />
      ))}
    </svg>
  )
}

/* ── Strength Bar ──────────────────────────────────────────────── */
function StrengthBar({ value, max = 10, color = PALM_COLOR }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }}>
        <div style={{
          width: pct + '%', height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width .4s ease',
        }} />
      </div>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: 'var(--muted-foreground)', minWidth: 20, textAlign: 'right' }}>{value}/10</span>
    </div>
  )
}

/* ── Mount Prominence Indicator ────────────────────────────────── */
function ProminenceIndicator({ level }) {
  const levels = { flat: 1, moderate: 2, prominent: 3 }
  const n = levels[level] || 1
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i <= n ? PALM_COLOR : 'var(--border)',
          transition: 'background .2s',
        }} />
      ))}
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginLeft: 4 }}>{level}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                */
/* ═══════════════════════════════════════════════════════════════ */
export default function PalmReadingDetail() {
  const profile = useActiveProfile()
  const palmReading = useGolemStore((s) => s.palmReading)
  const setPalmReading = useGolemStore((s) => s.setPalmReading)

  const [image, setImage] = useState(null) // { src, width, height }
  const [highlightResult, setHighlightResult] = useState(null)
  const [dominantHand, setDominantHand] = useState('right')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [reading, setReading] = useState(palmReading || null)
  const [activeTab, setActiveTab] = useState('upload') // upload | reading | reference

  const fileRef = useRef(null)
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  // Load saved reading on mount
  useEffect(() => {
    if (palmReading && !reading) setReading(palmReading)
  }, [palmReading])

  /* ── Image Upload Handler ──────────────────────────────────── */
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setHighlightResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        setImage({ src: ev.target.result, width: img.width, height: img.height })
        imgRef.current = img

        // Run specular highlight detection
        const canvas = document.createElement('canvas')
        const maxDim = 800
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = detectSpecularHighlights(imageData, canvas.width, canvas.height)
        setHighlightResult(result)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  /* ── AI Palm Analysis ──────────────────────────────────────── */
  const analyzePalm = useCallback(async () => {
    if (!image) return
    setAnalyzing(true)
    setError(null)

    try {
      const prompt = buildPalmReadingPrompt(dominantHand, profile)

      // Try direct Anthropic with vision
      const ANTHROPIC_KEY =
        import.meta.env.VITE_ANTHROPIC_API_KEY &&
        !import.meta.env.VITE_ANTHROPIC_API_KEY.includes('REPLACE') &&
        !import.meta.env.VITE_ANTHROPIC_API_KEY.includes('placeholder')
          ? import.meta.env.VITE_ANTHROPIC_API_KEY
          : null

      if (!ANTHROPIC_KEY) {
        throw new Error('Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file.')
      }

      // Extract base64 data and media type
      const base64Match = image.src.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!base64Match) throw new Error('Invalid image format')
      const mediaType = base64Match[1]
      const base64Data = base64Match[2]

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          }],
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `API error: ${res.status}`)
      }

      const data = await res.json()
      const text = data?.content?.[0]?.text || ''

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse reading from AI response')

      const parsed = JSON.parse(jsonMatch[0])
      setReading(parsed)
      setActiveTab('reading')

      // Save to store
      if (setPalmReading) setPalmReading(parsed)
    } catch (err) {
      console.error('Palm analysis error:', err)
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }, [image, dominantHand, profile, setPalmReading])

  /* ── Tab Navigation ────────────────────────────────────────── */
  const tabs = [
    { id: 'upload', label: 'Upload' },
    { id: 'reading', label: 'Reading', disabled: !reading },
    { id: 'reference', label: 'Reference Guide' },
  ]

  return (
    <div style={S.panel}>
      {/* Header + Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0' }}>
        <div>Palm Reading</div>
        <AboutSystemButton systemName="Palm Reading" />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => !t.disabled && setActiveTab(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 6, cursor: t.disabled ? 'not-allowed' : 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase',
              background: activeTab === t.id ? 'var(--accent)' : 'transparent',
              border: `1px solid ${activeTab === t.id ? 'var(--gold, #c9a84c)' : 'var(--border)'}`,
              color: t.disabled ? 'var(--border)' : activeTab === t.id ? 'var(--gold, #c9a84c)' : 'var(--muted-foreground)',
              opacity: t.disabled ? 0.4 : 1,
              transition: 'all .15s',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ═══ UPLOAD TAB ═══ */}
      {activeTab === 'upload' && (
        <>
          {/* Instructions */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Palm Photo Guidelines</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
              <p style={{ margin: '0 0 8px' }}>For the most accurate reading, follow these guidelines:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  '☉ Use diffused, even lighting — avoid direct flash or harsh overhead light',
                  '✋ Open palm fully, fingers slightly spread, hand relaxed',
                  '📷 Photograph from directly above, parallel to the palm',
                  '⊙ Include the entire palm from wrist to fingertips',
                  '◎ Ensure major lines (life, heart, head) are clearly visible',
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--muted-foreground)', paddingLeft: 4 }}>{tip}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Hand selection */}
          <div style={S.glass({ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' })}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Which hand is this?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['right', 'left'].map(h => (
                <div
                  key={h}
                  onClick={() => setDominantHand(h)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
                    background: dominantHand === h ? PALM_COLOR + '30' : 'var(--accent)',
                    border: `1px solid ${dominantHand === h ? PALM_COLOR : 'var(--border)'}`,
                    color: dominantHand === h ? PALM_COLOR : 'var(--muted-foreground)',
                    transition: 'all .15s',
                  }}
                >
                  {h} {h === 'right' ? '(dominant)' : '(non-dominant)'}
                </div>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              ...S.glass(),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: image ? 'auto' : 220, cursor: 'pointer',
              borderStyle: image ? 'solid' : 'dashed',
              borderColor: image
                ? (highlightResult?.pass ? '#4caf5066' : '#ff572266')
                : 'var(--border)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {!image ? (
              <>
                <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>✋</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                  Tap to upload palm photo
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', opacity: 0.5, marginTop: 6 }}>
                  or drag & drop an image here
                </div>
              </>
            ) : (
              <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
                <img
                  src={image.src}
                  alt="Palm"
                  style={{ width: '100%', borderRadius: 8, display: 'block' }}
                />
                {highlightResult && !highlightResult.pass && (
                  <HighlightOverlay
                    hotspots={highlightResult.hotspots}
                    canvasW={500}
                    canvasH={500 * (image.height / image.width)}
                    imgW={image.width}
                    imgH={image.height}
                  />
                )}
              </div>
            )}
          </div>

          {/* Specular highlight result */}
          {highlightResult && (
            <div style={S.glass({
              borderColor: highlightResult.pass ? '#4caf5066' : '#ff572266',
              display: 'flex', alignItems: 'center', gap: 12,
            })}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: highlightResult.pass ? '#4caf5020' : '#ff572220',
                border: `1px solid ${highlightResult.pass ? '#4caf5044' : '#ff572244'}`,
                fontSize: 18,
              }}>
                {highlightResult.pass ? '✓' : '⚠'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: highlightResult.pass ? '#4caf50' : '#ff5722', marginBottom: 3 }}>
                  Specular Highlight Analysis — {highlightResult.score}% reflection
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  {highlightResult.message}
                </div>
              </div>
            </div>
          )}

          {/* Analyze button */}
          {image && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <div
                onClick={() => {
                  setImage(null)
                  setHighlightResult(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                style={S.btn(true, '#555')}
              >
                Clear
              </div>
              <div
                onClick={() => !analyzing && analyzePalm()}
                style={S.btn(!analyzing, PALM_COLOR)}
              >
                {analyzing ? 'Analyzing Palm...' : 'Read My Palm'}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={S.glass({ borderColor: '#ff572244', color: '#ff8a65' })}>
              <div style={{ fontSize: 12 }}>{error}</div>
            </div>
          )}

          {/* Loading animation */}
          {analyzing && (
            <div style={{
              ...S.glass(),
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: `3px solid ${PALM_COLOR}22`,
                borderTopColor: PALM_COLOR,
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: PALM_COLOR }}>
                Reading the lines of destiny...
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
        </>
      )}

      {/* ═══ READING TAB ═══ */}
      {activeTab === 'reading' && reading && (
        <>
          {/* Hand Shape */}
          {reading.handShape && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Hand Shape & Element</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={S.badge(PALM_COLOR)}>{reading.handShape.type} Hand</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
                {reading.handShape.description}
              </div>
              {reading.handShape.elementalAffinity && (
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--foreground)', marginTop: 8, fontStyle: 'italic' }}>
                  {reading.handShape.elementalAffinity}
                </div>
              )}
            </div>
          )}

          {/* Major Lines */}
          {reading.majorLines && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Major Lines</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'lifeLine', label: 'Life Line', color: LINE_COLORS.lifeLine, sanskrit: 'Pitri Rekha' },
                  { key: 'heartLine', label: 'Heart Line', color: LINE_COLORS.heartLine, sanskrit: 'Hridaya Rekha' },
                  { key: 'headLine', label: 'Head Line', color: LINE_COLORS.headLine, sanskrit: 'Matri Rekha' },
                  { key: 'fateLine', label: 'Fate Line', color: LINE_COLORS.fateLine, sanskrit: 'Shani Rekha' },
                ].map(line => {
                  const data = reading.majorLines[line.key]
                  if (!data) return null
                  return (
                    <div key={line.key} style={S.row}>
                      <div style={{
                        width: 4, height: 44, borderRadius: 2, flexShrink: 0,
                        background: `linear-gradient(180deg, ${line.color}, ${line.color}44)`,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600, color: line.color }}>{line.label}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{line.sanskrit}</span>
                        </div>
                        {data.strength && <StrengthBar value={data.strength} color={line.color} />}
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--foreground)' }}>Observed: </strong>{data.observed}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--foreground)', marginTop: 4, lineHeight: 1.6 }}>
                          {data.interpretation}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Minor Lines */}
          {reading.minorLines && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Minor Lines</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'sunLine', label: 'Sun Line (Apollo)', color: LINE_COLORS.sunLine },
                  { key: 'mercuryLine', label: 'Mercury Line (Health)', color: LINE_COLORS.mercuryLine },
                  { key: 'marriageLines', label: 'Marriage / Union Lines', color: '#e0a0c0' },
                  { key: 'intuitionLine', label: 'Line of Intuition', color: '#b39ddb' },
                  { key: 'girdleOfVenus', label: 'Girdle of Venus', color: '#f48fb1' },
                  { key: 'braceletLines', label: 'Bracelet Lines', color: '#80cbc4' },
                ].map(line => {
                  const data = reading.minorLines[line.key]
                  if (!data) return null
                  const present = data.present !== false && data.count !== 0
                  return (
                    <div key={line.key} style={{ ...S.row, opacity: present ? 1 : 0.5 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: present ? line.color : 'var(--border)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: present ? line.color : 'var(--muted-foreground)' }}>{line.label}</span>
                          <span style={S.badge(present ? '#4caf50' : '#888')}>{present ? (data.count ? `${data.count} line${data.count > 1 ? 's' : ''}` : 'present') : 'not visible'}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 3, lineHeight: 1.6 }}>
                          {data.interpretation || data.observed}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mounts */}
          {reading.mounts && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Mounts of the Palm</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  { key: 'jupiter', label: 'Jupiter', symbol: '♃' },
                  { key: 'saturn', label: 'Saturn', symbol: '♄' },
                  { key: 'apollo', label: 'Apollo (Sun)', symbol: '☉' },
                  { key: 'mercury', label: 'Mercury', symbol: '☿' },
                  { key: 'venus', label: 'Venus', symbol: '♀' },
                  { key: 'luna', label: 'Luna (Moon)', symbol: '☽' },
                  { key: 'mars', label: 'Mars', symbol: '♂' },
                ].map(mount => {
                  const data = reading.mounts[mount.key]
                  if (!data) return null
                  return (
                    <div key={mount.key} style={{ ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{mount.symbol}</span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600 }}>{mount.label}</span>
                      </div>
                      <ProminenceIndicator level={data.prominence} />
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                        {data.interpretation}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fingers */}
          {reading.fingers && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Finger Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'thumb', label: 'Thumb', planet: 'Will' },
                  { key: 'index', label: 'Index (Jupiter)', planet: '♃' },
                  { key: 'middle', label: 'Middle (Saturn)', planet: '♄' },
                  { key: 'ring', label: 'Ring (Apollo)', planet: '☉' },
                  { key: 'pinky', label: 'Little (Mercury)', planet: '☿' },
                ].map(finger => {
                  const data = reading.fingers[finger.key]
                  if (!data) return null
                  return (
                    <div key={finger.key} style={S.row}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, minWidth: 100 }}>
                        {finger.label}
                      </span>
                      <div style={{ flex: 1 }}>
                        {data.observed && (
                          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 2 }}>
                            {data.observed}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.5 }}>
                          {data.interpretation}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Special Markings */}
          {reading.specialMarkings?.length > 0 && (
            <div style={S.glass()}>
              <div style={S.sectionTitle}>Special Markings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reading.specialMarkings.map((mark, i) => (
                  <div key={i} style={S.row}>
                    <span style={S.badge(PALM_COLOR)}>{mark.type}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Location: {mark.location}</div>
                      <div style={{ fontSize: 12, color: 'var(--foreground)', marginTop: 2, lineHeight: 1.5 }}>{mark.interpretation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synthesis */}
          {reading.synthesis && (
            <div style={{
              ...S.glass(),
              borderColor: PALM_COLOR + '44',
              background: PALM_COLOR + '08',
            }}>
              <div style={S.sectionTitle}>Synthesis — The Complete Picture</div>

              {reading.synthesis.dominantElement && (
                <div style={{ marginBottom: 12 }}>
                  <span style={S.badge(PALM_COLOR)}>Dominant Element: {reading.synthesis.dominantElement}</span>
                </div>
              )}

              {reading.synthesis.keyThemes?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 6 }}>Key Themes</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {reading.synthesis.keyThemes.map((t, i) => (
                      <span key={i} style={S.badge('#ab47bc')}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {reading.synthesis.strengths?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4caf50', marginBottom: 6 }}>Strengths</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {reading.synthesis.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--foreground)', paddingLeft: 12, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#4caf50' }}>+</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reading.synthesis.challenges?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#ff9800', marginBottom: 6 }}>Challenges</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {reading.synthesis.challenges.map((c, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--foreground)', paddingLeft: 12, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#ff9800' }}>~</span> {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reading.synthesis.lifePath && (
                <div style={{
                  fontSize: 14, lineHeight: 1.8, color: 'var(--foreground)', marginTop: 12,
                  padding: '12px 16px', borderLeft: `3px solid ${PALM_COLOR}`,
                  background: PALM_COLOR + '08', borderRadius: '0 8px 8px 0',
                }}>
                  {reading.synthesis.lifePath}
                </div>
              )}

              {reading.synthesis.advice && (
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', marginTop: 12, fontStyle: 'italic' }}>
                  {reading.synthesis.advice}
                </div>
              )}
            </div>
          )}

          {/* Re-read button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <div onClick={() => setActiveTab('upload')} style={S.btn(true, '#555')}>
              Upload New Photo
            </div>
          </div>
        </>
      )}

      {/* ═══ REFERENCE TAB ═══ */}
      {activeTab === 'reference' && (
        <>
          {/* Dominant hand info */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Dominant vs Non-Dominant Hand</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <strong style={{ color: PALM_COLOR }}>Dominant hand:</strong> {DOMINANT_HAND_INFO.dominant}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <strong style={{ color: PALM_COLOR }}>Non-dominant hand:</strong> {DOMINANT_HAND_INFO.nondominant}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
                {DOMINANT_HAND_INFO.both}
              </div>
            </div>
          </div>

          {/* Hand shapes */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Hand Shapes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {HAND_SHAPES.map(shape => (
                <div key={shape.id} style={{ ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={S.badge(PALM_COLOR)}>{shape.element}</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600 }}>{shape.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: PALM_COLOR, fontStyle: 'italic' }}>{shape.traits}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{shape.personality}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Major lines reference */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Major Lines Reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MAJOR_LINES.map(line => (
                <div key={line.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>{line.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{line.sanskrit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6 }}>{line.meaning}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12 }}>
                    {line.variations.map((v, i) => (
                      <div key={i} style={{ fontSize: 11, lineHeight: 1.5 }}>
                        <span style={{ color: PALM_COLOR }}>{v.type}:</span>{' '}
                        <span style={{ color: 'var(--muted-foreground)' }}>{v.interpretation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mounts reference */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Mounts Reference</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {MOUNTS.map(mount => (
                <div key={mount.id} style={{ ...S.row, flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{mount.symbol}</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600 }}>{mount.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: PALM_COLOR }}>{mount.meaning}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    <strong>Prominent:</strong> {mount.prominent}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special markings */}
          <div style={S.glass()}>
            <div style={S.sectionTitle}>Special Markings</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {SPECIAL_MARKINGS.map(mark => (
                <div key={mark.id} style={S.row}>
                  <span style={S.badge(PALM_COLOR)}>{mark.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{mark.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
