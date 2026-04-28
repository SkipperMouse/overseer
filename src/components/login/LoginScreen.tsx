import { useState, useEffect } from 'react'

interface Props {
  onLogin: () => void
}

function LoadingDots() {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 300)
    return () => clearInterval(id)
  }, [])

  return <span style={{ display: 'inline-block', width: 18 }}>{dots}</span>
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('> missing credentials')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        onLogin()
      } else {
        setError('> invalid credentials')
        setLoading(false)
      }
    } catch {
      setError('> connection error')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-mid)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    padding: '6px 2px',
    outline: 'none',
    letterSpacing: '0.5px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: 'var(--text-section)',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '6px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
          RobCo Industries
        </div>
        <div style={{ fontSize: 22, letterSpacing: '8px', textTransform: 'uppercase', color: 'var(--text-primary)' }} className="phosphor-glow">
          OVERSEER
        </div>
        <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginTop: 6 }}>
          Personal Information Processor v1.0.0
        </div>
        <div style={{ marginTop: 14, fontSize: 9, letterSpacing: '1px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ color: 'var(--border-bright)' }}>────────────</span>
          <span style={{ color: 'var(--text-section)' }}>AUTH REQUIRED</span>
          <span style={{ color: 'var(--border-bright)' }}>────────────</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>username</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 11, flexShrink: 0 }}>&gt;</span>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              autoComplete="off"
              spellCheck={false}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 11, flexShrink: 0 }}>&gt;</span>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 9, letterSpacing: '1px',
                color: showPass ? 'var(--text-active)' : 'var(--text-dim)',
                fontFamily: 'var(--font)',
                flexShrink: 0, padding: '0 2px',
              }}
            >
              {showPass ? 'hide' : 'show'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '1px', textShadow: 'var(--danger-glow)' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'transparent',
              border: `1px solid ${loading ? 'var(--border-bright)' : 'var(--accent)'}`,
              color: loading ? 'var(--text-section)' : 'var(--accent)',
              fontFamily: 'var(--font)', fontSize: 11, letterSpacing: '4px',
              textTransform: 'uppercase', padding: '9px 32px',
              cursor: loading ? 'default' : 'pointer', borderRadius: 0,
              textShadow: loading ? 'none' : '0 0 6px #00ff4155',
              transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#00ff4108' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {loading ? (
              <span style={{ letterSpacing: '2px', color: 'var(--text-section)' }}>
                authenticating<LoadingDots />
              </span>
            ) : 'ENTER'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 48, fontSize: 9, color: 'var(--text-dim)', letterSpacing: '1px', textAlign: 'center' }}>
        unauthorized access prohibited
      </div>
    </div>
  )
}
