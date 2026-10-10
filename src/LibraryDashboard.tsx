import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  createBook,
  createLibrarian,
  createLoan,
  createMember,
  deleteBook,
  getBooks,
  getCategories,
  getLoans,
  getMembers,
  getMostBorrowed,
  getOverdueLoans,
  removeBookCover,
  returnLoanItem,
  uploadBookCover,
  updateBook,
  type Book,
  type Category,
  type Loan,
  type LoginResponse,
  type Member,
  type MostBorrowed,
  type OverdueLoanItem,
} from './api'

type View = 'home' | 'books' | 'members' | 'loans' | 'overdue' | 'reports' | 'users'

interface LibraryDashboardProps {
  token: string
  role: LoginResponse['role']
  onLogout: () => void
}

const viewLabels: Record<View, string> = {
  home: 'Resumen',
  books: 'Catálogo',
  members: 'Socios',
  loans: 'Préstamos',
  overdue: 'Vencidos',
  reports: 'Reportes',
  users: 'Bibliotecarios',
}

const emptyBookForm = {
  title: '',
  author: '',
  isbn: '',
  category_id: '',
  total_copies: '1',
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value))
}

function StatusPill({ status }: { status: Loan['status'] }) {
  const labels: Record<Loan['status'], string> = {
    open: 'Activo',
    overdue: 'Vencido',
    closed: 'Cerrado',
  }
  return <span className={`status-pill status-${status}`}>{labels[status]}</span>
}

function LibraryDashboard({ token, role, onLogout }: LibraryDashboardProps) {
  const isAdmin = role === 'admin'
  const roleLabel = isAdmin ? 'Administrador' : 'Bibliotecario'
  const today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [bookTotal, setBookTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [loans, setLoans] = useState<Loan[]>([])
  const [overdue, setOverdue] = useState<OverdueLoanItem[]>([])
  const [reportRows, setReportRows] = useState<MostBorrowed[]>([])
  const [reportFrom, setReportFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [reportTo, setReportTo] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [bookEditor, setBookEditor] = useState<Book | null | false>(false)
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [memberForm, setMemberForm] = useState({ full_name: '', document_number: '' })
  const [librarianForm, setLibrarianForm] = useState({ username: '', password: '' })
  const [loanMemberId, setLoanMemberId] = useState('')
  const [loanBookIds, setLoanBookIds] = useState<string[]>([])
  const [returningItemId, setReturningItemId] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    async function loadView() {
      try {
        if (view === 'home') {
          const [bookPage, memberPage, loanPage, overduePage] = await Promise.all([
            getBooks(token),
            getMembers(token),
            getLoans(token),
            getOverdueLoans(token),
          ])
          if (!active) return
          setBooks(bookPage.items)
          setBookTotal(bookPage.total)
          setMembers(memberPage.items)
          setMemberTotal(memberPage.total)
          setLoans(loanPage.items)
          setOverdue(overduePage.items)
        } else if (view === 'books') {
          const [bookPage, categoryPage] = await Promise.all([
            getBooks(token, appliedQuery),
            getCategories(token),
          ])
          if (!active) return
          setBooks(bookPage.items)
          setBookTotal(bookPage.total)
          setCategories(categoryPage.items)
        } else if (view === 'members') {
          const memberPage = await getMembers(token, appliedQuery)
          if (!active) return
          setMembers(memberPage.items)
          setMemberTotal(memberPage.total)
        } else if (view === 'loans') {
          const [loanPage, memberPage, bookPage] = await Promise.all([
            getLoans(token),
            getMembers(token),
            getBooks(token),
          ])
          if (!active) return
          setLoans(loanPage.items)
          setMembers(memberPage.items)
          setBooks(bookPage.items)
        } else if (view === 'overdue') {
          const overduePage = await getOverdueLoans(token)
          if (!active) return
          setOverdue(overduePage.items)
        } else if (view === 'reports') {
          const report = await getMostBorrowed(token, reportFrom, reportTo)
          if (!active) return
          setReportRows(report.rows)
        } else if (view === 'users' && !isAdmin) {
          if (!active) return
          setError('Solo el administrador puede gestionar bibliotecarios.')
        }
      } catch (cause) {
        if (active) setError(errorMessage(cause))
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadView()
    return () => {
      active = false
    }
  }, [view, token, appliedQuery, reportFrom, reportTo, refreshVersion, isAdmin])

  function selectView(nextView: View) {
    setView(nextView)
    setQuery('')
    setAppliedQuery('')
    setError('')
    setNotice('')
  }

  function openNewBook() {
    setBookForm({ ...emptyBookForm, category_id: categories[0]?.id ?? '' })
    setCoverFile(null)
    setBookEditor(null)
    setError('')
  }

  function openEditBook(book: Book) {
    setCoverFile(null)
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category_id: book.category.id,
      total_copies: String(book.total_copies),
    })
    setBookEditor(book)
    setError('')
  }

  async function handleBookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const details = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        category_id: bookForm.category_id,
        total_copies: Number(bookForm.total_copies),
      }
      const isNewBook = bookEditor === null
      let savedBook: Book
      if (bookEditor) {
        savedBook = await updateBook(token, bookEditor.id, details)
      } else {
        savedBook = await createBook(token, { ...details, isbn: bookForm.isbn.trim() })
        setBookEditor(savedBook)
      }
      if (coverFile) await uploadBookCover(token, savedBook.id, coverFile)
      setNotice(isNewBook ? 'Libro agregado al catálogo.' : 'Libro actualizado correctamente.')
      setBookEditor(false)
      setCoverFile(null)
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveBookCover() {
    if (!bookEditor) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await removeBookCover(token, bookEditor.id)
      setBookEditor({ ...bookEditor, cover_key: null })
      setNotice('Portada retirada correctamente.')
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteBook(book: Book) {
    if (!window.confirm(`¿Dar de baja “${book.title}”?`)) return
    setError('')
    setNotice('')
    try {
      await deleteBook(token, book.id)
      setNotice('Libro dado de baja del catálogo.')
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createMember(token, {
        full_name: memberForm.full_name.trim(),
        document_number: memberForm.document_number.trim(),
      })
      setMemberForm({ full_name: '', document_number: '' })
      setNotice('Socio registrado correctamente.')
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  async function handleLibrarianSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const librarian = await createLibrarian(token, {
        username: librarianForm.username.trim(),
        password: librarianForm.password,
      })
      setLibrarianForm({ username: '', password: '' })
      setNotice(`Bibliotecario ${librarian.username} creado correctamente.`)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  function toggleLoanBook(bookId: string) {
    setLoanBookIds((selected) => {
      if (selected.includes(bookId)) return selected.filter((id) => id !== bookId)
      if (selected.length === 3) return selected
      return [...selected, bookId]
    })
  }

  async function handleLoanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createLoan(token, loanMemberId, loanBookIds)
      setLoanMemberId('')
      setLoanBookIds([])
      setNotice('Préstamo registrado. El vencimiento se calcula a 14 días.')
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  async function handleReturn(loanId: string, itemId: string) {
    setReturningItemId(itemId)
    setError('')
    setNotice('')
    try {
      await returnLoanItem(token, loanId, itemId)
      setNotice('Devolución registrada y ejemplar repuesto.')
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setReturningItemId('')
    }
  }

  const activeLoans = loans.filter((loan) => loan.status !== 'closed').length
  const pageHeading = viewLabels[view]

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <a className="brand brand-dark" href="/" aria-label="Manager Library, inicio">
          <span className="brand-mark brand-mark-small" aria-hidden="true">⌂</span>
          <span>manager<span className="brand-library">library</span></span>
        </a>
        <div className="sidebar-rule" />
        <span className="sidebar-caption">ESPACIO DE TRABAJO</span>
        <nav className="dashboard-nav" aria-label="Navegación principal">
          {(Object.keys(viewLabels) as View[])
            .filter((item) => (item !== 'reports' && item !== 'users') || isAdmin)
            .map((item) => (
              <button
                aria-current={view === item ? 'page' : undefined}
                className={`nav-item${view === item ? ' nav-item-active' : ''}`}
                key={item}
                onClick={() => selectView(item)}
                type="button"
              >
                <span className="nav-emoji" aria-hidden="true">
                  {{ home: '▦', books: '▤', members: '♙', loans: '↔', overdue: '◷', reports: '▥', users: '♙' }[item]}
                </span>
                <span>{viewLabels[item]}</span>
                {item === 'overdue' && overdue.length > 0 && <span className="nav-count">{overdue.length}</span>}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-sparkle" aria-hidden="true">✦</span>
            <strong>Tu biblioteca, al día</strong>
            <p>Catálogo, lectores y préstamos en un mismo lugar.</p>
          </div>
          <div className="sidebar-profile">
            <span className="avatar">{roleLabel.slice(0, 1)}</span>
            <span className="profile-copy"><strong>{roleLabel}</strong><span>Sesión activa</span></span>
            <button className="logout-button" onClick={onLogout} type="button" aria-label="Cerrar sesión" title="Cerrar sesión">
              <span aria-hidden="true">↪</span>
            </button>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <span>Tu biblioteca <span className="crumb-slash">/</span> <strong>{pageHeading}</strong></span>
          <div className="topbar-right"><span className="live-indicator" /><span>Conectada a la API</span><span className="topbar-avatar">{roleLabel.slice(0, 1)}</span></div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow eyebrow-purple">{view === 'home' ? today : 'MANAGER LIBRARY'}</span>
              <h1>{view === 'home' ? <>Un buen día para <span>abrir un libro.</span></> : pageHeading}</h1>
              <p>{view === 'home' ? 'Todo el movimiento de tu biblioteca, en un solo lugar.' : pageDescription(view)}</p>
            </div>
            {view === 'books' && isAdmin && (
              <button className="primary-action" onClick={openNewBook} type="button">＋ Agregar libro</button>
            )}
          </div>

          {error && <div className="dashboard-alert dashboard-alert-error" role="alert">{error}</div>}
          {notice && <div className="dashboard-alert dashboard-alert-success" role="status">{notice}</div>}

          {loading ? (
            <div className="loading-card" role="status"><span className="button-spinner" /> Cargando información…</div>
          ) : (
            <>
              {view === 'home' && (
                <HomeView
                  bookTotal={bookTotal}
                  memberTotal={memberTotal}
                  activeLoans={activeLoans}
                  overdueTotal={overdue.length}
                  onNavigate={selectView}
                />
              )}
              {view === 'books' && (
                <BooksView
                  books={books}
                  total={bookTotal}
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={() => setAppliedQuery(query)}
                  isAdmin={isAdmin}
                  onEdit={openEditBook}
                  onDelete={(book) => void handleDeleteBook(book)}
                />
              )}
              {view === 'members' && (
                <MembersView
                  members={members}
                  total={memberTotal}
                  query={query}
                  form={memberForm}
                  saving={saving}
                  onQueryChange={setQuery}
                  onSearch={() => setAppliedQuery(query)}
                  onFormChange={setMemberForm}
                  onSubmit={(event) => void handleMemberSubmit(event)}
                />
              )}
              {view === 'loans' && (
                <LoansView
                  loans={loans}
                  members={members}
                  books={books}
                  memberId={loanMemberId}
                  selectedBookIds={loanBookIds}
                  saving={saving}
                  returningItemId={returningItemId}
                  onMemberChange={setLoanMemberId}
                  onToggleBook={toggleLoanBook}
                  onSubmit={(event) => void handleLoanSubmit(event)}
                  onReturn={(loanId, itemId) => void handleReturn(loanId, itemId)}
                />
              )}
              {view === 'overdue' && (
                <OverdueView
                  items={overdue}
                  returningItemId={returningItemId}
                  onReturn={(loanId, itemId) => void handleReturn(loanId, itemId)}
                />
              )}
              {view === 'reports' && isAdmin && (
                <ReportView
                  from={reportFrom}
                  to={reportTo}
                  rows={reportRows}
                  onFromChange={setReportFrom}
                  onToChange={setReportTo}
                />
              )}
              {view === 'users' && isAdmin && (
                <LibrariansView
                  form={librarianForm}
                  saving={saving}
                  onFormChange={setLibrarianForm}
                  onSubmit={(event) => void handleLibrarianSubmit(event)}
                />
              )}
            </>
          )}

          <footer className="dashboard-footer"><span>Hecho con cuidado para quienes cuidan historias.</span><span>MANAGER LIBRARY <span className="footer-separator">·</span> 2026</span></footer>
        </div>
      </section>

      {bookEditor !== false && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setBookEditor(false)
        }}>
          <section aria-labelledby="book-form-title" aria-modal="true" className="dialog-card" role="dialog">
            <div className="dialog-heading">
              <div><span className="eyebrow eyebrow-purple">CATÁLOGO</span><h2 id="book-form-title">{bookEditor ? 'Editar libro' : 'Agregar libro'}</h2></div>
              <button aria-label="Cerrar" className="icon-button" onClick={() => setBookEditor(false)} type="button">×</button>
            </div>
            <form className="data-form" onSubmit={(event) => void handleBookSubmit(event)}>
              <label>Título<input maxLength={250} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} required value={bookForm.title} /></label>
              <label>Autor<input maxLength={200} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} required value={bookForm.author} /></label>
              {!bookEditor && <label>ISBN (13 dígitos)<input inputMode="numeric" maxLength={13} minLength={13} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value.replace(/\D/g, '') })} pattern="[0-9]{13}" required value={bookForm.isbn} /></label>}
              <label>Categoría<select onChange={(event) => setBookForm({ ...bookForm, category_id: event.target.value })} required value={bookForm.category_id}>
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select></label>
              <label>Ejemplares<input inputMode="numeric" max="10000" min="1" onChange={(event) => setBookForm({ ...bookForm, total_copies: event.target.value })} required type="number" value={bookForm.total_copies} /></label>
              <label>Portada (JPG o PNG, hasta 2 MB)
                <input accept="image/jpeg,image/png" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              {bookEditor && bookEditor.cover_key && (
                <button className="text-action text-danger" disabled={saving} onClick={() => void handleRemoveBookCover()} type="button">Quitar portada actual</button>
              )}
              {error && <div className="dashboard-alert dashboard-alert-error" role="alert">{error}</div>}
              <div className="dialog-actions">
                <button className="secondary-action" onClick={() => setBookEditor(false)} type="button">Cancelar</button>
                <button className="primary-action" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar libro'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

function pageDescription(view: View): string {
  const descriptions: Record<View, string> = {
    home: '',
    books: 'Busca, registra y mantén organizado el catálogo de tu biblioteca.',
    members: 'Registra lectores y consulta sus datos de afiliación.',
    loans: 'Presta ejemplares disponibles y registra cada devolución.',
    overdue: 'Préstamos que requieren seguimiento por fecha de vencimiento.',
    reports: 'Consulta los títulos más prestados en un periodo.',
    users: 'Crea cuentas de bibliotecario para el equipo de tu biblioteca.',
  }
  return descriptions[view]
}

function HomeView({
  bookTotal,
  memberTotal,
  activeLoans,
  overdueTotal,
  onNavigate,
}: {
  bookTotal: number
  memberTotal: number
  activeLoans: number
  overdueTotal: number
  onNavigate: (view: View) => void
}) {
  return (
    <>
      <section className="dashboard-welcome">
        <div><span className="eyebrow eyebrow-purple">TU BIBLIOTECA, EN ARMONÍA</span><h2>Historias bien cuidadas,<br /><span>lectores felices.</span></h2><p>Un resumen claro para acompañar cada libro y cada préstamo.</p></div>
        <div className="welcome-illustration" aria-hidden="true"><div className="welcome-sun" /><div className="welcome-book-shape book-shape-one" /><div className="welcome-book-shape book-shape-two" /><div className="welcome-book-shape book-shape-three" /><div className="welcome-plant plant-left">✳</div><div className="welcome-plant plant-right">✦</div></div>
      </section>
      <section className="overview-grid business-overview" aria-label="Indicadores de la biblioteca">
        <MetricCard label="TÍTULOS EN CATÁLOGO" value={bookTotal} icon="▤" tone="lavender" />
        <MetricCard label="SOCIOS REGISTRADOS" value={memberTotal} icon="♙" tone="peach" />
        <MetricCard label="PRÉSTAMOS ACTIVOS" value={activeLoans} icon="↔" tone="mint" />
        <MetricCard label="LÍNEAS VENCIDAS" value={overdueTotal} icon="◷" tone="rose" />
      </section>
      <section className="quick-actions">
        <div className="section-heading"><div><span className="eyebrow eyebrow-purple">ACCESO RÁPIDO</span><h2>¿Qué necesitas hacer?</h2></div></div>
        <div className="quick-action-grid">
          <button className="quick-action" onClick={() => onNavigate('books')} type="button"><span>▤</span><strong>Explorar libros</strong><small>Encuentra un título del catálogo</small></button>
          <button className="quick-action" onClick={() => onNavigate('members')} type="button"><span>♙</span><strong>Ver socios</strong><small>Consulta y registra lectores</small></button>
          <button className="quick-action" onClick={() => onNavigate('loans')} type="button"><span>↔</span><strong>Registrar préstamo</strong><small>Presta hasta tres libros</small></button>
          <button className="quick-action" onClick={() => onNavigate('overdue')} type="button"><span>◷</span><strong>Revisar vencidos</strong><small>{overdueTotal} líneas por atender</small></button>
        </div>
      </section>
    </>
  )
}

function MetricCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
  return <article className="overview-card"><span className={`overview-icon icon-${tone}`}>{icon}</span><span className="card-label">{label}</span><strong className="metric-value">{value}</strong><span className="card-description">Dato actualizado desde la API</span></article>
}

function BooksView({
  books,
  total,
  query,
  onQueryChange,
  onSearch,
  isAdmin,
  onEdit,
  onDelete,
}: {
  books: Book[]
  total: number
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  isAdmin: boolean
  onEdit: (book: Book) => void
  onDelete: (book: Book) => void
}) {
  return (
    <section className="workspace-card">
      <div className="toolbar">
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
          <label className="sr-only" htmlFor="book-search">Buscar en el catálogo</label>
          <input id="book-search" onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar título, autor o ISBN…" value={query} />
          <button className="secondary-action" type="submit">Buscar</button>
        </form>
        <span className="result-count">{total} {total === 1 ? 'título' : 'títulos'}</span>
      </div>
      {books.length === 0 ? <EmptyState title="No encontramos libros" text="Prueba con otro término o agrega un título al catálogo." /> : (
        <div className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <div className="book-card-cover" aria-hidden="true"><span>▤</span></div>
              <div className="book-card-content">
                <span className="book-category">{book.category.name}</span>
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <div className="book-meta"><span>ISBN {book.isbn}</span><span className={book.available_copies ? 'availability' : 'availability unavailable'}>{book.available_copies} / {book.total_copies} disponibles</span></div>
                {isAdmin && <div className="row-actions"><button className="text-action" onClick={() => onEdit(book)} type="button">Editar</button><button className="text-action text-danger" onClick={() => onDelete(book)} type="button">Dar de baja</button></div>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function MembersView({
  members,
  total,
  query,
  form,
  saving,
  onQueryChange,
  onSearch,
  onFormChange,
  onSubmit,
}: {
  members: Member[]
  total: number
  query: string
  form: { full_name: string; document_number: string }
  saving: boolean
  onQueryChange: (query: string) => void
  onSearch: () => void
  onFormChange: (form: { full_name: string; document_number: string }) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="two-column-layout">
      <section className="workspace-card">
        <div className="toolbar">
          <form className="search-form" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
            <label className="sr-only" htmlFor="member-search">Buscar socios</label>
            <input id="member-search" onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar por nombre o documento…" value={query} />
            <button className="secondary-action" type="submit">Buscar</button>
          </form>
          <span className="result-count">{total} socios</span>
        </div>
        {members.length === 0 ? <EmptyState title="Aún no hay socios" text="Registra un lector para iniciar." /> : (
          <div className="member-list">
            {members.map((member) => (
              <article className="member-row" key={member.id}>
                <span className="member-avatar">{member.full_name.trim().slice(0, 1).toUpperCase()}</span>
                <span className="member-details"><strong>{member.full_name}</strong><small>Documento {member.document_number}</small></span>
                <span className="member-status">Registrado</span>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="workspace-card form-card">
        <span className="eyebrow eyebrow-purple">NUEVO LECTOR</span>
        <h2>Registrar socio</h2>
        <p>Agrega sus datos de identificación para habilitar préstamos.</p>
        <form className="data-form" onSubmit={onSubmit}>
          <label>Nombre completo<input autoComplete="name" maxLength={200} onChange={(event) => onFormChange({ ...form, full_name: event.target.value })} required value={form.full_name} /></label>
          <label>Número de documento<input maxLength={30} onChange={(event) => onFormChange({ ...form, document_number: event.target.value })} required value={form.document_number} /></label>
          <button className="primary-action" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Registrar socio'}</button>
        </form>
      </section>
    </div>
  )
}

function LibrariansView({
  form,
  saving,
  onFormChange,
  onSubmit,
}: {
  form: { username: string; password: string }
  saving: boolean
  onFormChange: (form: { username: string; password: string }) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="workspace-card form-card librarian-form-card">
      <span className="eyebrow eyebrow-purple">EQUIPO DE TRABAJO</span>
      <h2>Crear bibliotecario</h2>
      <p>La cuenta nueva tendrá permisos de operación, sin acceso a funciones administrativas.</p>
      <form className="data-form" onSubmit={onSubmit}>
        <label>Nombre de usuario
          <input
            autoComplete="username"
            maxLength={120}
            onChange={(event) => onFormChange({ ...form, username: event.target.value })}
            required
            value={form.username}
          />
        </label>
        <label>Contraseña
          <input
            autoComplete="new-password"
            maxLength={255}
            onChange={(event) => onFormChange({ ...form, password: event.target.value })}
            required
            type="password"
            value={form.password}
          />
        </label>
        <button className="primary-action" disabled={saving} type="submit">
          {saving ? 'Creando…' : 'Crear bibliotecario'}
        </button>
      </form>
    </section>
  )
}

function LoansView({
  loans,
  members,
  books,
  memberId,
  selectedBookIds,
  saving,
  returningItemId,
  onMemberChange,
  onToggleBook,
  onSubmit,
  onReturn,
}: {
  loans: Loan[]
  members: Member[]
  books: Book[]
  memberId: string
  selectedBookIds: string[]
  saving: boolean
  returningItemId: string
  onMemberChange: (memberId: string) => void
  onToggleBook: (bookId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onReturn: (loanId: string, itemId: string) => void
}) {
  const memberNames = new Map(members.map((member) => [member.id, member.full_name]))
  const availableBooks = books.filter((book) => book.available_copies > 0)

  return (
    <>
      <section className="workspace-card lend-form-card">
        <div><span className="eyebrow eyebrow-purple">NUEVO PRÉSTAMO</span><h2>¿Qué libros se lleva el lector?</h2><p>Selecciona un socio y hasta tres ejemplares disponibles.</p></div>
        <form className="lend-form" onSubmit={onSubmit}>
          <label>Socio<select onChange={(event) => onMemberChange(event.target.value)} required value={memberId}><option value="">Selecciona un socio</option>{members.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></label>
          <fieldset className="book-choice-fieldset"><legend>Libros ({selectedBookIds.length}/3)</legend>
            {availableBooks.length === 0 ? <p className="empty-inline">No hay ejemplares disponibles.</p> : (
              <div className="book-choice-list">{availableBooks.map((book) => (
                <label className={`book-choice${selectedBookIds.includes(book.id) ? ' book-choice-selected' : ''}`} key={book.id}>
                  <input checked={selectedBookIds.includes(book.id)} disabled={!selectedBookIds.includes(book.id) && selectedBookIds.length === 3} onChange={() => onToggleBook(book.id)} type="checkbox" />
                  <span><strong>{book.title}</strong><small>{book.author} · {book.available_copies} disponibles</small></span>
                </label>
              ))}</div>
            )}
          </fieldset>
          <button className="primary-action" disabled={saving || !memberId || selectedBookIds.length === 0} type="submit">{saving ? 'Registrando…' : 'Confirmar préstamo'}</button>
        </form>
      </section>
      <section className="section-heading"><div><span className="eyebrow eyebrow-purple">MOVIMIENTO</span><h2>Préstamos recientes</h2></div><span className="result-count">{loans.length} registros</span></section>
      <div className="loan-list">
        {loans.length === 0 ? <EmptyState title="No hay préstamos todavía" text="Los préstamos registrados aparecerán aquí." /> : loans.map((loan) => (
          <article className="loan-card" key={loan.id}>
            <div className="loan-card-heading"><div><span className="loan-member">{memberNames.get(loan.member_id) ?? 'Socio'}</span><small>Préstamo · {formatDate(loan.loaned_at)}</small></div><StatusPill status={loan.status} /></div>
            <div className="loan-item-list">{loan.items.map((item) => (
              <div className="loan-item-row" key={item.id}><span><strong>{item.book_title}</strong><small>Vence {formatDate(item.due_at)}</small></span>{item.returned_at ? <span className="returned-label">Devuelto</span> : <button className="text-action" disabled={returningItemId === item.id} onClick={() => onReturn(loan.id, item.id)} type="button">{returningItemId === item.id ? 'Procesando…' : 'Registrar devolución'}</button>}</div>
            ))}</div>
          </article>
        ))}
      </div>
    </>
  )
}

function OverdueView({
  items,
  returningItemId,
  onReturn,
}: {
  items: OverdueLoanItem[]
  returningItemId: string
  onReturn: (loanId: string, itemId: string) => void
}) {
  if (items.length === 0) return <EmptyState title="Todo al día" text="No hay líneas vencidas que requieran seguimiento." />

  return (
    <section className="workspace-card">
      <div className="toolbar"><span className="eyebrow eyebrow-purple">SEGUIMIENTO NECESARIO</span><span className="overdue-total">{items.length} {items.length === 1 ? 'línea vencida' : 'líneas vencidas'}</span></div>
      <div className="overdue-list">{items.map((item) => (
        <article className="overdue-row" key={item.item_id}>
          <span className="overdue-icon" aria-hidden="true">◷</span>
          <span className="overdue-details"><strong>{item.book_title}</strong><small>{item.member_name} · venció el {formatDate(item.due_at)}</small></span>
          <span className="late-days">{item.days_late}<small>días</small></span>
          <button className="secondary-action" disabled={returningItemId === item.item_id} onClick={() => onReturn(item.loan_id, item.item_id)} type="button">{returningItemId === item.item_id ? 'Procesando…' : 'Registrar devolución'}</button>
        </article>
      ))}</div>
    </section>
  )
}

function ReportView({
  from,
  to,
  rows,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  rows: MostBorrowed[]
  onFromChange: (date: string) => void
  onToChange: (date: string) => void
}) {
  return (
    <section className="workspace-card">
      <div className="report-filters">
        <div><span className="eyebrow eyebrow-purple">ANÁLISIS DE PRÉSTAMOS</span><h2>Títulos más consultados</h2></div>
        <div className="date-filters"><label>Desde<input max={to} onChange={(event) => onFromChange(event.target.value)} type="date" value={from} /></label><label>Hasta<input min={from} onChange={(event) => onToChange(event.target.value)} type="date" value={to} /></label></div>
      </div>
      {rows.length === 0 ? <EmptyState title="Sin movimientos en este periodo" text="Prueba con un rango de fechas más amplio." /> : (
        <div className="report-list">{rows.map((row, index) => (
          <article className="report-row" key={row.book_id}>
            <span className="report-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="report-book"><strong>{row.book_title}</strong><small>{row.category_name}</small></span>
            <span className="report-count"><strong>{row.times_borrowed}</strong><small>{row.times_borrowed === 1 ? 'préstamo' : 'préstamos'}</small></span>
          </article>
        ))}</div>
      )}
    </section>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span aria-hidden="true">✦</span><strong>{title}</strong><p>{text}</p></div>
}

export default LibraryDashboard
