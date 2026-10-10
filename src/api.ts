export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  role: 'admin' | 'librarian'
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

export async function login(username: string, password: string): Promise<LoginResponse> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
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

  const result = body as LoginResponse | null
  if (
    !result ||
    typeof result.access_token !== 'string' ||
    result.token_type !== 'Bearer' ||
    typeof result.expires_in !== 'number' ||
    (result.role !== 'admin' && result.role !== 'librarian')
  ) {
    throw new ApiError('El servidor devolvió una respuesta de autenticación no válida.', response.status)
  }

  return result
}
