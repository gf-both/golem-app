import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGolemStore } from './store/useGolemStore'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import IntroAnimation from './components/ui/IntroAnimation'
import ProfilePanel from './components/overlays/ProfilePanel'
import SynastryPanel from './components/overlays/SynastryPanel'
import AIChatPanel from './components/overlays/AIChatPanel'
// Quiz overlays removed — all quizzes are now inline within their detail panels
// Oracle is now embedded in Dashboard layout (not an overlay)
import AuthModal from './components/auth/AuthModal'
import ParticleField from './components/ui/ParticleField'
import Cursor from './components/ui/Cursor'
import { onAuthStateChange, getUser } from './lib/auth'
import { getUserProfile } from './lib/db'
import { setSyncUser, migrateLocalToAccount, checkSupabase } from './lib/syncService'

const AUTH_CONFIGURED = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
// Login gate is OFF until you finish wiring Supabase. Re-enable by setting
// VITE_REQUIRE_LOGIN=true in your env (local .env.local and/or Vercel).
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === 'true'

// On a user's first authenticated load on this device, push any pre-existing
// local-cache profiles up to their account (deduped), then load from cloud.
async function hydrateUser(user, { setUserProfile, loadProfilesFromDB, loadIssuedReportsFromDB }) {
  setSyncUser(user.id)
  const { data } = await getUserProfile(user.id)
  setUserProfile(data)

  const flag = `golem-migrated-${user.id}`
  if (!localStorage.getItem(flag)) {
    try {
      const { primaryProfile, people } = useGolemStore.getState()
      await migrateLocalToAccount(user.id, { primaryProfile, people })
    } catch { /* non-fatal */ }
    localStorage.setItem(flag, '1')
  }
  await loadProfilesFromDB(user.id)
  try { await loadIssuedReportsFromDB(user.id) } catch { /* non-fatal */ }
}

function AuthSync() {
  const { setUser, setUserProfile, setAuthLoading, loadProfilesFromDB, loadIssuedReportsFromDB } = useGolemStore()

  useEffect(() => {
    let cancelled = false
    checkSupabase()

    getUser().then(async user => {
      if (cancelled) return
      setUser(user)
      if (user) await hydrateUser(user, { setUserProfile, loadProfilesFromDB, loadIssuedReportsFromDB })
      if (!cancelled) setAuthLoading(false)
    })

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (cancelled) return
      const user = session?.user || null
      setUser(user)
      setSyncUser(user?.id || null)
      if (user) await hydrateUser(user, { setUserProfile, loadProfilesFromDB, loadIssuedReportsFromDB })
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return null
}

function AuthGate() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'radial-gradient(ellipse at 50% 35%, #1a1538, #0a0816)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AuthModal open gate onClose={() => {}} />
    </div>
  )
}

function Splash() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: '#0a0816', color: '#c9a84c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cinzel',serif", letterSpacing: '.3em', fontSize: 14,
    }}>✦ GOLEM</div>
  )
}

function OverlayManager() {
  const { activePanel, setActivePanel, showAuthModal, setShowAuthModal, activeQuiz, setActiveQuiz } = useGolemStore()
  return createPortal(
    <>
      <ProfilePanel open={activePanel === 'profile'} onClose={() => setActivePanel(null)} />
      <SynastryPanel open={activePanel === 'synastry'} onClose={() => setActivePanel(null)} />
      <AIChatPanel open={activePanel === 'aichat'} onClose={() => setActivePanel(null)} />
      {/* Quiz overlays removed — quizzes are now inline in detail panels */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>,
    document.body
  )
}

function ThemeSync() {
  const theme = useGolemStore((s) => s.theme)
  useEffect(() => {
    const html = document.documentElement

    // Keep data-theme for any legacy references
    html.setAttribute('data-theme', theme)

    // Paperclip dark/light class — determines base chrome colors
    const isLight = theme?.endsWith('-day') || theme === 'light'
    html.classList.toggle('dark', !isLight)

    // Remove all theme-* classes, add current one
    const themeClasses = Array.from(html.classList).filter(c => c.startsWith('theme-'))
    themeClasses.forEach(c => html.classList.remove(c))
    html.classList.add(`theme-${theme}`)

    // Clear any inline styles (let CSS vars take over)
    document.body.style.background = ''
    document.body.style.color = ''
    html.style.background = ''
    html.style.color = ''
  }, [theme])
  return null
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true) // Always replay intro on refresh
  const user = useGolemStore((s) => s.user)
  const isAuthLoading = useGolemStore((s) => s.isAuthLoading)

  // Require login only when explicitly enabled AND Supabase is configured.
  // Off by default so the app stays usable while the backend is wired up.
  const gated = REQUIRE_LOGIN && AUTH_CONFIGURED && !isAuthLoading && !user

  return (
    <ErrorBoundary>
      <AuthSync />
      <ThemeSync />
      <ParticleField />
      {REQUIRE_LOGIN && AUTH_CONFIGURED && isAuthLoading ? (
        <Splash />
      ) : gated ? (
        <AuthGate />
      ) : (
        <>
          <Dashboard />
          <OverlayManager />
        </>
      )}
      <Cursor />
      {showIntro && (
        <IntroAnimation onComplete={() => setShowIntro(false)} />
      )}
    </ErrorBoundary>
  )
}
