import { useState } from 'react'
import { signIn, signUp, signInWithGoogle, resetPassword } from '../../lib/auth'
import { useGolemStore } from '../../store/useGolemStore'

export default function AuthModal({ open, onClose, gate = false }) {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const setUser = useGolemStore((s) => s.setUser)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (tab === 'signin') {
        const { data, error } = await signIn({ email, password })
        if (error) throw error
        setUser(data.user)
        onClose()
      } else {
        const { data, error } = await signUp({ email, password, fullName })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
        setUser(data.user)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      setSuccess('Password reset link sent — check your email.')
    } catch (err) {
      setError(err.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // OAuth redirects — modal will close on redirect
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(201,168,76,.2)',
    borderRadius: 8, color: 'var(--text)',
    fontSize: 13, outline: 'none',
    transition: 'border-color .2s',
    boxSizing: 'border-box',
  }

  const btnPrimary = {
    width: '100%', padding: '11px 0',
    background: 'linear-gradient(135deg, rgba(201,168,76,.25), rgba(201,168,76,.12))',
    border: '1px solid rgba(201,168,76,.5)',
    borderRadius: 8, color: 'var(--gold)',
    fontSize: 12, fontFamily: "'Cinzel',serif",
    letterSpacing: '.1em', cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? .6 : 1, transition: 'all .2s',
    textTransform: 'uppercase',
  }

  const btnGoogle = {
    width: '100%', padding: '10px 0',
    background: 'var(--border)',
    border: '1px solid rgba(255,255,255,.15)',
    borderRadius: 8, color: 'var(--text)',
    fontSize: 12, fontFamily: "'Cinzel',serif",
    letterSpacing: '.06em', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all .2s',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (!gate && e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card-bg, rgba(10,10,20,.97))',
        border: '1px solid rgba(201,168,76,.2)',
        borderRadius: 16, padding: 32, width: 380,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 80px rgba(0,0,0,.6), 0 0 60px rgba(201,168,76,.05)',
        position: 'relative',
      }}>
        {/* Close (hidden in gate mode — login is required) */}
        {!gate && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', color: 'var(--text2)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >×</button>
        )}

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>✦</div>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 14,
            letterSpacing: '.2em', color: 'var(--gold)',
            textTransform: 'uppercase',
          }}>GOLEM</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            {tab === 'reset' ? 'Reset your password' : tab === 'signin' ? 'Welcome back' : 'Begin your journey'}
          </div>
        </div>

        {/* Tabs */}
        {tab !== 'reset' && (
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: 'rgba(255,255,255,.04)',
          borderRadius: 8, padding: 3,
          border: '1px solid var(--border)',
        }}>
          {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(null); setSuccess(null) }}
              style={{
                flex: 1, padding: '7px 0',
                background: tab === id ? 'rgba(201,168,76,.15)' : 'transparent',
                border: tab === id ? '1px solid rgba(201,168,76,.3)' : '1px solid transparent',
                borderRadius: 6, color: tab === id ? 'var(--gold)' : 'var(--text2)',
                fontSize: 10, fontFamily: "'Cinzel',serif",
                letterSpacing: '.08em', cursor: 'pointer', transition: 'all .2s',
                textTransform: 'uppercase',
              }}
            >{label}</button>
          ))}
        </div>
        )}

        {/* Google */}
        {tab !== 'reset' && (
        <>
        <button style={btnGoogle} onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '16px 0', color: 'var(--text3)', fontSize: 10,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>
        </>
        )}

        {/* Form */}
        <form onSubmit={tab === 'reset' ? handleReset : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'signup' && (
            <input
              type="text" placeholder="Full Name"
              value={fullName} onChange={e => setFullName(e.target.value)}
              style={inputStyle} required
            />
          )}
          <input
            type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle} required
          />
          {tab !== 'reset' && (
          <input
            type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle} required minLength={6}
          />
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6,
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
              color: '#f87171', fontSize: 11,
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              padding: '8px 12px', borderRadius: 6,
              background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)',
              color: '#4ade80', fontSize: 11,
            }}>{success}</div>
          )}

          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? '...' : tab === 'reset' ? 'Send Reset Link' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {tab === 'signin' && (
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 10, color: 'var(--text3)' }}>
            <span
              onClick={() => { setTab('reset'); setError(null); setSuccess(null) }}
              style={{ color: 'var(--gold)', cursor: 'pointer' }}
            >Forgot password?</span>
          </div>
        )}

        {tab === 'reset' && (
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 10, color: 'var(--text3)' }}>
            <span
              onClick={() => { setTab('signin'); setError(null); setSuccess(null) }}
              style={{ color: 'var(--gold)', cursor: 'pointer' }}
            >← Back to sign in</span>
          </div>
        )}
      </div>
    </div>
  )
}
