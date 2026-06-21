import { useState, useMemo } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import {
  DREAM_SYMBOLS, DREAM_EMOTIONS,
  detectSymbols, analyzePatterns, getDreamStreak,
  getMoonPhaseForDate, createDreamEntry,
} from '../../engines/dreamEngine'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ── Shared styles ──────────────────────────────────────────────────────────── */
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
  row: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    borderRadius: 9, background: 'var(--secondary)', border: '1px solid var(--border)',
    cursor: 'pointer', transition: 'background .15s',
  },
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em',
    textTransform: 'uppercase', background: color + '20', border: `1px solid ${color}44`,
    color: color, flexShrink: 0,
  }),
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: 'var(--secondary)', border: '1px solid var(--border)',
    color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    background: 'var(--secondary)', border: '1px solid var(--border)',
    color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
    resize: 'vertical', minHeight: 140, outline: 'none', lineHeight: 1.7,
    boxSizing: 'border-box',
  },
  btn: (active, color = '#825aDc') => ({
    padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
    fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
    transition: 'all .15s',
    background: active ? color : '#1a1a2e',
    border: `2px solid ${active ? color : '#333'}`,
    color: active ? '#fff' : '#888',
    boxShadow: active ? `0 0 16px ${color}55` : 'none',
  }),
}

/* ── Vividness dots ─────────────────────────────────────────────────────────── */
function VividnessDots({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          onClick={() => onChange?.(n)}
          style={{
            width: 9, height: 9, borderRadius: '50%', cursor: onChange ? 'pointer' : 'default',
            background: n <= value ? 'rgba(160, 100, 255, 0.85)' : 'var(--border)',
            transition: 'background .15s',
          }}
        />
      ))}
    </div>
  )
}

/* ── Emotion pill selector ──────────────────────────────────────────────────── */
function EmotionPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {DREAM_EMOTIONS.map(e => (
        <div
          key={e.id}
          onClick={() => onChange?.(e.id)}
          style={{
            padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em',
            textTransform: 'uppercase', transition: 'all .15s',
            background: value === e.id ? e.color + '25' : 'var(--secondary)',
            border: `1px solid ${value === e.id ? e.color + '66' : 'var(--border)'}`,
            color: value === e.id ? e.color : 'var(--muted-foreground)',
          }}
        >
          {e.emoji} {e.label}
        </div>
      ))}
    </div>
  )
}

/* ── Single symbol card ─────────────────────────────────────────────────────── */
function SymbolCard({ symbolKey, count }) {
  const sym = DREAM_SYMBOLS[symbolKey]
  const [open, setOpen] = useState(false)
  if (!sym) return null
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        background: open ? sym.color + '12' : 'var(--secondary)',
        border: `1px solid ${open ? sym.color + '44' : 'var(--border)'}`,
        transition: 'all .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{sym.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.12em', color: sym.color }}>
            {sym.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '.08em' }}>
            {sym.archetype}
          </div>
        </div>
        {count > 0 && (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: sym.color + 'aa' }}>×{count}</span>
        )}
        <span style={{ fontSize: 9, color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', fontStyle: 'italic' }}>
            {sym.meaning}
          </p>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(120, 60, 60, .08)', border: '1px solid rgba(180, 80, 80, .15)' }}>
            <div style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '.1em', color: '#cc5566', marginBottom: 4 }}>SHADOW</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{sym.shadow}</div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: sym.color + '10', border: `1px solid ${sym.color}25` }}>
            <div style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '.1em', color: sym.color, marginBottom: 4 }}>INTEGRATION</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>{sym.integration}</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── New / Edit entry form ──────────────────────────────────────────────────── */
function EntryForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || today)
  const [content, setContent] = useState(initial?.content || '')
  const [emotion, setEmotion] = useState(initial?.emotion || 'peaceful')
  const [lucid, setLucid] = useState(initial?.lucid || false)
  const [vividness, setVividness] = useState(initial?.vividness || 3)

  const detectedSymbols = useMemo(() => detectSymbols(content), [content])
  const moon = getMoonPhaseForDate(date)

  function handleSave() {
    if (!content.trim()) return
    const entry = {
      id: initial?.id || Date.now(),
      date, title: title.trim() || 'Untitled Dream',
      content, emotion, lucid, vividness,
      symbols: detectedSymbols,
      moonPhase: moon.name,
      moonEmoji: moon.emoji,
    }
    onSave(entry)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Dream title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="date"
          style={{ ...S.input, width: 140 }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>
      <textarea
        style={S.textarea}
        placeholder="Describe your dream with as much detail as you can remember — people, places, feelings, symbols, colors, sensations…"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      {/* Auto-detected symbols */}
      {detectedSymbols.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>
            SYMBOLS DETECTED
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {detectedSymbols.map(k => {
              const sym = DREAM_SYMBOLS[k]
              return sym ? (
                <span key={k} style={S.badge(sym.color)}>
                  {sym.emoji} {sym.label}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Emotion */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>EMOTIONAL TONE</div>
        <EmotionPicker value={emotion} onChange={setEmotion} />
      </div>

      {/* Lucid + Vividness row */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            onClick={() => setLucid(l => !l)}
            style={{
              width: 32, height: 18, borderRadius: 9, cursor: 'pointer', transition: 'background .2s',
              background: lucid ? 'rgba(160, 100, 255, 0.5)' : 'var(--secondary)',
              border: `1px solid ${lucid ? 'rgba(160, 100, 255, 0.6)' : 'var(--border)'}`,
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: lucid ? 14 : 2,
              width: 12, height: 12, borderRadius: '50%',
              background: lucid ? 'rgba(200, 160, 255, 0.9)' : 'var(--muted-foreground)',
              transition: 'left .2s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: lucid ? 'rgba(160, 100, 255, 0.85)' : 'var(--muted-foreground)', fontFamily: "'Cinzel', serif", letterSpacing: '.08em', fontSize: 10 }}>
            Lucid
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: "'Cinzel', serif", letterSpacing: '.08em' }}>VIVIDNESS</span>
          <VividnessDots value={vividness} onChange={setVividness} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span>{moon.emoji}</span>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: "'Cinzel', serif" }}>{moon.name}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          style={{
            padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
            letterSpacing: '.14em', textTransform: 'uppercase',
            background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
            border: '2px solid rgba(201,168,76,.8)',
            color: '#fff',
            opacity: content.trim() ? 1 : 0.5,
            transition: 'all .2s', position: 'relative', zIndex: 2,
            boxShadow: '0 2px 12px rgba(201,168,76,.25)',
          }}
        >
          {initial ? "Update Entry" : "Save Dream"}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{
            padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
            fontSize: 12, fontFamily: '"Cinzel", serif', fontWeight: 600,
            letterSpacing: '.12em', textTransform: 'uppercase',
            background: 'var(--secondary)', border: '1px solid var(--border)',
            color: 'var(--muted-foreground)', transition: 'all .15s',
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Entry detail view ──────────────────────────────────────────────────────── */
function EntryView({ entry, onEdit, onDelete }) {
  const emotion = DREAM_EMOTIONS.find(e => e.id === entry.emotion)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, letterSpacing: '.12em', color: 'var(--foreground)', marginBottom: 4 }}>
            {entry.title}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{entry.date}</span>
            <span style={{ fontSize: 11 }}>{entry.moonEmoji} {entry.moonPhase}</span>
            {entry.lucid && <span style={{ ...S.badge('rgba(160, 100, 255, 1)') }}>Lucid</span>}
            {emotion && <span style={{ ...S.badge(emotion.color) }}>{emotion.emoji} {emotion.label}</span>}
            <VividnessDots value={entry.vividness} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ ...S.btn(false), padding: '5px 12px', fontSize: 10 }}>Edit</button>
          {!confirmDelete
            ? <button onClick={() => setConfirmDelete(true)} style={{ ...S.btn(false), padding: '5px 12px', fontSize: 10, color: '#cc4455', borderColor: '#cc445544' }}>Delete</button>
            : <button onClick={onDelete} style={{ ...S.btn(true, '#cc4455'), padding: '5px 12px', fontSize: 10 }}>Confirm?</button>
          }
        </div>
      </div>

      {/* Dream text */}
      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--foreground)', padding: '16px 18px', borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', fontStyle: 'italic' }}>
        {entry.content}
      </div>

      {/* Detected symbols */}
      {entry.symbols?.length > 0 && (
        <div>
          <div style={S.sectionTitle}>SYMBOLS IN THIS DREAM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entry.symbols.map(k => <SymbolCard key={k} symbolKey={k} count={0} />)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Pattern analysis panel ─────────────────────────────────────────────────── */
function PatternsPanel({ dreams }) {
  const patterns = useMemo(() => analyzePatterns(dreams), [dreams])
  const streak = useMemo(() => getDreamStreak(dreams), [dreams])

  if (!patterns) return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, fontStyle: 'italic' }}>
      Log your first dream to begin pattern analysis.
    </div>
  )

  const dominantEmotionData = patterns.dominantEmotion ? DREAM_EMOTIONS.find(e => e.id === patterns.dominantEmotion) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Dreams', value: patterns.totalDreams, color: 'rgba(160, 100, 255, .8)' },
          { label: 'Lucid', value: `${patterns.lucidRatio}%`, color: 'rgba(100, 200, 200, .8)' },
          { label: 'Streak', value: `${streak}d`, color: 'rgba(201, 168, 76, .8)' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)', fontFamily: "'Cinzel', serif", letterSpacing: '.1em', marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Dominant emotion */}
      {dominantEmotionData && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: dominantEmotionData.color + '10', border: `1px solid ${dominantEmotionData.color}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{dominantEmotionData.emoji}</span>
          <div>
            <div style={{ fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '.12em', color: dominantEmotionData.color, marginBottom: 2 }}>DOMINANT TONE</div>
            <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{dominantEmotionData.label}</div>
          </div>
        </div>
      )}

      {/* Top recurring symbols */}
      {patterns.topSymbols.length > 0 && (
        <div>
          <div style={S.sectionTitle}>RECURRING SYMBOLS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patterns.topSymbols.map(sym => <SymbolCard key={sym.key} symbolKey={sym.key} count={sym.count} />)}
          </div>
        </div>
      )}

      {/* Lunar peak */}
      {patterns.peakLucidMoon && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(100, 80, 200, .08)', border: '1px solid rgba(100, 80, 200, .2)' }}>
          <div style={{ fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '.12em', color: 'rgba(160, 120, 255, .8)', marginBottom: 4 }}>PEAK LUCID MOON</div>
          <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{patterns.peakLucidMoon}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>You dream most lucidly under this phase</div>
        </div>
      )}
    </div>
  )
}

/* ── Symbol Library browser ─────────────────────────────────────────────────── */
function SymbolLibrary() {
  const [search, setSearch] = useState('')
  const filtered = Object.entries(DREAM_SYMBOLS).filter(([, sym]) =>
    !search || sym.label.toLowerCase().includes(search.toLowerCase()) || sym.archetype.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        style={{ ...S.input, marginBottom: 4 }}
        placeholder="Search symbols…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filtered.map(([key]) => <SymbolCard key={key} symbolKey={key} count={0} />)}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function DreamDetail() {
  const dreams = useGolemStore(s => s.dreams)
  const addDream = useGolemStore(s => s.addDream)
  const updateDream = useGolemStore(s => s.updateDream)
  const deleteDream = useGolemStore(s => s.deleteDream)

  const [tab, setTab] = useState('journal')   // 'journal' | 'patterns' | 'library'
  const [view, setView] = useState('list')    // 'list' | 'new' | 'view' | 'edit'
  const [selected, setSelected] = useState(null)

  const sorted = useMemo(() => [...dreams].sort((a, b) => b.date.localeCompare(a.date)), [dreams])

  function handleSave(entry) {
    if (selected && view === 'edit') {
      updateDream(entry.id, entry)
    } else {
      addDream(entry)
    }
    setView('list')
    setSelected(null)
  }

  function handleDelete() {
    if (selected) {
      deleteDream(selected.id)
      setSelected(null)
      setView('list')
    }
  }

  const TAB_STYLE = (active) => ({
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 10,
    fontFamily: "'Cinzel', serif", letterSpacing: '.12em', textTransform: 'uppercase',
    background: active ? 'rgba(130, 90, 220, .18)' : 'transparent',
    border: `1px solid ${active ? 'rgba(130, 90, 220, .45)' : 'var(--border)'}`,
    color: active ? 'rgba(180, 140, 255, .9)' : 'var(--muted-foreground)',
    transition: 'all .15s',
  })

  return (
    <div style={S.panel}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: '.18em', color: 'var(--foreground)' }}>
            DREAM JOURNAL
          </div>
          <AboutSystemButton systemName="Dreams" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          Your dreams are the language of the unconscious. Record them, decode the symbols, and discover the patterns shaping your inner life.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'journal', label: 'Journal' },
          { id: 'patterns', label: 'Patterns' },
          { id: 'library', label: 'Symbol Library' },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setView('list'); setSelected(null) }} style={TAB_STYLE(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL TAB ── */}
      {tab === 'journal' && (
        <>
          {/* Action row */}
          {view === 'list' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setView("new")} style={{
                padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontFamily: '"Cinzel", serif', fontWeight: 700,
                letterSpacing: '.14em', textTransform: 'uppercase',
                background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
                border: '2px solid rgba(201,168,76,.8)',
                color: '#fff',
                transition: 'all .2s', position: 'relative', zIndex: 2,
                boxShadow: '0 2px 12px rgba(201,168,76,.25)',
              }}>
                + New Entry
              </button>
            </div>
          )}

          {/* New entry form */}
          {view === 'new' && (
            <div>
              <div style={S.sectionTitle}>NEW DREAM ENTRY</div>
              <EntryForm
                onSave={handleSave}
                onCancel={() => setView('list')}
              />
            </div>
          )}

          {/* Edit form */}
          {view === 'edit' && selected && (
            <div>
              <div style={S.sectionTitle}>EDIT ENTRY</div>
              <EntryForm
                initial={selected}
                onSave={handleSave}
                onCancel={() => setView('view')}
              />
            </div>
          )}

          {/* Entry view */}
          {view === 'view' && selected && (
            <div>
              <button
                onClick={() => { setView('list'); setSelected(null) }}
                style={{ ...S.btn(false), padding: '5px 12px', fontSize: 10, marginBottom: 14 }}
              >
                ← All Dreams
              </button>
              <EntryView
                entry={selected}
                onEdit={() => setView('edit')}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Entry list */}
          {view === 'list' && (
            <>
              {sorted.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.8 }}>
                  Your dream journal is empty.<br />
                  <span style={{ fontSize: 11 }}>Begin by recording a dream — even fragments are meaningful.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sorted.map(entry => {
                    const emotion = DREAM_EMOTIONS.find(e => e.id === entry.emotion)
                    return (
                      <div
                        key={entry.id}
                        style={S.row}
                        onClick={() => { setSelected(entry); setView('view') }}
                      >
                        <div style={{ fontSize: 18, flexShrink: 0 }}>{entry.moonEmoji || '🌙'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.1em', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                            {entry.date} · {entry.moonPhase}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          {entry.lucid && <span style={S.badge('rgba(160, 100, 255, 1)')}>Lucid</span>}
                          {emotion && <span style={S.badge(emotion.color)}>{emotion.emoji}</span>}
                          <VividnessDots value={entry.vividness} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── PATTERNS TAB ── */}
      {tab === 'patterns' && (
        <>
          <div style={S.sectionTitle}>DREAM PATTERNS · ANALYSIS</div>
          <PatternsPanel dreams={dreams} />
        </>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <>
          <div style={S.sectionTitle}>JUNGIAN SYMBOL LIBRARY</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: 4 }}>
            20 archetypal symbols with shadow and integration guidance. Tap any symbol to expand its interpretation.
          </div>
          <SymbolLibrary />
        </>
      )}
    </div>
  )
}
