import { useState, type FormEvent } from 'react'
import { ApiError, login, type LoginResponse } from './api'

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
    return <Dashboard role={session.role} onLogout={() => setSession(null)} />
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

function Dashboard({ role, onLogout }: { role: LoginResponse['role']; onLogout: () => void }) {
  const roleLabel = role === 'admin' ? 'Administrador' : 'Bibliotecario'
  const today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <a className="brand brand-dark" href="/" aria-label="Manager Library, inicio">
          <BookLogo small />
          <span>manager<span className="brand-library">library</span></span>
        </a>
        <div className="sidebar-rule" />
        <span className="sidebar-caption">ESPACIO DE TRABAJO</span>
        <button className="nav-item nav-item-active" type="button">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" /></svg>
          <span>Resumen</span>
        </button>
        <span className="sidebar-caption sidebar-caption-spaced">BIBLIOTECA</span>
        <div className="nav-item nav-item-muted"><span className="nav-emoji">▤</span><span>Libros</span><span className="soon-dot" /></div>
        <div className="nav-item nav-item-muted"><span className="nav-emoji">♙</span><span>Socios</span><span className="soon-dot" /></div>
        <div className="nav-item nav-item-muted"><span className="nav-emoji">↔</span><span>Préstamos</span><span className="soon-dot" /></div>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-sparkle"><Sparkle /></span><strong>Un paso a la vez</strong><p>Estamos preparando nuevas herramientas para tu biblioteca.</p></div>
          <div className="sidebar-profile">
            <span className="avatar">{roleLabel.slice(0, 1)}</span>
            <span className="profile-copy"><strong>{roleLabel}</strong><span>Sesión activa</span></span>
            <button className="logout-button" onClick={onLogout} type="button" aria-label="Cerrar sesión" title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10m5-4 4-4-4-4m4 4H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <span>Tu biblioteca <span className="crumb-slash">/</span> <strong>Resumen</strong></span>
          <div className="topbar-right"><span className="live-indicator" /><span>Todo listo para empezar</span><span className="topbar-avatar">{roleLabel.slice(0, 1)}</span></div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="eyebrow eyebrow-purple">{today}</span>
              <h1>Un buen día para<br className="mobile-break" /> <span>abrir un libro.</span></h1>
              <p>Bienvenido a tu espacio de gestión. Pronto tendrás todo el movimiento de tu biblioteca aquí.</p>
            </div>
            <div className="welcome-illustration" aria-hidden="true">
              <div className="welcome-sun" />
              <div className="welcome-book-shape book-shape-one" />
              <div className="welcome-book-shape book-shape-two" />
              <div className="welcome-book-shape book-shape-three" />
              <div className="welcome-plant plant-left">✳</div>
              <div className="welcome-plant plant-right">✦</div>
            </div>
          </section>

          <section className="section-heading">
            <div><span className="eyebrow eyebrow-purple">TU ESPACIO</span><h2>La biblioteca, a tu ritmo</h2></div>
            <span className="setup-badge"><span />Configuración inicial</span>
          </section>

          <section className="overview-grid" aria-label="Resumen de la biblioteca">
            <article className="overview-card">
              <span className="overview-icon icon-lavender"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Zm0 0V21m4-14h8m-8 4h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="card-label">CATÁLOGO</span><strong className="card-placeholder">Próximamente</strong><span className="card-description">Tu colección organizada en un solo lugar.</span>
            </article>
            <article className="overview-card">
              <span className="overview-icon icon-peach"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" /><path d="M3.5 20v-1.4A4.6 4.6 0 0 1 8.1 14h1.8m4.1 2.2a3 3 0 1 0 0-6m1.5 4h.4a4.6 4.6 0 0 1 4.6 4.6v1.2h-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></span>
              <span className="card-label">LECTORES</span><strong className="card-placeholder">Próximamente</strong><span className="card-description">Las personas que hacen viva tu biblioteca.</span>
            </article>
            <article className="overview-card">
              <span className="overview-icon icon-mint"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7h12l-3-3m3 3-3 3M17 17H5l3 3m-3-3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="card-label">PRÉSTAMOS ACTIVOS</span><strong className="card-placeholder">Próximamente</strong><span className="card-description">Cada historia que está en buenas manos.</span>
            </article>
          </section>

          <section className="next-step-card">
            <div className="next-step-icon"><Sparkle /></div>
            <div className="next-step-copy"><span className="eyebrow eyebrow-purple">ESTAMOS CONSTRUYENDO</span><h3>Tu biblioteca empieza aquí.</h3><p>El acceso ya está listo. En el siguiente paso conectaremos el catálogo para que puedas explorar y administrar tus libros.</p></div>
            <span className="next-step-number">01 <i>/ 04</i></span>
          </section>

          <footer className="dashboard-footer"><span>Hecho con cuidado para quienes cuidan historias.</span><span>MANAGER LIBRARY <span className="footer-separator">·</span> 2026</span></footer>
        </div>
      </section>
    </main>
  )
}

export default App
