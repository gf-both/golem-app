import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FREQUENCIES, FREQUENCY_CATEGORIES, getRecommendedFrequencies, searchFrequencies } from '../../engines/frequencyEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ─── Multi-track Web Audio Player ─────────────────────────────────────────── */
function useFrequencyPlayer() {
  const ctxRef = useRef(null)
  const tracksRef = useRef({}) // { [freqId]: { osc, osc2, gain, lfo, lfoGain } }
  const [playingIds, setPlayingIds] = useState([])
  const [currentId, setCurrentId] = useState(null) // last-started, for visualizer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(0)

  const stopOne = useCallback((freqId) => {
    const n = tracksRef.current[freqId]
    if (!n) return
    delete tracksRef.current[freqId]

    try {
      if (n.gain && ctxRef.current) {
        const now = ctxRef.current.currentTime
        n.gain.gain.cancelScheduledValues(now)
        n.gain.gain.setValueAtTime(n.gain.gain.value || 0.25, now)
        n.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
      }
      setTimeout(() => {
        try { n.osc?.stop() } catch {}
        try { n.osc2?.stop() } catch {}
        try { n.lfo?.stop() } catch {}
        try { n.gain?.disconnect() } catch {}
        try { n.lfoGain?.disconnect() } catch {}
      }, 350)
    } catch {
      try { n.osc?.stop() } catch {}
      try { n.osc2?.stop() } catch {}
      try { n.lfo?.stop() } catch {}
      try { n.gain?.disconnect() } catch {}
    }

    setPlayingIds(prev => {
      const next = prev.filter(id => id !== freqId)
      if (next.length === 0) {
        clearInterval(timerRef.current)
        setElapsed(0)
        setCurrentId(null)
      }
      return next
    })
  }, [])

  const stopAll = useCallback(() => {
    const ids = Object.keys(tracksRef.current)
    ids.forEach(id => {
      const n = tracksRef.current[id]
      if (!n) return
      try {
        if (n.gain && ctxRef.current) {
          const now = ctxRef.current.currentTime
          n.gain.gain.cancelScheduledValues(now)
          n.gain.gain.setValueAtTime(n.gain.gain.value || 0.25, now)
          n.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
        }
        setTimeout(() => {
          try { n.osc?.stop() } catch {}
          try { n.osc2?.stop() } catch {}
          try { n.lfo?.stop() } catch {}
          try { n.gain?.disconnect() } catch {}
          try { n.lfoGain?.disconnect() } catch {}
        }, 350)
      } catch {
        try { n.osc?.stop() } catch {}
        try { n.osc2?.stop() } catch {}
        try { n.lfo?.stop() } catch {}
        try { n.gain?.disconnect() } catch {}
      }
    })
    tracksRef.current = {}
    setPlayingIds([])
    setCurrentId(null)
    clearInterval(timerRef.current)
    setElapsed(0)
  }, [])

  const play = useCallback((freq) => {
    // If this specific frequency is already playing, stop it
    if (tracksRef.current[freq.id]) {
      stopOne(freq.id)
      return
    }

    try {
      const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') ctx.resume()

      // Master gain
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 1.5)
      gain.connect(ctx.destination)

      // Main oscillator
      const osc = ctx.createOscillator()
      osc.type = freq.waveform || 'sine'
      osc.frequency.setValueAtTime(freq.frequency, ctx.currentTime)

      // Subtle LFO for warmth
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime)
      lfoGain.gain.setValueAtTime(freq.frequency * 0.002, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()

      osc.connect(gain)
      osc.start()

      let osc2 = null
      // Binaural beat: second oscillator with offset
      if (freq.binauralOffset) {
        osc2 = ctx.createOscillator()
        osc2.type = freq.waveform || 'sine'
        osc2.frequency.setValueAtTime(freq.frequency + freq.binauralOffset, ctx.currentTime)

        // Pan: left ear = base, right ear = base + offset
        const panL = ctx.createStereoPanner()
        const panR = ctx.createStereoPanner()
        panL.pan.setValueAtTime(-1, ctx.currentTime)
        panR.pan.setValueAtTime(1, ctx.currentTime)

        osc.disconnect()
        osc.connect(panL).connect(gain)
        osc2.connect(panR).connect(gain)
        osc2.start()
      }

      tracksRef.current[freq.id] = { osc, osc2, gain, lfo, lfoGain }
      setCurrentId(freq.id)
      setPlayingIds(prev => [...prev, freq.id])
      startTimeRef.current = Date.now()
      setElapsed(0)
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      console.error('FrequencyPlayer error:', err)
    }
  }, [stopOne])

  // Cleanup on unmount
  useEffect(() => () => { stopAll() }, [stopAll])

  const playing = playingIds.length > 0

  return { play, stopOne, stopAll, playing, playingIds, currentId, elapsed }
}

/* ─── Format time ───────────────────────────────────────────────────────────── */
function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ─── Visualizer canvas ─────────────────────────────────────────────────────── */
function FrequencyVisualizer({ playing, frequency, color }) {
  const canvasRef = useRef(null)
  const animRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let w, h

    function resize() {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    let t = 0
    function draw() {
      t += 0.02
      ctx.clearRect(0, 0, w, h)

      if (playing) {
        // Active waveform
        const waves = 3
        for (let wave = 0; wave < waves; wave++) {
          const opacity = 0.3 - wave * 0.08
          const amp = (h * 0.3) - wave * 8
          const freq = (frequency || 440) / 200 + wave * 0.3

          ctx.beginPath()
          ctx.strokeStyle = color + Math.round(opacity * 255).toString(16).padStart(2, '0')
          ctx.lineWidth = 2 - wave * 0.5

          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin((x / w) * Math.PI * freq * 2 + t * (3 - wave)) * amp * Math.sin((x / w) * Math.PI)
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        // Center glow
        const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4)
        glow.addColorStop(0, color + '08')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      } else {
        // Idle state — subtle pulse
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(201,168,76,0.08)'
        ctx.lineWidth = 1
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + t) * 3
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, frequency, color])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  heading: {
    fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, letterSpacing: '.18em',
    color: 'var(--foreground)', marginBottom: 4,
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

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function FrequencyDetail() {
  const { play, stopOne, stopAll, playing, playingIds, currentId, elapsed } = useFrequencyPlayer()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const recommended = useMemo(() => getRecommendedFrequencies(), [])

  const filteredFrequencies = useMemo(() => {
    let list = activeCategory === 'all' ? FREQUENCIES : FREQUENCIES.filter(f => f.category === activeCategory)
    if (search.trim()) list = searchFrequencies(search)
    return list
  }, [activeCategory, search])

  const currentFreq = currentId ? FREQUENCIES.find(f => f.id === currentId) : null
  const currentCat = currentFreq ? FREQUENCY_CATEGORIES.find(c => c.id === currentFreq.category) : null
  const currentColor = currentCat?.color || '#c9a84c'
  const activeCount = playingIds.length

  return (
    <div style={S.panel}>
      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.heading}>{'\u266B'} Frequency</div>
          <AboutSystemButton systemName="Frequency" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeCount > 0 && (
            <button
              onClick={stopAll}
              style={{
                padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em',
                textTransform: 'uppercase',
                background: 'rgba(220,60,60,.12)', border: '1px solid rgba(220,60,60,.3)',
                color: '#dc4444', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {'\u25A0'} Stop All ({activeCount})
            </button>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Therapeutic sound frequencies — solfeggio, binaural beats, planetary tones, chakra alignment
        </div>
      </div>

      {/* NOW PLAYING / VISUALIZER */}
      <div style={{
        ...S.glass, padding: 0, overflow: 'hidden',
        height: playing ? 200 : 100, position: 'relative',
        transition: 'height .3s ease',
        borderColor: playing ? currentColor + '30' : 'var(--border)',
      }}>
        <FrequencyVisualizer playing={playing} frequency={currentFreq?.frequency} color={currentColor} />
        {playing && currentFreq && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 20px',
            background: 'linear-gradient(transparent, rgba(0,0,0,.6))',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button
              onClick={() => stopOne(currentFreq.id)}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: `2px solid ${currentColor}`,
                background: 'rgba(0,0,0,.4)', color: currentColor,
                fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{'\u25A0'}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: '.08em', color: currentColor }}>
                {currentFreq.name}
                {activeCount > 1 && (
                  <span style={{ fontSize: 9, color: 'var(--muted-foreground)', marginLeft: 8 }}>
                    +{activeCount - 1} more playing
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--muted-foreground)' }}>
                {currentFreq.benefit}
              </div>
            </div>
            <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 14, color: currentColor }}>
              {fmtTime(elapsed)} / {fmtTime(currentFreq.duration)}
            </div>
            {currentFreq.binauralOffset && (
              <div style={{
                padding: '2px 8px', borderRadius: 8, fontSize: 9,
                fontFamily: "'Inconsolata',monospace",
                background: 'rgba(80,180,220,.1)', border: '1px solid rgba(80,180,220,.2)', color: '#50b4dc',
              }}>
                {'\u{1F3A7}'} Headphones required
              </div>
            )}
          </div>
        )}
        {!playing && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', opacity: .4,
          }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase' }}>
              Select a frequency to begin
            </div>
          </div>
        )}
      </div>

      {/* RECOMMENDED */}
      <div>
        <div style={S.sectionTitle}>Recommended for You</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recommended.slice(0, 4).map(freq => {
            const cat = FREQUENCY_CATEGORIES.find(c => c.id === freq.category)
            const color = cat?.color || '#c9a84c'
            const isPlaying = playingIds.includes(freq.id)
            return (
              <div
                key={freq.id}
                onClick={() => play(freq)}
                style={{
                  flex: '1 1 200px', padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  background: isPlaying ? color + '10' : 'rgba(255,255,255,.02)',
                  border: `1px solid ${isPlaying ? color + '40' : 'var(--border)'}`,
                  transition: 'all .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{isPlaying ? '\u25A0' : '\u25B6'}</span>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '.08em', color }}>{freq.name}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{freq.benefit}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div>
        <div style={S.sectionTitle}>Library</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
              background: activeCategory === 'all' ? 'rgba(201,168,76,.15)' : 'var(--card)',
              color: activeCategory === 'all' ? '#c9a84c' : 'var(--muted-foreground)',
              border: activeCategory === 'all' ? '1px solid rgba(201,168,76,.3)' : '1px solid var(--border)',
            }}
          >All ({FREQUENCIES.length})</button>
          {FREQUENCY_CATEGORIES.map(cat => {
            const count = FREQUENCIES.filter(f => f.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
                  background: activeCategory === cat.id ? cat.color + '15' : 'var(--card)',
                  color: activeCategory === cat.id ? cat.color : 'var(--muted-foreground)',
                  border: activeCategory === cat.id ? `1px solid ${cat.color}30` : '1px solid var(--border)',
                }}
              >{cat.icon} {cat.label} ({count})</button>
            )
          })}
        </div>

        {/* SEARCH */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search frequencies..."
          style={{
            width: '100%', padding: '8px 14px', borderRadius: 8,
            background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)',
            color: 'var(--foreground)', fontFamily: "'Inconsolata',monospace", fontSize: 12,
            outline: 'none', marginBottom: 12,
          }}
        />

        {/* FREQUENCY CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredFrequencies.map(freq => {
            const cat = FREQUENCY_CATEGORIES.find(c => c.id === freq.category)
            const color = cat?.color || '#c9a84c'
            const isPlaying = playingIds.includes(freq.id)
            const isExpanded = expandedId === freq.id

            return (
              <div
                key={freq.id}
                style={{
                  borderRadius: 10, overflow: 'hidden',
                  background: isPlaying ? color + '08' : 'rgba(255,255,255,.01)',
                  border: `1px solid ${isPlaying ? color + '30' : 'rgba(255,255,255,.05)'}`,
                  transition: 'all .2s',
                }}
              >
                {/* Main row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : freq.id)}
                >
                  {/* Play/Stop button */}
                  <button
                    onClick={e => { e.stopPropagation(); play(freq) }}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${color}60`,
                      background: isPlaying ? color + '15' : 'transparent',
                      color, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                    }}
                  >
                    {isPlaying ? '\u25A0' : '\u25B6'}
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: '.06em', color: isPlaying ? color : 'var(--foreground)' }}>
                      {freq.name}
                    </div>
                    <div style={{ fontFamily: "'Inconsolata',monospace", fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {freq.benefit}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {freq.binauralOffset && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6, fontSize: 8,
                        fontFamily: "'Inconsolata',monospace",
                        background: '#50b4dc10', border: '1px solid #50b4dc20', color: '#50b4dc',
                      }}>{'\u{1F3A7}'}</span>
                    )}
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 8,
                      fontFamily: "'Inconsolata',monospace",
                      background: color + '10', border: '1px solid ' + color + '20', color,
                    }}>{freq.frequency} Hz</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 8,
                      fontFamily: "'Inconsolata',monospace",
                      background: 'var(--card)', border: '1px solid var(--border)',
                      color: 'var(--muted-foreground)',
                    }}>{fmtTime(freq.duration)}</span>
                  </div>

                  {/* Expand arrow */}
                  <span style={{ fontSize: 10, opacity: .3, transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                    {'\u25BC'}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 14px 64px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                      {freq.description}
                    </div>
                    <div style={{
                      fontSize: 11, color: 'rgba(201,168,76,.6)', fontStyle: 'italic',
                      padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(201,168,76,.03)', border: '1px solid rgba(201,168,76,.08)',
                    }}>
                      Research: {freq.research}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {freq.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '2px 8px', borderRadius: 8, fontSize: 9,
                          fontFamily: "'Inconsolata',monospace",
                          background: 'var(--card)', border: '1px solid var(--border)',
                          color: 'var(--muted-foreground)', cursor: 'pointer',
                        }} onClick={() => setSearch(tag)}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* USAGE GUIDE */}
      <div>
        <div style={S.sectionTitle}>How to Use</div>
        <div style={{
          fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic',
          padding: '14px 18px', borderRadius: 10,
          background: 'var(--accent)', border: '1px solid var(--border)',
        }}>
          Frequencies work through entrainment — your brain naturally synchronizes with external rhythmic stimuli.
          For best results: use quality headphones (essential for binaural beats), find a quiet space,
          close your eyes, and listen for at least 10 minutes. Solfeggio tones work without headphones.
          Planetary frequencies are best used during meditation. Consistency matters more than duration.
          You can layer multiple frequencies simultaneously for richer soundscapes.
          <div style={{ marginTop: 10, color: 'var(--foreground)', fontStyle: 'normal', fontSize: 11 }}>
            Note: Sound therapy is complementary and not a substitute for medical treatment.
          </div>
        </div>
      </div>
    </div>
  )
}
