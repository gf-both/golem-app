import { useState, useMemo } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import {
  SYNC_CATEGORIES, NUMBER_MEANINGS,
  detectNumbers, analyzeSyncPatterns, buildThreads,
  createSyncEntry,
} from '../../engines/synchronicityEngine'
import SyncCanvas from '../canvas/SyncCanvas'
import AboutSystemButton from '../ui/AboutSystemButton'

/* ── Shared styles ────────────────────────────────────────────────────────── */
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
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box',
    background: 'var(--secondary)', border: '1px solid var(--border)',
    color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 8, boxSizing: 'border-box',
    background: 'var(--secondary)', border: '1px solid var(--border)',
    color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
    resize: 'vertical', minHeight: 120, outline: 'none', lineHeight: 1.7,
  },
  row: (highlight) => ({
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
    borderRadius: 10, cursor: 'pointer', transition: 'background .15s',
    background: highlight ? 'var(--accent)' : 'var(--secondary)',
    border: `1px solid ${highlight ? 'rgba(201,168,76,.25)' : 'var(--border)'}`,
  }),
  badge: (color) => ({
    display: 'inline-block', padding: '2px 9px', borderRadius: 10, flexShrink: 0,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase',
    background: color + '20', border: `1px solid ${color}44`, color,
  }),
  btn: (active, color = '#b8860b') => ({
    padding: '10px 22px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
    fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
    background: active ? color : '#1a1a2e',
    border: `2px solid ${active ? color : '#444'}`,
    color: active ? '#fff' : '#999', transition: 'all .15s',
    boxShadow: active ? `0 0 14px ${color}55` : 'none',
  }),
}

/* ── Intensity stars ───────────────────────────────────────────────────────── */
function IntensityStars({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{ cursor: onChange ? 'pointer' : 'default', fontSize: 12,
            color: n <= value ? '#c9a84c' : 'var(--border)', transition: 'color .15s' }}
        >✦</span>
      ))}
    </div>
  )
}

/* ── Category picker ───────────────────────────────────────────────────────── */
function CategoryPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {Object.entries(SYNC_CATEGORIES).map(([key, cat]) => (
        <div
          key={key}
          onClick={() => onChange?.(key)}
          style={{
            padding: '5px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all .15s',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
            background: value === key ? cat.color + '25' : 'var(--secondary)',
            border: `1px solid ${value === key ? cat.color + '66' : 'var(--border)'}`,
            color: value === key ? cat.color : 'var(--muted-foreground)',
          }}
        >{cat.emoji} {cat.label}</div>
      ))}
    </div>
  )
}

/* ── Number badge ──────────────────────────────────────────────────────────── */
function NumberBadge({ num, large }) {
  const info = NUMBER_MEANINGS[num]
  const [open, setOpen] = useState(false)
  const color = info?.color || '#c9a84c'
  if (large) return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'all .2s',
        background: open ? color + '15' : 'var(--secondary)',
        border: `1px solid ${open ? color + '44' : 'var(--border)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color, letterSpacing: '.1em' }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: color + 'cc', letterSpacing: '.1em' }}>
            {info ? 'SACRED NUMBER' : 'REPEATING PATTERN'}
          </div>
        </div>
        <span style={{ fontSize: 9, color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && info && (
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          {info.meaning}
        </p>
      )}
      {open && !info && (
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          A repeating pattern carrying personal significance. Meditate on what this number means to you — numerological meaning is ultimately subjective.
        </p>
      )}
    </div>
  )
  return (
    <span
      title={info?.meaning}
      style={{
        padding: '2px 10px', borderRadius: 10,
        fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.12em',
        background: color + '20', border: `1px solid ${color}44`, color,
        cursor: info ? 'help' : 'default',
      }}
    >{num}</span>
  )
}

/* ── Entry form ────────────────────────────────────────────────────────────── */
function EntryForm({ initial, allSyncs, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || today)
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || 'other')
  const [intensity, setIntensity] = useState(initial?.intensity || 3)
  const [linked, setLinked] = useState(initial?.linked || [])

  const detectedNumbers = useMemo(() => detectNumbers(description), [description])
  const cat = SYNC_CATEGORIES[category]

  function toggleLink(id) {
    setLinked(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id])
  }

  function handleSave() {
    if (!description.trim()) return
    const entry = {
      id: initial?.id || Date.now(),
      date,
      title: title.trim() || 'Untitled Synchronicity',
      description,
      category,
      intensity,
      numbers: detectedNumbers,
      linked,
      tags: [],
      moonPhase: moonName(date),
      moonEmoji: moonEmoji(date),
    }
    onSave(entry)
  }

  const otherSyncs = allSyncs.filter(s => s.id !== initial?.id).slice(0, 12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Name this synchronicity…"
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
        placeholder="Describe exactly what happened — the context, the feeling of charged meaning, what you were thinking about beforehand, and what the coincidence was…"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      {/* Auto-detected numbers */}
      {detectedNumbers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>NUMBERS DETECTED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {detectedNumbers.map(n => <NumberBadge key={n} num={n} />)}
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>CATEGORY</div>
        <CategoryPicker value={category} onChange={setCategory} />
        {cat && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {cat.description}
          </div>
        )}
      </div>

      {/* Intensity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>INTENSITY</div>
        <IntensityStars value={intensity} onChange={setIntensity} />
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          {['', 'mild', 'notable', 'striking', 'profound', 'overwhelming'][intensity]}
        </span>
      </div>

      {/* Link to related synchronicities */}
      {otherSyncs.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: '.1em' }}>
            LINK TO RELATED SYNCHRONICITIES (builds threads)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {otherSyncs.map(s => {
              const isLinked = linked.includes(s.id)
              const c = SYNC_CATEGORIES[s.category]?.color || '#888'
              return (
                <div
                  key={s.id}
                  onClick={() => toggleLink(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                    borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                    background: isLinked ? c + '15' : 'var(--secondary)',
                    border: `1px solid ${isLinked ? c + '44' : 'var(--border)'}`,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLinked ? c : 'var(--border)', transition: 'background .15s' }} />
                  <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{s.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>{s.date}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => { if (description.trim()) handleSave() }}
          style={{
            padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontFamily: "'Cinzel', serif", fontWeight: 700,
            letterSpacing: '.14em', textTransform: 'uppercase',
            background: 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
            border: '2px solid rgba(201,168,76,.8)',
            color: '#fff',
            opacity: description.trim() ? 1 : 0.5,
            transition: 'all .2s', position: 'relative', zIndex: 2,
            boxShadow: '0 2px 12px rgba(201,168,76,.25)',
          }}
        >
          {initial ? '✦ Update' : '✦ Record Synchronicity'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontFamily: "'Cinzel', serif", fontWeight: 600,
              letterSpacing: '.12em', textTransform: 'uppercase',
              background: 'var(--secondary)', border: '1px solid var(--border)',
              color: 'var(--muted-foreground)', transition: 'all .15s',
            }}
          >Cancel</button>
        )}
      </div>
    </div>
  )
}

/* ── Entry view ────────────────────────────────────────────────────────────── */
function EntryView({ entry, allSyncs, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const cat = SYNC_CATEGORIES[entry.category] || SYNC_CATEGORIES.other
  const linkedEntries = allSyncs.filter(s => entry.linked?.includes(s.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, letterSpacing: '.12em', color: cat.color, marginBottom: 6 }}>
            {cat.emoji} {entry.title}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{entry.date}</span>
            <span style={{ fontSize: 11 }}>{entry.moonEmoji} {entry.moonPhase}</span>
            <IntensityStars value={entry.intensity} />
            <span style={S.badge(cat.color)}>{cat.label}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ ...S.btn(false), padding: '8px 18px' }}>Edit</button>
          {!confirm
            ? <button onClick={() => setConfirm(true)} style={{ ...S.btn(false), padding: '8px 18px', color: '#cc4455', borderColor: '#cc445566' }}>Delete</button>
            : <button onClick={onDelete} style={{ ...S.btn(true, '#cc4455'), padding: '8px 18px' }}>Confirm?</button>
          }
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--foreground)', padding: '16px 18px', borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', fontStyle: 'italic' }}>
        {entry.description}
      </div>

      {/* Number meanings */}
      {entry.numbers?.length > 0 && (
        <div>
          <div style={S.sectionTitle}>NUMBERS · SACRED MEANINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entry.numbers.map(n => <NumberBadge key={n} num={n} large />)}
          </div>
        </div>
      )}

      {/* Category interpretation */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: cat.color + '10', border: `1px solid ${cat.color}30` }}>
        <div style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '.12em', color: cat.color, marginBottom: 6 }}>
          {cat.emoji} {cat.label.toUpperCase()} · JUNGIAN LAYER
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.7, fontStyle: 'italic' }}>{cat.description}</div>
      </div>

      {/* Linked synchronicities */}
      {linkedEntries.length > 0 && (
        <div>
          <div style={S.sectionTitle}>THREAD · LINKED SYNCHRONICITIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {linkedEntries.map(s => {
              const lcat = SYNC_CATEGORIES[s.category] || SYNC_CATEGORIES.other
              return (
                <div key={s.id} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: lcat.color }}>{lcat.emoji}</span>
                  <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{s.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>{s.date}</span>
                  <IntensityStars value={s.intensity} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Threads panel ─────────────────────────────────────────────────────────── */
function ThreadsPanel({ syncs }) {
  const threads = useMemo(() => buildThreads(syncs), [syncs])
  if (threads.length === 0) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.8 }}>
      No threads yet. Link synchronicities when recording them to weave narrative arcs.<br />
      <span style={{ fontSize: 11 }}>Threads reveal recurring messages the universe is sending you.</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {threads.map((thread, ti) => {
        const cats = [...new Set(thread.map(s => s.category))]
        const primary = SYNC_CATEGORIES[cats[0]] || SYNC_CATEGORIES.other
        return (
          <div key={ti} style={{ borderRadius: 12, border: `1px solid ${primary.color}33`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: primary.color + '12', borderBottom: `1px solid ${primary.color}22` }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.15em', color: primary.color }}>
                THREAD · {thread.length} SYNCHRONICITIES
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                {thread[0].date} → {thread[thread.length - 1].date}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {thread.map((s, i) => {
                const cat = SYNC_CATEGORIES[s.category] || SYNC_CATEGORIES.other
                return (
                  <div key={s.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: i < thread.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      {i < thread.length - 1 && <div style={{ width: 1, height: 24, background: cat.color + '44', marginTop: 2 }} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: 'var(--foreground)', letterSpacing: '.08em' }}>{s.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{s.date} · {cat.emoji} {cat.label}</div>
                    </div>
                    <IntensityStars value={s.intensity} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Patterns panel ────────────────────────────────────────────────────────── */
function PatternsPanel({ syncs }) {
  const patterns = useMemo(() => analyzeSyncPatterns(syncs), [syncs])
  if (!patterns) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, fontStyle: 'italic' }}>
      Record your first synchronicity to begin pattern analysis.
    </div>
  )
  const topCatData = patterns.topCat ? SYNC_CATEGORIES[patterns.topCat] : null
  const maxWeek = Math.max(...patterns.weeklyDensity, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Logged', value: patterns.total, color: '#c9a84c' },
          { label: 'Avg Intensity', value: patterns.avgIntensity + '★', color: '#a070e0' },
          { label: 'Threads', value: patterns.threads.length, color: '#66cccc' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 9, color: 'var(--muted-foreground)', fontFamily: "'Cinzel', serif", letterSpacing: '.1em', marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly density bar chart */}
      <div>
        <div style={S.sectionTitle}>SYNCHRONICITY DENSITY · LAST 4 WEEKS</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 48 }}>
          {patterns.weeklyDensity.map((count, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: '100%', borderRadius: 3, transition: 'height .3s',
                height: Math.max(3, (count / maxWeek) * 40),
                background: i === 3 ? 'rgba(201,168,76,.7)' : 'rgba(130,90,220,.45)',
              }} />
              <div style={{ fontSize: 8, color: 'var(--muted-foreground)' }}>{['−4w', '−3w', '−2w', 'now'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <div style={S.sectionTitle}>BY CATEGORY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(patterns.catCount).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
            const cat = SYNC_CATEGORIES[key] || SYNC_CATEGORIES.other
            const pct = Math.round((count / patterns.total) * 100)
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, textAlign: 'center', fontSize: 13 }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontFamily: "'Cinzel', serif", color: cat.color, letterSpacing: '.08em' }}>{cat.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{count}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cat.color + 'bb', borderRadius: 2, transition: 'width .4s' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Peak moon */}
      {patterns.peakMoon && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(80,60,150,.1)', border: '1px solid rgba(130,90,220,.2)' }}>
          <div style={{ fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '.12em', color: 'rgba(160,120,255,.8)', marginBottom: 4 }}>PEAK SYNCHRONICITY MOON</div>
          <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{patterns.peakMoon}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>The field is most active for you under this phase.</div>
        </div>
      )}

      {/* Top numbers */}
      {patterns.topNumbers.length > 0 && (
        <div>
          <div style={S.sectionTitle}>RECURRING NUMBERS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {patterns.topNumbers.map(([num, count]) => (
              <div key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <NumberBadge num={num} />
                <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Numbers library panel ─────────────────────────────────────────────────── */
function NumbersPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 4 }}>
        Sacred number sequences and their meanings — from Pythagorean numerology, angel number traditions, and the mystical grammar of repeating patterns.
      </div>
      {Object.entries(NUMBER_MEANINGS).map(([num, info]) => (
        <NumberBadge key={num} num={num} large />
      ))}
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function SyncDetail() {
  const syncs = useGolemStore(s => s.syncs)
  const addSync = useGolemStore(s => s.addSync)
  const updateSync = useGolemStore(s => s.updateSync)
  const deleteSync = useGolemStore(s => s.deleteSync)

  const [tab, setTab] = useState('log')
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [formKey, setFormKey] = useState(0) // forces EntryForm remount on each "new"

  const sorted = useMemo(() => [...syncs].sort((a, b) => b.date.localeCompare(a.date)), [syncs])

  function handleSave(entry) {
    const isEdit = selected && view === 'edit'
    if (isEdit) {
      updateSync(entry.id, entry)
    } else {
      addSync(entry)
    }
    // Bidirectional linking — use fresh state from store for back-links
    if (entry.linked?.length > 0) {
      // Use setTimeout to ensure addSync has committed before reading state
      setTimeout(() => {
        const freshSyncs = useGolemStore.getState().syncs || []
        for (const linkedId of entry.linked) {
          const target = freshSyncs.find(s => s.id === linkedId)
          if (target && !(target.linked || []).includes(entry.id)) {
            updateSync(linkedId, { linked: [...(target.linked || []), entry.id] })
          }
        }
      }, 0)
    }
    setView('list'); setSelected(null)
  }

  function handleDelete() {
    if (selected) { deleteSync(selected.id); setSelected(null); setView('list') }
  }

  const TAB = (id, label) => (
    <button
      key={id}
      onClick={() => { setTab(id); setView('list'); setSelected(null) }}
      style={S.btn(tab === id)}
    >{label}</button>
  )

  return (
    <div style={S.panel}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: '.18em', color: 'var(--foreground)', marginBottom: 4 }}>
            SYNCHRONICITY LOG
          </div>
          <AboutSystemButton systemName="Synchronicities" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          Jung called them acausal connecting principles — events with no causal link yet an undeniable meaning. Log what you notice. The patterns will speak.
        </div>
      </div>

      {/* Constellation preview */}
      {syncs.length > 0 && (
        <div style={{ height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <SyncCanvas syncs={syncs} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TAB('log', 'Log')}
        {TAB('threads', 'Threads')}
        {TAB('patterns', 'Patterns')}
        {TAB('numbers', 'Number Library')}
      </div>

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <>
          {view === 'list' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setFormKey(k => k + 1); setView('new') }}
                style={{
                  padding: '11px 24px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 12, fontFamily: "'Cinzel', serif", fontWeight: 700,
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, rgba(201,168,76,.4), rgba(201,168,76,.2))',
                  border: '2px solid rgba(201,168,76,.7)',
                  color: '#fff', transition: 'all .2s',
                  boxShadow: '0 2px 12px rgba(201,168,76,.2)',
                }}
              >+ Record Synchronicity</button>
            </div>
          )}
          {view === 'new' && (
            <div>
              <div style={S.sectionTitle}>NEW SYNCHRONICITY</div>
              <EntryForm key={formKey} allSyncs={syncs} onSave={handleSave} onCancel={() => setView('list')} />
            </div>
          )}
          {view === 'edit' && selected && (
            <div>
              <div style={S.sectionTitle}>EDIT</div>
              <EntryForm key={selected?.id} initial={selected} allSyncs={syncs} onSave={handleSave} onCancel={() => setView('view')} />
            </div>
          )}
          {view === 'view' && selected && (
            <div>
              <button onClick={() => { setView('list'); setSelected(null) }} style={{ ...S.btn(false), padding: '8px 18px', marginBottom: 14 }}>
                ← All Signs
              </button>
              <EntryView entry={selected} allSyncs={syncs} onEdit={() => setView('edit')} onDelete={handleDelete} />
            </div>
          )}
          {view === 'list' && (
            sorted.length === 0
              ? <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.8 }}>
                  No synchronicities logged yet.<br />
                  <span style={{ fontSize: 11 }}>The universe has always been speaking. Begin listening.</span>
                </div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sorted.map(s => {
                    const cat = SYNC_CATEGORIES[s.category] || SYNC_CATEGORIES.other
                    return (
                      <div key={s.id} style={S.row(false)} onClick={() => { setSelected(s); setView('view') }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.09em', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{s.date} · {cat.emoji} {cat.label}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {s.numbers?.length > 0 && <span style={{ ...S.badge('#c9a84c'), fontSize: 8 }}>{s.numbers[0]}</span>}
                          {s.linked?.length > 0 && <span style={{ ...S.badge('#66cccc'), fontSize: 8 }}>Thread</span>}
                          <IntensityStars value={s.intensity} />
                        </div>
                      </div>
                    )
                  })}
                </div>
          )}
        </>
      )}

      {tab === 'threads' && <><div style={S.sectionTitle}>NARRATIVE THREADS</div><ThreadsPanel syncs={syncs} /></>}
      {tab === 'patterns' && <><div style={S.sectionTitle}>PATTERN ANALYSIS</div><PatternsPanel syncs={syncs} /></>}
      {tab === 'numbers' && <><div style={S.sectionTitle}>SACRED NUMBER LIBRARY</div><NumbersPanel /></>}
    </div>
  )
}

// Local moon helper (avoids importing engine to keep bundle clean)
function moonName(dateStr) {
  const date = new Date(dateStr)
  const ref = new Date('2000-01-06T18:14:00Z')
  const n = (((date - ref) / (1000 * 60 * 60 * 24)) % 29.53058867 + 29.53058867) % 29.53058867 / 29.53058867
  if (n < 0.0625) return 'New Moon'
  if (n < 0.1875) return 'Waxing Crescent'
  if (n < 0.3125) return 'First Quarter'
  if (n < 0.4375) return 'Waxing Gibbous'
  if (n < 0.5625) return 'Full Moon'
  if (n < 0.6875) return 'Waning Gibbous'
  if (n < 0.8125) return 'Last Quarter'
  return 'Waning Crescent'
}
function moonEmoji(dateStr) {
  const m = moonName(dateStr)
  const map = { 'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓', 'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖', 'Last Quarter': '🌗', 'Waning Crescent': '🌘' }
  return map[m] || '🌑'
}
