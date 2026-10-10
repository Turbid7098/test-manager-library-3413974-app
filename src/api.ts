export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  role: 'admin' | 'librarian'
}

export interface Category {
  id: string
  name: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: Category
  total_copies: number
  available_copies: number
  cover_key: string | null
}

export interface Member {
  id: string
  full_name: string
  document_number: string
  active_loans?: number
}

export interface LoanItem {
  id: string
  book_id: string
  book_title: string
  isbn: string
  category_name: string
  due_at: string
  returned_at: string | null
}

export interface Loan {
  id: string
  member_id: string
  loaned_at: string
  status: 'open' | 'overdue' | 'closed'
  items: LoanItem[]
}

export interface OverdueLoanItem {
  loan_id: string
  item_id: string
  book_title: string
  member_name: string
  due_at: string
  days_late: number
}

export interface MostBorrowed {
  book_id: string
  book_title: string
  category_name: string
  times_borrowed: number
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  total: number
}

interface ListResponse<T> {
  items: T[]
}

interface ReportResponse {
  rows: MostBorrowed[]
}

interface ApiErrorBody {
  code?: string
  message?: string
}

export class ApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

async function request<T>(path: string, token?: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, '')}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Comprueba que la API esté disponible e inténtalo de nuevo.', 0)
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body as ApiErrorBody | null
    throw new ApiError(
      error?.message || 'No fue posible iniciar sesión. Inténtalo de nuevo.',
      response.status,
      error?.code,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (body === null) {
    throw new ApiError('El servidor devolvió una respuesta vacía o no válida.', response.status)
  }

  return body as T
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const result = await request<LoginResponse>('auth/login', undefined, {
    method: 'POST',
    body: { username, password },
  })
  if (
    typeof result.access_token !== 'string' ||
    result.token_type !== 'Bearer' ||
    typeof result.expires_in !== 'number' ||
    (result.role !== 'admin' && result.role !== 'librarian')
  ) {
    throw new ApiError('El servidor devolvió una respuesta de autenticación no válida.', 200)
  }
  return result
}

export function getCategories(token: string): Promise<ListResponse<Category>> {
  return request('categories', token)
}

export function getBooks(token: string, query = ''): Promise<Page<Book>> {
  const params = new URLSearchParams({ page: '1', size: '50' })
  if (query.trim()) params.set('q', query.trim())
  return request(`books?${params.toString()}`, token)
}

export function createBook(
  token: string,
  book: { title: string; author: string; isbn: string; category_id: string; total_copies: number },
): Promise<Book> {
  return request('books', token, { method: 'POST', body: book })
}

export function updateBook(
  token: string,
  id: string,
  book: { title: string; author: string; category_id: string; total_copies: number },
): Promise<Book> {
  return request(`books/${encodeURIComponent(id)}`, token, { method: 'PUT', body: book })
}

export function deleteBook(token: string, id: string): Promise<void> {
  return request<void>(`books/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
}

export function getMembers(token: string, query = ''): Promise<Page<Member>> {
  const params = new URLSearchParams({ page: '1', size: '50' })
  if (query.trim()) params.set('q', query.trim())
  return request(`members?${params.toString()}`, token)
}

export function createMember(
  token: string,
  member: { full_name: string; document_number: string },
): Promise<Member> {
  return request('members', token, { method: 'POST', body: member })
}

export function getLoans(token: string): Promise<Page<Loan>> {
  return request('loans?page=1&size=50', token)
}

export function createLoan(token: string, memberId: string, bookIds: string[]): Promise<Loan> {
  return request('loans', token, {
    method: 'POST',
    body: { member_id: memberId, items: bookIds.map((bookId) => ({ book_id: bookId })) },
  })
}

export function returnLoanItem(token: string, loanId: string, itemId: string): Promise<LoanItem> {
  return request(
    `loans/${encodeURIComponent(loanId)}/items/${encodeURIComponent(itemId)}/return`,
    token,
    { method: 'POST' },
  )
}

export function getOverdueLoans(token: string): Promise<ListResponse<OverdueLoanItem>> {
  return request('loans/overdue', token)
}

export function getMostBorrowed(
  token: string,
  from: string,
  to: string,
): Promise<ReportResponse> {
  const params = new URLSearchParams({ from, to })
  return request(`reports/most-borrowed?${params.toString()}`, token)
}
