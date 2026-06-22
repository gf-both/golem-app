import { useState, useMemo } from 'react'
import { useGolemStore } from '../store/useGolemStore'
import { computePersonData } from '../hooks/useActiveProfile'
import ReportIssuance from '../components/ReportIssuance'

/* ── Mock Data ── */
const MOCK_SESSION_HISTORY = [
  { id: 1, date: '2026-03-03', practitioner: 'GOLEM Guide', type: 'Natal + Human Design Intro', duration: '75 min', summary: 'Introductory reading covering natal chart placements and Human Design bodygraph. Discussed Aquarius Sun, Virgo Moon/Rising, and 3/5 Projector profile. Key insight: the interplay between Aquarian innovation and Virgoan precision creates a unique capacity for building practical systems that serve collective evolution.', keyInsights: ['3/5 Projector with Emotional Authority', 'Wait for clarity at bottom of emotional wave', 'Aquarius-Virgo axis = visionary service'] },
  { id: 2, date: '2026-02-20', practitioner: 'GOLEM Guide', type: 'Gene Keys Deep Dive', duration: '60 min', summary: 'Explored the Hologenetic Profile focusing on the Activation Sequence. Concentrated on Gate 41 (Contraction to Emanation) and its role as the initiating codon. Discussed how the shadow of Contraction manifests as creative blocks and how the gift of Anticipation opens new experiential doorways.', keyInsights: ['Gate 41 = initiating codon, start of all experience', 'Shadow: Contraction around finances and creativity', 'Gift: Anticipation as a creative force'] },
  { id: 3, date: '2026-02-05', practitioner: 'GOLEM Guide', type: 'Kabbalah + Numerology', duration: '60 min', summary: 'Mapped the consciousness profile onto the Tree of Life. Identified Tiphareth as the central integrating sephirah. Combined with Life Path 7 numerology to understand the seeker archetype and its relationship to the path of Beauty and Harmony.', keyInsights: ['Tiphareth (Beauty) as primary sephirah', 'Life Path 7 = The Seeker of Truth', 'Netzach-Hod polarity work recommended'] },
  { id: 4, date: '2026-01-15', practitioner: 'GOLEM Guide', type: 'Transits & Forecast', duration: '45 min', summary: 'Reviewed upcoming transit themes for Q1 2026. Saturn approaching natal Sun signals restructuring of identity and public role. Jupiter trine Moon supports emotional expansion and new learning opportunities. Recommended journaling during the Saturn-Sun conjunction in April.', keyInsights: ['Saturn conjunct Sun in April = identity restructuring', 'Jupiter trine Moon = emotional growth', 'Journal daily during Saturn transit window'] },
]

const MOCK_TODOS = [
  { id: 1, text: 'Practice the Tiphareth meditation daily (10 min minimum)', done: false, fromSession: '2026-02-05' },
  { id: 2, text: 'Track emotional wave for 2 weeks before making major decisions', done: false, fromSession: '2026-03-03' },
  { id: 3, text: 'Read "The Gene Keys" chapters on Gate 41 and Gate 31', done: true, fromSession: '2026-02-20' },
  { id: 4, text: 'Start dream journal for shadow integration work', done: false, fromSession: '2026-02-20' },
  { id: 5, text: 'Schedule partner synastry reading', done: false, fromSession: '2026-02-20' },
  { id: 6, text: 'Begin daily journaling prep for Saturn-Sun conjunction', done: true, fromSession: '2026-01-15' },
  { id: 7, text: 'Review Netzach-Hod polarity homework sheet', done: false, fromSession: '2026-02-05' },
  { id: 8, text: 'Listen to recorded session audio (Gene Keys)', done: true, fromSession: '2026-02-20' },
]

const MOCK_UPCOMING = [
  { id: 1, date: '2026-03-12', time: '10:00 AM', type: 'Follow-up: Gene Keys Integration', practitioner: 'GOLEM Guide', duration: '60 min' },
  { id: 2, date: '2026-03-25', time: '2:00 PM', type: 'Saturn Transit Preparation', practitioner: 'GOLEM Guide', duration: '45 min' },
  { id: 3, date: '2026-04-08', time: '11:00 AM', type: 'Synastry Reading (with Partner)', practitioner: 'GOLEM Guide', duration: '90 min' },
]

const MOCK_MESSAGES = [
  { id: 1, from: 'practitioner', name: 'GOLEM Guide', date: '2026-03-04', content: 'Great session yesterday! I have sent you the HD bodygraph PDF and some reading recommendations. Remember to track your emotional wave for the next 2 weeks before making any major decisions. Looking forward to our follow-up.' },
  { id: 2, from: 'client', name: 'You', date: '2026-03-04', content: 'Thank you so much! The session was incredibly insightful. I already started noticing my emotional wave patterns today. Quick question \u2014 should I also track the moon transits alongside my emotional wave?' },
  { id: 3, from: 'practitioner', name: 'GOLEM Guide', date: '2026-03-05', content: 'Excellent question! Yes, tracking lunar transits alongside your emotional wave would be very beneficial. Your Virgo Moon is particularly sensitive to lunar aspects. I would recommend using a simple journal format: date, moon sign, your emotional state (1-10), and any notable events or insights.' },
  { id: 4, from: 'client', name: 'You', date: '2026-03-05', content: 'Perfect, I will start doing that today. Also, I finished the Gene Keys chapters on Gate 41. The concept of Contraction to Anticipation really resonated with some patterns I have been noticing in my creative work.' },
  { id: 5, from: 'practitioner', name: 'GOLEM Guide', date: '2026-03-06', content: 'That is wonderful progress! The fact that you are already seeing Gate 41 patterns in your creative work shows real awareness. In our next session, we will explore how the gift of Anticipation can become a conscious tool for initiating new projects. Keep journaling those observations!' },
]

/* ── Styles ── */
const st = {
  container: {
    padding: '24px', overflow: 'auto', height: '100%',
    fontFamily: "'Cormorant Garamond',serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel',serif", fontSize: '13px', letterSpacing: '.2em',
    color: 'var(--foreground)', marginBottom: '16px', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  divider: {
    height: '1px', background: 'linear-gradient(90deg, rgba(201,168,76,.2), transparent)',
    margin: '28px 0',
  },
  card: {
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px', transition: 'all .2s',
  },
  profileChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px', borderRadius: '16px', fontSize: '11px',
    background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
    color: 'var(--foreground)',
  },
  checkbox: {
    width: '14px', height: '14px', accentColor: 'var(--foreground)', cursor: 'pointer',
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: '80%', padding: '12px 16px', borderRadius: '14px',
    fontSize: '12px', lineHeight: 1.6,
  },
  msgPractitioner: {
    alignSelf: 'flex-start',
    background: 'rgba(64,204,221,.04)', border: '1px solid rgba(64,204,221,.12)',
    color: 'var(--foreground)',
  },
  msgClient: {
    alignSelf: 'flex-end',
    background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
    color: 'var(--foreground)', textAlign: 'right',
  },
  calendarCard: {
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px',
    alignItems: 'center', transition: 'all .2s',
  },
  calDateBox: {
    width: '52px', height: '52px', borderRadius: '10px',
    background: 'var(--accent)', border: '1px solid var(--accent)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  insightChip: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
    fontSize: '10px', background: 'rgba(64,204,221,.06)',
    border: '1px solid rgba(64,204,221,.12)', color: 'rgba(64,204,221,.8)',
    marginRight: '4px', marginBottom: '4px',
  },
  inputBar: {
    display: 'flex', gap: '10px', alignItems: 'flex-end',
    padding: '12px 0 0',
  },
  textarea: {
    flex: 1, background: 'var(--secondary)',
    border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px',
    padding: '10px 14px', color: 'var(--foreground)', fontSize: '12px',
    fontFamily: "'Cormorant Garamond',serif",
    resize: 'none', outline: 'none', minHeight: '42px',
    lineHeight: 1.5, transition: 'border-color .2s',
  },
  sendBtn: {
    width: '42px', height: '42px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '14px', flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(201,168,76,.2), var(--accent))',
    border: '1px solid rgba(201,168,76,.3)', transition: 'all .2s',
  },
}

/* ── Helper ── */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return { month: months[d.getMonth()], day: d.getDate(), full: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` }
}

/* ── Main Component ── */
export default function ClientPortal() {
  const rawProfile = useGolemStore((s) => s.primaryProfile)
  const profile = useMemo(() => computePersonData(rawProfile), [rawProfile?.dob, rawProfile?.tob, rawProfile?.birthLat, rawProfile?.birthLon, rawProfile?.birthTimezone, rawProfile?.name])
  const [todos, setTodos] = useState(MOCK_TODOS)
  const [msgInput, setMsgInput] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [activeTab, setActiveTab] = useState('profile')

  function toggleTodo(id) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }

  function handleSendMessage() {
    const text = msgInput.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'client', name: 'You', date: '2026-03-06', content: text },
    ])
    setMsgInput('')
  }

  const completedTodos = todos.filter((t) => t.done).length
  const totalTodos = todos.length

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: '\u2726' },
    { id: 'sessions', label: 'Sessions', icon: '\uD83D\uDCDD' },
    { id: 'todos', label: 'To-Dos', icon: '\u2611' },
    { id: 'upcoming', label: 'Upcoming', icon: '\uD83D\uDCC5' },
    { id: 'reports', label: 'Reports', icon: '\uD83D\uDCC4' },
    { id: 'messages', label: 'Messages', icon: '\uD83D\uDCAC' },
  ]

  return (
    <div style={st.container}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: '18px', letterSpacing: '.15em', color: 'var(--foreground)', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
          {'\uD83D\uDCCB'} Client Portal
          <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'rgba(240,160,60,.15)', border:'1px solid rgba(240,160,60,.3)', color:'rgba(240,160,60,.8)', fontFamily:"'Cinzel',serif", letterSpacing:'.08em', textTransform:'uppercase', marginLeft:8 }}>Demo</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
          Your personal space for sessions, insights, and growth tracking.
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '11px',
              fontFamily: "'Cinzel',serif", letterSpacing: '.06em', cursor: 'pointer',
              transition: 'all .2s',
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--secondary)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(201,168,76,.3)' : 'var(--border)'}`,
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {tab.icon} {tab.label}
          </div>
        ))}
      </div>

      {/* ── MY PROFILE SUMMARY ── */}
      {activeTab === 'profile' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\u2726'}</span> My Consciousness Map
          </div>

          {/* Profile overview card */}
          <div style={{ ...st.card, marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--accent)', border: '1px solid rgba(201,168,76,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
              }}>
                {profile.emoji || '\u2652'}
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '16px', color: 'var(--foreground)', letterSpacing: '.08em' }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                  {profile.dob} &middot; {profile.tob} &middot; {profile.pob}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              <span style={st.profileChip}>{'\u2609'} {profile.sign} Sun</span>
              <span style={st.profileChip}>{'\u263D'} {profile.moon} Moon</span>
              <span style={st.profileChip}>{'\u2191'} {profile.asc} Rising</span>
              <span style={st.profileChip}>{'\u25C8'} {profile.hdProfile} {profile.hdType}</span>
              <span style={st.profileChip}>{'\u221E'} Life Path {profile.lifePath}</span>
              <span style={st.profileChip}>{'\u2721'} Tiphareth</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'var(--secondary)', border: '1px solid var(--accent)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '.1em', color: 'var(--foreground)', marginBottom: '4px' }}>
                  HD TYPE
                </div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>{profile.hdType}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{profile.hdAuth} Authority</div>
              </div>
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'rgba(64,204,221,.04)', border: '1px solid rgba(64,204,221,.08)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '.1em', color: 'rgba(64,204,221,.6)', marginBottom: '4px' }}>
                  GENE KEYS
                </div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>41/31</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Incarnation Cross</div>
              </div>
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'rgba(144,80,224,.04)', border: '1px solid rgba(144,80,224,.08)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '.1em', color: 'rgba(144,80,224,.6)', marginBottom: '4px' }}>
                  SESSIONS
                </div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>{MOCK_SESSION_HISTORY.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Completed</div>
              </div>
            </div>
          </div>

          {/* Progress summary */}
          <div style={st.card}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '10px', letterSpacing: '.1em', color: 'var(--foreground)', marginBottom: '10px' }}>
              GROWTH PROGRESS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                flex: 1, height: '6px', borderRadius: '3px',
                background: 'var(--border)',
              }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, var(--foreground), rgba(64,204,221,.8))',
                  width: `${(completedTodos / totalTodos) * 100}%`,
                  transition: 'width .3s',
                }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: "'Inconsolata',monospace" }}>
                {completedTodos}/{totalTodos}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              {completedTodos} of {totalTodos} to-dos completed. Keep up the inner work!
            </div>
          </div>
        </>
      )}

      {/* ── SESSION HISTORY ── */}
      {activeTab === 'sessions' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\uD83D\uDCDD'}</span> Session History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_SESSION_HISTORY.map((session) => {
              const d = formatDate(session.date)
              return (
                <div key={session.id} style={st.card}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={st.calDateBox}>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '.1em', color: 'var(--foreground)' }}>
                        {d.month.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: '18px', color: 'var(--foreground)', lineHeight: 1 }}>
                        {d.day}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '12px', color: 'var(--foreground)', letterSpacing: '.06em' }}>
                          {session.type}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: "'Inconsolata',monospace" }}>
                          {session.duration}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                        with {session.practitioner}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {session.summary}
                      </div>
                      <div>
                        {session.keyInsights.map((insight, i) => (
                          <span key={i} style={st.insightChip}>{insight}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── TO-DOS & NEXT STEPS ── */}
      {activeTab === 'todos' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\u2611'}</span> My To-Dos &amp; Next Steps
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
            Tasks and practices assigned by your practitioner. Check them off as you complete them.
          </div>

          <div style={st.card}>
            {/* Incomplete items first */}
            {todos.filter((t) => !t.done).map((todo) => (
              <div key={todo.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 0', borderBottom: '1px solid var(--secondary)',
              }}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                  style={st.checkbox}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                    {todo.text}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    From session: {todo.fromSession}
                  </div>
                </div>
              </div>
            ))}

            {/* Completed items */}
            {todos.filter((t) => t.done).length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '.1em', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                  COMPLETED
                </div>
                {todos.filter((t) => t.done).map((todo) => (
                  <div key={todo.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '8px 0', borderBottom: '1px solid var(--secondary)',
                    opacity: 0.5,
                  }}>
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                      style={st.checkbox}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.5, textDecoration: 'line-through' }}>
                        {todo.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── UPCOMING SESSIONS ── */}
      {activeTab === 'upcoming' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\uD83D\uDCC5'}</span> Upcoming Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_UPCOMING.map((session) => {
              const d = formatDate(session.date)
              return (
                <div key={session.id} style={st.calendarCard}>
                  <div style={st.calDateBox}>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '.1em', color: 'var(--foreground)' }}>
                      {d.month.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: '18px', color: 'var(--foreground)', lineHeight: 1 }}>
                      {d.day}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: '12px', color: 'var(--foreground)', letterSpacing: '.06em', marginBottom: '4px' }}>
                      {session.type}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      {session.time} &middot; {session.duration} &middot; with {session.practitioner}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 14px', borderRadius: '8px',
                    background: 'rgba(201,168,76,.06)', border: '1px solid var(--accent)',
                    fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '.08em',
                    color: 'var(--foreground)', cursor: 'pointer', transition: 'all .2s',
                  }}>
                    Reschedule
                  </div>
                </div>
              )
            })}
          </div>

          {/* Calendar placeholder */}
          <div style={{
            ...st.card, marginTop: '16px', textAlign: 'center',
            padding: '32px', opacity: 0.5,
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{'\uD83D\uDCC5'}</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '12px', letterSpacing: '.1em', color: 'var(--foreground)', marginBottom: '4px' }}>
              Full Calendar View
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              Coming soon &mdash; interactive calendar with session scheduling
            </div>
          </div>
        </>
      )}

      {/* ── MESSAGES ── */}
      {activeTab === 'reports' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\uD83D\uDCC4'}</span> My Reports
          </div>
          <ReportIssuance mode="client" subjectKey="*" subject={profile} />
        </>
      )}

      {activeTab === 'messages' && (
        <>
          <div style={st.sectionTitle}>
            <span>{'\uD83D\uDCAC'}</span> Messages
          </div>

          <div style={{
            ...st.card, padding: '0', display: 'flex', flexDirection: 'column',
            maxHeight: '500px',
          }}>
            {/* Message header */}
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(64,204,221,.08)', border: '1px solid rgba(64,204,221,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}>
                {'\u2726'}
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '11px', color: 'var(--foreground)', letterSpacing: '.06em' }}>
                  GOLEM Guide
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Your practitioner</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflow: 'auto', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    ...st.msgBubble,
                    ...(msg.from === 'practitioner' ? st.msgPractitioner : st.msgClient),
                  }}>
                    <div style={{
                      fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '.1em',
                      color: msg.from === 'practitioner' ? 'rgba(64,204,221,.4)' : 'rgba(201,168,76,.4)',
                      marginBottom: '4px',
                    }}>
                      {msg.name} &middot; {msg.date}
                    </div>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ ...st.inputBar, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <textarea
                style={st.textarea}
                placeholder="Write a message..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <div style={st.sendBtn} onClick={handleSendMessage}>
                {'\u2726'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
