import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { generateConstellationConversation } from '../lib/constellationWatercooler'
import { loadThreads, addThreads, clearThreads } from '../lib/watercoolerStore'
import { useGolemStore } from '../store/useGolemStore'
import { computePersonData, useComputedPeople } from '../hooks/useActiveProfile'

// ── Relationship colors ──
const REL_COLORS = {
  partner: '#d43070', spouse: '#f0a03c', 'ex-spouse': '#b03050', 'ex-partner': '#b03050',
  mother: '#d43070', father: '#40ccdd', sibling: '#9050e0', child: '#60b030',
  grandparent: '#40ccdd', 'close-friend': '#6450ff', friend: '#8844ff',
  colleague: '#60a0c8', mentor: '#9050e0', 'business-partner': '#c9a84c',
  other: '#6b7280',
}
function getRelColor(rel) { return REL_COLORS[rel] || '#c9a84c' }

function buildGraphData(profiles, threads) {
  const convCounts = {}
  const edgeMap = {}
  const edgeTimestamps = {}
  profiles.forEach(p => { convCounts[String(p.id || p.name)] = 0 })
  threads.forEach(thread => {
    const participants = new Set()
    if (thread.participants) {
      thread.participants.forEach(p => {
        const key = String(p.id)
        if (convCounts[key] !== undefined) participants.add(key)
      })
    }
    thread.messages?.forEach(m => {
      const key = String(m.agentId || m.agent || '')
      if (convCounts[key] !== undefined) participants.add(key)
    })
    participants.forEach(id => { convCounts[id] = (convCounts[id] || 0) + 1 })
    const parts = [...participants]
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const key = [parts[i], parts[j]].sort().join('|')
        edgeMap[key] = (edgeMap[key] || 0) + 1
        edgeTimestamps[key] = thread.createdAt || Date.now()
      }
    }
  })
  const edges = Object.entries(edgeMap).map(([key, weight]) => {
    const [source, target] = key.split('|')
    return { source, target, weight, timestamp: edgeTimestamps[key] }
  })
  return { convCounts, edges }
}

function findTopConnected(profiles, edges, n = 3) {
  const counts = {}
  profiles.forEach(p => { counts[String(p.id || p.name)] = 0 })
  edges.forEach(e => {
    counts[e.source] = (counts[e.source] || 0) + e.weight
    counts[e.target] = (counts[e.target] || 0) + e.weight
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id)
}

// ── Enneagram data for year narratives ──
const ENNEA = {
  1: { name:'Reformer', shadow:'repressed anger expressed as relentless correction', gift:'moral integrity and a love that actually holds you to your best self', wound:'believing they are fundamentally flawed and must earn their place', relPattern:'holds partners to impossible standards while denying their own imperfections', yr1:'brings discipline and clarity — the bond feels principled and real', yr2:'criticism hardens into pattern; the partner feels perpetually evaluated, never enough', yr3:'if they soften into acceptance, the gift fully arrives: unmatched reliability and a love that sees you with clear eyes' },
  2: { name:'Helper', shadow:'hidden resentment fermenting beneath compulsive giving', gift:'unconditional warmth and the rare capacity to make someone feel truly held', wound:'believing they are only lovable when useful to others', relPattern:'creates invisible debts through giving, then collapses when those go unrecognized', yr1:'floods the bond with warmth and attentive presence — it feels like finally being held', yr2:'resentment begins leaking through: the giving was never free, it was a contract', yr3:'if they stop performing love and start receiving it, they become capable of genuine intimacy for the first time' },
  3: { name:'Achiever', shadow:'performing connection rather than inhabiting it', gift:'infectious inspiration and the capacity to make partners feel like their best selves', wound:'believing their value is entirely conditional on what they produce', relPattern:'optimizes the relationship like a project — efficient, impressive, emotionally absent', yr1:'shows up magnetic and high-functioning — the relationship accelerates beautifully', yr2:'the mask begins to slip; the partner wants the person, not the performance', yr3:'if they reveal themselves underneath the achievement, the gift arrives: someone who genuinely builds alongside you' },
  4: { name:'Individualist', shadow:'melancholy and the compulsion to be extraordinary rather than present', gift:'unmatched emotional depth and a presence that transforms everyone it truly touches', wound:'believing they are fundamentally different from others and therefore unlovable as they are', relPattern:'oscillates between longing for total union and retreating the moment it gets too close', yr1:'is intensely present when feeling seen — the depth feels like recognition no one else has offered', yr2:'the withdrawals deepen into a pattern the partner cannot navigate; closeness itself becomes the trigger', yr3:'if they risk being ordinary and loved anyway, they discover that belonging does not require being exceptional' },
  5: { name:'Investigator', shadow:'emotional withdrawal behind the fortress of the intellect', gift:'penetrating wisdom and a presence — when they choose to give it — that is unlike anything else', wound:'believing the world will always take more than they can regenerate', relPattern:'disappears — not from cruelty but from a private fear of being emptied by intimacy', yr1:'offers rare and precise intimacy in small doses that feel like treasure', yr2:'the distance becomes a wall; the partner cannot reach them when presence is needed most', yr3:'if they learn that being present does not drain them, they become one of the most devoted people alive' },
  6: { name:'Loyalist', shadow:'anxiety projected outward as perpetual doubt and unconscious testing', gift:'fierce, hard-won loyalty and a courage that emerges precisely when everything is at stake', wound:'believing that the support they need will always ultimately disappear', relPattern:'creates the very abandonment they fear by doubting until the partner finally breaks', yr1:'warm and fiercely committed once trust forms — though the testing begins almost immediately', yr2:'doubt escalates and becomes a distorting lens; they scan for betrayal that is not there', yr3:'if they find genuine safety and stay in it, they become unshakeable — the most loyal partner imaginable' },
  7: { name:'Enthusiast', shadow:'compulsive escape into possibility as a strategy for avoiding pain', gift:'expansive joy and the visionary capacity to make any future feel genuinely alive', wound:'believing that remaining in pain will annihilate them', relPattern:'leaves emotionally long before leaving physically — always one option away from the present', yr1:'intoxicating — the bond feels like adventure, possibility, and oxygen', yr2:'the lightness becomes avoidance; difficult truths are spun into plans rather than felt', yr3:'if they stay when it is painful, they discover a depth in themselves they did not know was possible' },
  8: { name:'Challenger', shadow:'domination used as armor to protect a profound and hidden tenderness', gift:'ferocious protectiveness and an uncompromising honesty that can forge something unbreakable', wound:'believing that softness will be weaponized against them the moment it is shown', relPattern:'overwhelms the field until the partner either breaks or earns a trust that then becomes absolute', yr1:'commands and protects simultaneously — the bond is magnetic and slightly destabilizing', yr2:'the intensity either forges an unbreakable alliance or crushes everything in its path', yr3:'if they let themselves be seen as tender, the full gift emerges: a fierce and devoted love like no other' },
  9: { name:'Peacemaker', shadow:'self-erasure performed as love, until there is no self left to give', gift:'a unifying presence that can hold all sides of a conflict without collapsing', wound:'believing their own needs and presence will disrupt or destroy everything', relPattern:'disappears into the relationship while slowly suffocating from the loss of themselves', yr1:'adapts perfectly — the bond feels easy, harmonious, effortless', yr2:'the erased self begins surfacing through passive resistance and unexplained distance', yr3:'if they reclaim their voice inside the bond, they become the rare partner who can love without consuming or being consumed' },
}

function buildYearNarrative(profiles, edges, year) {
  if (!year || !profiles.length) return null
  const allPairs = []
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      allPairs.push([profiles[i], profiles[j]])
    }
  }
  if (allPairs.length === 0) return null
  const seed = Math.floor(Date.now() / 60000)
  const pairIdx = (year + seed) % allPairs.length
  const [personA, personB] = allPairs[pairIdx]
  const An = personA.name?.split(' ')[0] || 'Person A'
  const Bn = personB.name?.split(' ')[0] || 'Person B'
  const isEx = ['ex-spouse','ex-partner'].includes(personA.rel) || ['ex-spouse','ex-partner'].includes(personB.rel)
  const Ae = ENNEA[personA.enneagramType]
  const Be = ENNEA[personB.enneagramType]
  const hasBoth = Ae && Be
  const Ahd = personA.hdType && personA.hdType !== '?' ? personA.hdType : null
  const Bhd = personB.hdType && personB.hdType !== '?' ? personB.hdType : null
  const hdLine = Ahd && Bhd ? ` Energetically: ${An} as a ${Ahd} meeting ${Bn} as a ${Bhd} — two different modes of moving through the world.` : Ahd ? ` ${An}'s ${Ahd} energy shapes how this dynamic moves.` : ''

  if (year === 1) {
    if (hasBoth) return `In the first year, ${An}'s ${Ae.name} pattern meets ${Bn}'s ${Be.name} shadow. ${An} ${Ae.yr1}. ${Bn} ${Be.yr1}. The field is still lit by projection — what they see in each other is more mirror than person. ${An}'s core wound (${Ae.wound}) has not yet been touched; ${Bn}'s (${Be.wound}) remains below the surface.${hdLine} The gift beginning to emerge between them: ${Ae.gift} in contact with ${Be.gift}.`
    return `In the first year, the bond between ${An} and ${Bn} is still building its grammar. What they offer each other has not yet been tested — the connection is real but has not yet met the real versions of each person.${hdLine}`
  }
  if (year === 2) {
    if (hasBoth) return `At two years, the shadow is no longer hidden. ${An}'s pattern — ${Ae.relPattern} — has become visible and legible to ${Bn}. ${Bn}'s pattern — ${Be.relPattern} — has done the same. ${An} ${Ae.yr2}. ${Bn} ${Be.yr2}. The wound at the center of the bond: ${An}'s ${Ae.wound} colliding with ${Bn}'s ${Be.wound}. This is the year most bonds either transform or dissolve — the question is whether both people can see their pattern clearly enough to choose differently.${isEx ? ' If this is where the bond ended, it was not failure — it was the pattern completing itself.' : ''}`
    return `At two years, the constellation has met the real. The version of ${Bn} that ${An} imagined has given way to the person who actually exists — with their shadows intact. What has been built is either structural or it is theater.${isEx ? ' If the bond ended here, it held its shape exactly as long as it was meant to.' : ''}`
  }
  if (year === 3) {
    if (hasBoth) {
      const transformA = `${An} has moved toward ${Ae.yr3}`
      const transformB = `${Bn} has moved toward ${Be.yr3}`
      const giftLine = isEx
        ? `What ${An} carries forward from contact with ${Bn}'s ${Be.shadow}: a deeper relationship with ${Ae.gift}. What the rupture taught: that the wound (${Ae.wound}) needed to be seen before it could be moved through.`
        : `${transformA}. ${transformB}. The gifts that required the wound to emerge — ${Ae.gift} and ${Be.gift} — are now legible to each other, perhaps for the first time.`
      return `At three years, the field has stabilized into truth. ${giftLine} Three years is long enough for the pattern to have been seen, resisted, surrendered to, or transformed. What remains — or what was released — is not what was easiest. It is what was most real.`
    }
    return `At three years, ${An}'s constellation has reached its true form. The bonds that endured are not circumstantial — they are structural. What was released made space. What remained proved itself.${isEx ? ` ${Bn}'s chapter is complete — not erased, but integrated.` : ` ${Bn} has become part of the permanent architecture.`}`
  }
  return null
}

// ── Styles ──
const S = {
  page: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--background, #0a0a0f)',
  },
  header: {
    padding: '20px 24px 0', flexShrink: 0,
  },
  titleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  title: {
    fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '.15em',
    textTransform: 'uppercase', color: 'var(--gold, #c9a84c)',
  },
  subtitle: {
    fontSize: 12, color: 'var(--muted-foreground, #888)', marginBottom: 14, lineHeight: 1.6,
  },
  // Participant chips
  chipRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center',
  },
  chip: (active, color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11,
    background: active ? `${color}18` : 'var(--secondary, #1a1a2e)',
    border: `1px solid ${active ? `${color}55` : 'var(--border, #333)'}`,
    color: active ? color : 'var(--muted-foreground, #888)',
    transition: 'all .15s', userSelect: 'none',
  }),
  chipCheck: { fontSize: 9, opacity: 0.7 },
  chipLabel: { maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // Source toggle
  sourceRow: {
    display: 'flex', gap: 6, marginBottom: 14,
  },
  sourceBtn: (active) => ({
    padding: '4px 14px', borderRadius: 14, fontSize: 10, letterSpacing: '.08em',
    cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
    background: active ? 'rgba(201,168,76,.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(201,168,76,.35)' : 'var(--border, #333)'}`,
    color: active ? '#c9a84c' : 'var(--muted-foreground, #666)',
    transition: 'all .15s',
  }),
  generateBtn: (disabled) => ({
    padding: '12px 28px', borderRadius: 10, fontSize: 13, letterSpacing: '.14em',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: '"Cinzel", serif', fontWeight: 700,
    textTransform: 'uppercase',
    background: disabled ? 'var(--secondary, #1a1a2e)' : 'linear-gradient(135deg, rgba(201,168,76,.45), rgba(201,168,76,.25))',
    border: `2px solid ${disabled ? 'var(--border, #333)' : 'rgba(201,168,76,.8)'}`,
    color: disabled ? 'var(--muted-foreground, #555)' : '#fff',
    transition: 'all .2s', position: 'relative', zIndex: 2,
    boxShadow: disabled ? 'none' : '0 2px 12px rgba(201,168,76,.25)',
  }),
  // Canvas / graph
  fishWrap: { position: 'relative', flex: 1, overflow: 'hidden', background: 'var(--background, #0a0a0f)' },
  fishCanvas: { width: '100%', height: '100%', display: 'block' },
  fishBottomRight: { position: 'absolute', bottom: 80, right: 18, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 5 },
  fishCtrlBtn: {
    width: 34, height: 34, border: '1px solid var(--border, #333)', borderRadius: 6,
    background: 'var(--card, rgba(20,20,30,0.9))', color: 'var(--foreground, #ccc)', fontSize: 16,
    cursor: 'pointer', fontFamily: 'monospace',
  },
  fishTimeline: { position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center' },
  fishTimelineTrack: { display: 'flex', gap: 6 },
  fishYearBtn: {
    padding: '7px 16px', border: '1px solid var(--border, #333)', borderRadius: 8,
    background: 'var(--card, rgba(20,20,30,0.9))', color: 'var(--muted-foreground, #888)', fontSize: 12,
    fontFamily: 'monospace', cursor: 'pointer',
  },
  fishYearBtnActive: { borderColor: '#c9a84c', color: '#c9a84c', background: 'rgba(201,168,76,0.1)' },
  fishSimulating: { marginTop: 6, color: '#c9a84c', fontSize: 11, fontFamily: 'monospace' },
  fishNarrative: {
    position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
    maxWidth: 560, padding: '10px 18px', background: 'var(--card, rgba(10,10,15,0.92))',
    border: '1px solid var(--border, #333)', borderRadius: 10, color: 'var(--muted-foreground, #bbb)', fontSize: 12,
    fontFamily: 'monospace', lineHeight: 1.5, textAlign: 'center', zIndex: 10,
  },
  fishTooltip: {
    position: 'fixed', padding: '9px 13px', background: 'var(--card, rgba(10,10,20,0.97))',
    border: '1px solid #c9a84c', borderRadius: 8, zIndex: 999, pointerEvents: 'none',
  },
  fishTooltipName: { color: 'var(--foreground, #e0e0e0)', fontSize: 12, fontWeight: 600 },
  fishTooltipRole: { color: '#9333ea', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  fishTooltipStat: { color: '#c9a84c', fontSize: 10, fontFamily: 'monospace', marginTop: 3 },
  statsRow: {
    position: 'absolute', top: 14, right: 18, zIndex: 10,
    display: 'flex', flexDirection: 'column', gap: 3,
    fontSize: 10, fontFamily: 'monospace', color: 'var(--muted-foreground, #666)',
  },
  emptyGraph: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 12, color: 'var(--muted-foreground, #888)', fontSize: 13, textAlign: 'center', padding: 40,
  },
}

// ── Extract conversation snippets for floating display ──
function extractSnippets(threads, maxSnippets = 8) {
  const snippets = []
  for (const thread of threads.slice(0, 10)) {
    if (!thread.messages) continue
    for (const msg of thread.messages) {
      if (msg.content && msg.content.length > 20 && msg.content.length < 200) {
        // Take meaningful short fragments
        const text = msg.content.length > 80 ? msg.content.slice(0, 77) + '...' : msg.content
        snippets.push({
          text,
          agent: msg.agent || msg.agentId || 'Unknown',
          agentId: String(msg.agentId || msg.agent || ''),
          timestamp: thread.createdAt || Date.now(),
        })
      }
    }
  }
  // Shuffle and limit
  return snippets.sort(() => Math.random() - 0.5).slice(0, maxSnippets)
}

// ── Graph view ──
function GraphView({ threads, profiles, year, setYear }) {
  const canvasRef = useRef(null)
  const nodesRef = useRef([])
  const edgesRef = useRef([])
  const animRef = useRef(null)
  const pausedRef = useRef(false)
  const scaleRef = useRef(1)
  const hoverRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const topRef = useRef([])
  const yearRef = useRef(0)
  const snippetsRef = useRef([])

  const [edgeCount, setEdgeCount] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [scale, setScale] = useState(1)
  const [showSnippets, setShowSnippets] = useState(true)
  const [panelPos, setPanelPos] = useState('bottom') // 'bottom' | 'top' | 'left'

  useEffect(() => {
    if (!profiles.length) return
    const { convCounts, edges } = buildGraphData(profiles, threads)
    setEdgeCount(edges.length)
    edgesRef.current = edges
    topRef.current = findTopConnected(profiles, edges)
    // Extract floating snippets from threads
    snippetsRef.current = extractSnippets(threads).map((snip, i) => ({
      ...snip,
      // Position snippets in a ring around the center with gentle float
      angle: (2 * Math.PI * i) / Math.max(1, extractSnippets(threads).length),
      radius: 140 + Math.random() * 100,
      floatPhase: Math.random() * Math.PI * 2,
      fadeIn: Math.random() * 200, // frame offset for staggered fade-in
      opacity: 0,
    }))
    const radius = 200
    nodesRef.current = profiles.map((p, i) => {
      const id = String(p.id || p.name)
      const angle = (2 * Math.PI * i) / profiles.length
      return {
        id, name: p.name, rel: p._isPrimary ? 'you' : (p.rel || 'other'), emoji: p.emoji || '✦',
        x: radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0, vy: 0,
        influence: Math.max(1, convCounts[id] || 1),
        color: p._isPrimary ? '#c9a84c' : getRelColor(p.rel),
        phase: Math.random() * Math.PI * 2,
      }
    })
  }, [threads, profiles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    function resize() {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    let frame = 0
    function tick() {
      animRef.current = requestAnimationFrame(tick)
      if (pausedRef.current) return
      frame++
      const W = canvas.width, H = canvas.height
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const s = scaleRef.current
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 700 / (dist * dist)
          const fx = (dx / dist) * force, fy = (dy / dist) * force
          nodes[i].vx -= fx; nodes[i].vy -= fy
          nodes[j].vx += fx; nodes[j].vy += fy
        }
      }
      const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
      edges.forEach(e => {
        const a = nodeMap[e.source], b = nodeMap[e.target]
        if (!a || !b) return
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = dist * 0.003 * e.weight
        a.vx += (dx / dist) * force; a.vy += (dy / dist) * force
        b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force
      })
      nodes.forEach(n => {
        n.vx -= n.x * 0.001; n.vy -= n.y * 0.001
        n.vx *= 0.9; n.vy *= 0.9
        n.x += n.vx; n.y += n.vy
        n.x += Math.sin(frame * 0.01 + n.phase) * 0.3
        n.y += Math.cos(frame * 0.013 + n.phase) * 0.2
      })
      const isDark = document.documentElement.classList.contains('dark')
      ctx.fillStyle = isDark ? '#0a0a0f' : '#f5f0e8'
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.scale(s, s)
      const now = Date.now()
      const yr = yearRef.current
      const ym = 1 + yr * 0.5
      edges.forEach(e => {
        const a = nodeMap[e.source], b = nodeMap[e.target]
        if (!a || !b) return
        const age = (now - (e.timestamp || now)) / (1000 * 60 * 60 * 24 * 30)
        const opacity = Math.max(0.07, Math.min(0.75, (0.45 - age * 0.05) * ym))
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        if (yr > 0) {
          // Dynamic projection: animated dashes + color shift per year
          const yearColors = ['', 'rgba(144,80,224,', 'rgba(212,48,112,', 'rgba(240,192,64,']
          ctx.strokeStyle = `${yearColors[yr] || yearColors[1]}${opacity})`
          ctx.setLineDash(yr >= 2 ? [8 + yr * 2, 4] : [])
          ctx.lineDashOffset = -frame * 0.3
        } else {
          ctx.strokeStyle = `rgba(201,168,76,${opacity})`
          ctx.setLineDash([])
        }
        ctx.lineWidth = Math.min(5, (0.4 + e.weight * 0.7) * (1 + yr * 0.3))
        ctx.stroke()
        ctx.setLineDash([])
      })
      const top3 = topRef.current
      nodes.forEach(n => {
        const r = Math.max(8, (5 + n.influence * 2.5) * Math.sqrt(ym))
        if (top3.includes(n.id)) {
          const glow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r * 2.8)
          glow.addColorStop(0, `${n.color}55`); glow.addColorStop(1, `${n.color}00`)
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.8, 0, Math.PI * 2)
          ctx.fillStyle = glow; ctx.fill()
        }
        // Dynamic projection: pulsing effect when projecting years
        if (yr > 0) {
          const pulse = Math.sin(frame * 0.03 + n.phase) * 0.3 + 0.7
          const projGlow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r * (1.5 + yr * 0.5))
          projGlow.addColorStop(0, `${n.color}${Math.round(pulse * 40).toString(16).padStart(2,'0')}`); projGlow.addColorStop(1, `${n.color}00`)
          ctx.beginPath(); ctx.arc(n.x, n.y, r * (1.5 + yr * 0.5), 0, Math.PI * 2)
          ctx.fillStyle = projGlow; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.color + 'cc'; ctx.fill()
        ctx.strokeStyle = n.color; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.fillStyle = isDark ? '#ddd' : '#333'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(n.name.split(' ')[0], n.x, n.y + r + 14)
      })

      // ── Floating conversation snippets ──
      const snips = showSnippetsRef.current ? snippetsRef.current : []
      if (snips.length > 0) {
        ctx.save()
        snips.forEach((snip, i) => {
          // Fade in staggered
          if (frame > snip.fadeIn) {
            snip.opacity = Math.min(0.55, snip.opacity + 0.003)
          }
          if (snip.opacity <= 0) return
          // Float gently
          const sx = snip.radius * Math.cos(snip.angle + frame * 0.001) + Math.sin(frame * 0.008 + snip.floatPhase) * 15
          const sy = snip.radius * Math.sin(snip.angle + frame * 0.001) + Math.cos(frame * 0.01 + snip.floatPhase) * 10
          // Cycle through snippets visibility (show 3-4 at a time)
          const cycle = Math.sin(frame * 0.005 + i * 1.2)
          const vis = snip.opacity * Math.max(0, cycle * 0.5 + 0.5)
          if (vis < 0.05) return
          ctx.globalAlpha = vis
          // Background pill
          const maxW = 160
          ctx.font = '9px monospace'
          const text = snip.text.length > 50 ? snip.text.slice(0, 47) + '...' : snip.text
          const tw = Math.min(maxW, ctx.measureText(text).width + 16)
          ctx.fillStyle = isDark ? 'rgba(10,10,20,0.85)' : 'rgba(245,240,232,0.85)'
          ctx.beginPath()
          const bx = sx - tw / 2, by = sy - 10
          ctx.roundRect(bx, by, tw, 22, 6)
          ctx.fill()
          ctx.strokeStyle = isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,140,80,0.15)'
          ctx.lineWidth = 0.5; ctx.stroke()
          // Text
          ctx.fillStyle = isDark ? 'rgba(200,200,200,0.7)' : 'rgba(60,60,60,0.7)'
          ctx.textAlign = 'center'
          ctx.fillText(text, sx, sy + 2)
          ctx.globalAlpha = 1
        })
        ctx.restore()
      }

      ctx.restore()
      const mx = (mouseRef.current.x - W / 2) / s
      const my = (mouseRef.current.y - H / 2) / s
      let hoveredNode = null
      for (const n of nodes) {
        const r = Math.max(8, 5 + n.influence * 2.5)
        const dx = mx - n.x, dy = my - n.y
        if (dx * dx + dy * dy < (r + 8) * (r + 8)) { hoveredNode = n; break }
      }
      hoverRef.current = hoveredNode
    }
    tick()
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect() }
  }, [])

  const showSnippetsRef = useRef(true)
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { yearRef.current = year }, [year])
  useEffect(() => { showSnippetsRef.current = showSnippets }, [showSnippets])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setTooltip(hoverRef.current ? { x: e.clientX, y: e.clientY, node: hoverRef.current } : null)
  }, [])

  if (!profiles.length) {
    return (
      <div style={S.emptyGraph}>
        <div style={{ fontSize: 32 }}>🐟</div>
        <div>Select participants above to populate the graph</div>
      </div>
    )
  }

  return (
    <div style={S.fishWrap}>
      <canvas ref={canvasRef} style={S.fishCanvas} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} />

      <div style={S.statsRow}>
        <span>{profiles.length} participants · {edgeCount} connections</span>
      </div>

      <div style={S.fishBottomRight}>
        <button style={S.fishCtrlBtn} onClick={() => setScale(s => Math.min(3, s + 0.2))} title="Zoom in">+</button>
        <button style={S.fishCtrlBtn} onClick={() => setScale(s => Math.max(0.3, s - 0.2))} title="Zoom out">−</button>
        <button style={S.fishCtrlBtn} onClick={() => setPaused(p => !p)} title={paused ? 'Play' : 'Pause'}>{paused ? '▶' : '⏸'}</button>
        <button style={{ ...S.fishCtrlBtn, fontSize: 11 }} onClick={() => setShowSnippets(s => !s)} title="Toggle conversation snippets">
          {showSnippets ? '💬' : '🔇'}
        </button>
        <button style={{ ...S.fishCtrlBtn, fontSize: 11 }} onClick={() => setPanelPos(p => p === 'bottom' ? 'top' : p === 'top' ? 'left' : 'bottom')} title="Move timeline panel">
          {panelPos === 'bottom' ? '⬇' : panelPos === 'top' ? '⬆' : '⬅'}
        </button>
      </div>

      <div style={{
        ...S.fishTimeline,
        ...(panelPos === 'top' ? { top: 14, bottom: 'auto' } : {}),
        ...(panelPos === 'left' ? { left: 18, bottom: 18, transform: 'none' } : {}),
      }}>
        <div style={S.fishTimelineTrack}>
          {['Now', '+1 yr', '+2 yr', '+3 yr'].map((label, i) => (
            <button key={i} style={{ ...S.fishYearBtn, ...(year === i ? S.fishYearBtnActive : {}) }} onClick={() => setYear(i)}>
              {label}
            </button>
          ))}
        </div>
        {year > 0 && <div style={S.fishSimulating}>◈ Projecting constellation evolution · {year} year{year > 1 ? 's' : ''} forward</div>}
      </div>

      {year > 0 && <div style={{
        ...S.fishNarrative,
        ...(panelPos === 'top' ? { bottom: 'auto', top: 60 } : {}),
        ...(panelPos === 'left' ? { left: 18, transform: 'none', bottom: 70, maxWidth: 320 } : {}),
      }}>{buildYearNarrative(profiles, edgesRef.current, year)}</div>}

      {tooltip && (
        <div style={{ ...S.fishTooltip, left: tooltip.x + 12, top: tooltip.y - 40 }}>
          <div style={S.fishTooltipName}>{tooltip.node.emoji} {tooltip.node.name}</div>
          <div style={S.fishTooltipRole}>{tooltip.node.rel}</div>
          <div style={S.fishTooltipStat}>Dialogues: {tooltip.node.influence}</div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──
export default function WatercoolerPage() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(0)
  const [source, setSource] = useState('constellation') // 'constellation' | 'dating'
  const [selectedIds, setSelectedIds] = useState(new Set()) // selected participant IDs
  const [initialized, setInitialized] = useState(false)

  const rawProfile = useGolemStore(s => s.primaryProfile)
  const primaryProfile = useMemo(() => computePersonData(rawProfile), [rawProfile?.dob, rawProfile?.tob, rawProfile?.birthLat, rawProfile?.birthLon, rawProfile?.birthTimezone, rawProfile?.name, rawProfile?.pob])
  const constellationPeople = useComputedPeople()

  // Dating golems — demo profiles for the dating network
  const datingGolems = useMemo(() => [
    { id: 'golem-4291', name: 'Golem #4291', emoji: '🔮', rel: 'match', sign: 'Scorpio', hdType: 'Projector', enneagramType: 5, _isDating: true },
    { id: 'golem-1887', name: 'Golem #1887', emoji: '🌙', rel: 'match', sign: 'Cancer', hdType: 'Generator', enneagramType: 2, _isDating: true },
    { id: 'golem-3102', name: 'Golem #3102', emoji: '⚡', rel: 'match', sign: 'Aries', hdType: 'Manifestor', enneagramType: 8, _isDating: true },
    { id: 'golem-2456', name: 'Golem #2456', emoji: '✧', rel: 'match', sign: 'Pisces', hdType: 'Reflector', enneagramType: 4, _isDating: true },
    { id: 'golem-5501', name: 'Golem #5501', emoji: '🌿', rel: 'match', sign: 'Taurus', hdType: 'Generator', enneagramType: 9, _isDating: true },
  ], [])

  const availablePeople = source === 'constellation' ? constellationPeople : datingGolems

  // Auto-select all on init / source change
  useEffect(() => {
    const ids = new Set(availablePeople.map(p => String(p.id || p.name)))
    setSelectedIds(ids)
    if (!initialized) setInitialized(true)
  }, [source, availablePeople.length])

  // Build active profiles from selection
  const activeProfiles = useMemo(() => {
    const selected = availablePeople.filter(p => selectedIds.has(String(p.id || p.name)))
    if (primaryProfile?.name) {
      return [{ ...primaryProfile, _isPrimary: true }, ...selected].filter(p => p.name)
    }
    return selected.filter(p => p.name)
  }, [primaryProfile, availablePeople, selectedIds])

  useEffect(() => { setThreads(loadThreads()) }, [])

  const toggleParticipant = (p) => {
    const id = String(p.id || p.name)
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(availablePeople.map(p => String(p.id || p.name))))
  const selectNone = () => setSelectedIds(new Set())

  const handleGenerate = useCallback(async () => {
    if (activeProfiles.length < 2) return
    setLoading(true)
    try {
      const convoThread = await generateConstellationConversation(activeProfiles)
      if (convoThread) {
        setThreads(prev => { const next = [convoThread, ...prev]; addThreads([convoThread]); return next })
      }
    } finally { setLoading(false) }
  }, [activeProfiles])

  const hasProfiles = primaryProfile?.dob

  if (!hasProfiles) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🐟</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold, #c9a84c)' }}>Fishbowl</div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', maxWidth: 400, lineHeight: 1.85 }}>
          Constellation graph that evolves over time. Select participants, generate golem dialogues, and project relationships 1–3 years forward. Add your birth date and people to begin.
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.titleRow}>
          <div style={S.title}>Fishbowl</div>
          <button
            style={S.generateBtn(loading || activeProfiles.length < 2)}
            onClick={handleGenerate}
            disabled={loading || activeProfiles.length < 2}
          >
            {loading ? 'Generating…' : 'Generate Dialogue'}
          </button>
        </div>
        <div style={S.subtitle}>
          Select participants from your constellation or dating golems. Generate dialogues to build the graph, then project relationships forward.
        </div>

        {/* Source toggle */}
        <div style={S.sourceRow}>
          <div style={S.sourceBtn(source === 'constellation')} onClick={() => setSource('constellation')}>
            👥 Constellation
          </div>
          <div style={S.sourceBtn(source === 'dating')} onClick={() => setSource('dating')}>
            💗 Dating Golems
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ ...S.sourceBtn(false), opacity: 0.6 }} onClick={selectAll}>All</div>
          <div style={{ ...S.sourceBtn(false), opacity: 0.6 }} onClick={selectNone}>None</div>
        </div>

        {/* Participant chips */}
        <div style={S.chipRow}>
          {availablePeople.length === 0 && (
            <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
              {source === 'constellation' ? 'No people in constellation yet — add them in Profiles.' : 'Dating golems will appear as your golem matches with others.'}
            </div>
          )}
          {availablePeople.map(p => {
            const id = String(p.id || p.name)
            const active = selectedIds.has(id)
            const color = p._isDating ? '#c084fc' : getRelColor(p.rel)
            return (
              <div key={id} style={S.chip(active, color)} onClick={() => toggleParticipant(p)}>
                <span>{p.emoji || '✦'}</span>
                <span style={S.chipLabel}>{(p.name || '').split(' ')[0]}</span>
                {p.rel && !p._isDating && <span style={{ fontSize: 9, opacity: 0.5 }}>{p.rel}</span>}
                {active && <span style={S.chipCheck}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      <GraphView threads={threads} profiles={activeProfiles} year={year} setYear={setYear} />
    </div>
  )
}
