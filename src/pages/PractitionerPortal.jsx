import { useState } from 'react'
import PractitionerDashboard from '../components/practitioner/PractitionerDashboard'
import ClientList from '../components/practitioner/ClientList'
import SessionMode from '../components/practitioner/SessionMode'
import ClientDeepProfile from '../components/practitioner/ClientDeepProfile'
import MultiSystemView from '../components/practitioner/MultiSystemView'
import ReportIssuance from '../components/ReportIssuance'
import { useGolemStore } from '../store/useGolemStore'
import { MOCK_CLIENTS } from '../data/practitionerData'

function ClientReportsSection() {
  const practitionerName = useGolemStore((s) => s.primaryProfile?.name) || 'Your Practitioner'
  const [clientId, setClientId] = useState(MOCK_CLIENTS[0]?.id)
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) || MOCK_CLIENTS[0]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Client:</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(Number(e.target.value) || e.target.value)}
          style={{
            background: 'var(--secondary)', color: 'var(--foreground)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px',
            fontFamily: "'Cormorant Garamond',serif", fontSize: 14,
          }}
        >
          {MOCK_CLIENTS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <ReportIssuance
        subject={client}
        subjectKey={`client_${client.id}`}
        practitionerName={practitionerName}
        mode="practitioner"
      />
    </div>
  )
}

const s = {
  container: {
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--app-bg, #0d0d14)',
  },
  containerSession: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--app-bg, #0d0d14)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--accent)',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Cinzel',serif",
    fontSize: '16px',
    letterSpacing: '.3em',
    color: 'var(--foreground)',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: '13px',
    color: 'var(--muted-foreground)',
    letterSpacing: '.05em',
    marginTop: '2px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  actionBtn: {
    background: 'var(--accent)',
    border: '1px solid rgba(201,168,76,.3)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontFamily: "'Cinzel',serif",
    fontSize: '10px',
    letterSpacing: '.15em',
    color: 'var(--foreground)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all .2s',
  },
  content: {
    padding: '20px 24px',
    flex: 1,
    overflow: 'auto',
  },
  sectionDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, var(--accent), transparent)',
    margin: '28px 0 20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontFamily: "'Cinzel',serif",
    fontSize: '11px',
    letterSpacing: '.25em',
    color: 'var(--foreground)',
    textTransform: 'uppercase',
  },
  clientCount: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: '12px',
    color: 'var(--muted-foreground)',
  },
  navTabs: {
    display: 'flex',
    gap: '4px',
    padding: '0 24px 0',
    borderBottom: '1px solid rgba(255,255,255,.05)',
    flexShrink: 0,
  },
  navTab: (active) => ({
    padding: '10px 16px',
    fontSize: '10px',
    fontFamily: "'Cinzel',serif",
    letterSpacing: '.08em',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    borderBottom: active ? '2px solid var(--foreground)' : '2px solid transparent',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    marginBottom: '-1px',
    transition: 'all .2s',
    textTransform: 'uppercase',
  }),
}

export default function PractitionerPortal() {
  const [activeClient, setActiveClient] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'session' | 'deep-profile' | 'compare'

  function handleSelectClient(client) {
    setActiveClient(client)
    setView('session')
  }

  function handleViewDeepProfile(client) {
    setActiveClient(client)
    setView('deep-profile')
  }

  function handleBack() {
    setActiveClient(null)
    setView('dashboard')
  }

  // Session Mode: full-screen session interface
  if (view === 'session' && activeClient) {
    return (
      <div style={s.containerSession}>
        <SessionMode client={activeClient} onBack={handleBack} />
      </div>
    )
  }

  // Deep Profile: full-screen client blueprint
  if (view === 'deep-profile' && activeClient) {
    return (
      <div style={s.containerSession}>
        <ClientDeepProfile
          client={activeClient}
          sessions={activeClient.sessions || []}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Compare view
  if (view === 'compare') {
    return (
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>Practitioner HQ</div>
            <div style={s.subtitle}>Practice Management · Sessions · Revenue</div>
          </div>
          <div style={s.headerActions}>
            <button
              style={{ ...s.actionBtn, background: 'var(--secondary)', borderColor: 'rgba(255,255,255,.1)', color: 'var(--muted-foreground)' }}
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>
        </div>
        {/* Nav */}
        <div style={s.navTabs}>
          {[
            { id: 'dashboard', label: '⊞ Dashboard' },
            { id: 'compare', label: '⚖️ Compare' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setActiveClient(null) }}
              style={s.navTab(view === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MultiSystemView clients={MOCK_CLIENTS} />
        </div>
      </div>
    )
  }

  // Dashboard + Client List view
  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={{ ...s.title, display: 'flex', alignItems: 'center' }}>
            Practitioner HQ
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'rgba(240,160,60,.15)', border:'1px solid rgba(240,160,60,.3)', color:'rgba(240,160,60,.8)', fontFamily:"'Cinzel',serif", letterSpacing:'.08em', textTransform:'uppercase', marginLeft:8 }}>Demo</span>
          </div>
          <div style={s.subtitle}>Practice Management · Sessions · Revenue</div>
        </div>
        <div style={s.headerActions}>
          <button
            style={s.actionBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            + New Session
          </button>
          <button
            style={{ ...s.actionBtn, background: 'rgba(144,80,224,.1)', borderColor: 'rgba(144,80,224,.3)', color: 'rgba(144,80,224,.9)' }}
            onClick={() => setView('compare')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(144,80,224,.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(144,80,224,.1)'}
          >
            ⚖️ Compare
          </button>
          <button
            style={{ ...s.actionBtn, background: 'var(--secondary)', borderColor: 'rgba(255,255,255,.1)', color: 'var(--muted-foreground)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'var(--text1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
          >
            + Client
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* Dashboard: Revenue + Upcoming + Activity */}
        <PractitionerDashboard />

        {/* Divider */}
        <div style={s.sectionDivider} />

        {/* Client List */}
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Clients</div>
          <div style={s.clientCount}>{MOCK_CLIENTS.length} active · Click to start session · 🔮 for deep profile</div>
        </div>
        <ClientList
          onSelectClient={handleSelectClient}
          onViewDeepProfile={handleViewDeepProfile}
        />

        {/* Divider */}
        <div style={s.sectionDivider} />

        {/* Client Reports */}
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Client Reports</div>
          <div style={s.clientCount}>Issue a full GOLEM report — stamped with your name & seal</div>
        </div>
        <ClientReportsSection />
      </div>
    </div>
  )
}
