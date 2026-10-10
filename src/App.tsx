import { useState, type FormEvent } from 'react'
import { ApiError, login, type LoginResponse } from './api'
import LibraryDashboard from './LibraryDashboard'

function BookLogo({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark${small ? ' brand-mark-small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M18 11.1c-3.4-2.3-7.2-2.7-11-1.3v16.1c3.8-1.4 7.6-1 11 1.3m0-16.1c3.4-2.3 7.2-2.7 11-1.3v16.1c-3.8-1.4-7.6-1-11 1.3m0-16.1v16.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 14.1c1.5-.3 3-.1 4.4.6M11 18c1.5-.3 3-.1 4.4.6m9.6-4.5c-1.5-.3-3-.1-4.4.6m4.4 3.3c-1.5-.3-3-.1-4.4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" fill="currentColor" />
    </svg>
  )
}

function App() {
  const [session, setSession] = useState<LoginResponse | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const authenticated = await login(username.trim(), password)
      setSession(authenticated)
      setPassword('')
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (session) {
    return <LibraryDashboard role={session.role} token={session.access_token} onLogout={() => setSession(null)} />
  }

  return (
    <main className="login-page">
      <section className="welcome-panel" aria-label="Manager Library">
        <div className="welcome-glow welcome-glow-one" />
        <div className="welcome-glow welcome-glow-two" />
        <header className="welcome-header">
          <a className="brand brand-light" href="/" aria-label="Manager Library, inicio">
            <BookLogo />
            <span>manager<span className="brand-library">library</span></span>
          </a>
          <span className="edition-label">EDICIÓN BIBLIOTECAS</span>
        </header>

        <div className="welcome-copy">
          <span className="eyebrow eyebrow-light"><Sparkle /> TU BIBLIOTECA, EN ARMONÍA</span>
          <h1>Las historias<br />merecen <span>orden.</span></h1>
          <p>Una forma más sencilla de cuidar cada libro, acompañar cada préstamo y dar la bienvenida a cada lector.</p>

          <div className="book-illustration" aria-hidden="true">
            <div className="illustration-orbit orbit-one" />
            <div className="illustration-orbit orbit-two" />
            <div className="illustration-star star-one">✳</div>
            <div className="illustration-star star-two">✦</div>
            <div className="book book-back"><span /></div>
            <div className="book book-middle"><span /></div>
            <div className="book book-front"><span /></div>
            <div className="book-leaf leaf-one" />
            <div className="book-leaf leaf-two" />
          </div>

          <div className="welcome-note">
            <span className="note-icon"><Sparkle /></span>
            <div><strong>Todo encuentra su lugar.</strong><span>Un espacio pensado para quienes aman leer.</span></div>
          </div>
        </div>

        <footer className="welcome-footer">
          <span>HECHO PARA BIBLIOTECAS CON HISTORIA</span>
          <span className="footer-dot" />
          <span>© 2026 MANAGER LIBRARY</span>
        </footer>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <div className="form-topline">
          <span className="secure-label"><span className="secure-dot" /> ACCESO SEGURO</span>
          <span className="help-link">¿Problemas para entrar?</span>
        </div>

        <div className="form-content">
          <div className="form-brand"><BookLogo small /><span>Manager Library</span></div>
          <span className="eyebrow eyebrow-purple">QUÉ BUENO TENERTE DE VUELTA</span>
          <h2 id="login-title">Inicia sesión</h2>
          <p className="form-subtitle">Ingresa tus datos para continuar con tu biblioteca.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Usuario</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M5.5 20c.4-3.4 2.8-5.4 6.5-5.4s6.1 2 6.5 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                autoComplete="username"
                id="username"
                name="username"
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="password-label-row">
              <label htmlFor="password">Contraseña</label>
            </div>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="Ingresa tu contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.7 10.7 0 0 1 12 5c5.2 0 8.5 5.3 9.3 6.7a.7.7 0 0 1 0 .7 15 15 0 0 1-2.2 3M6.2 6.3A17 17 0 0 0 2.7 11.7a.7.7 0 0 0 0 .7C3.5 13.8 6.8 19 12 19c1 0 1.9-.2 2.7-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.7 11.7C3.5 10.3 6.8 5 12 5s8.5 5.3 9.3 6.7a.7.7 0 0 1 0 .7C20.5 13.8 17.2 19 12 19s-8.5-5.2-9.3-6.6a.7.7 0 0 1 0-.7Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" /></svg>
                )}
              </button>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4m0 3h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button className="submit-button" disabled={submitting} type="submit">
              {submitting ? <><span className="button-spinner" /> Verificando acceso...</> : <>Entrar a mi biblioteca <span aria-hidden="true">↗</span></>}
            </button>
          </form>

          <div className="form-security">
            <span className="security-shield">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.5 16 5v4.4c0 4-2.6 6.7-6 8.1-3.4-1.4-6-4.1-6-8.1V5l6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="m7.5 9.8 1.7 1.7 3.4-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>Tu información está protegida y solo tú puedes acceder a ella.</span>
          </div>
        </div>

        <footer className="form-footer">
          <span>Manager Library <span className="footer-separator">·</span> Gestión hecha con cuidado</span>
          <span>v1.0</span>
        </footer>
      </section>
    </main>
  )
}

export default App
