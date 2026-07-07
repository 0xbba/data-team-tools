import { TOKEN_KEY } from '../constants'

let _authToken: string | null = null

export function loadToken(): string | null {
  if (_authToken) return _authToken
  try { _authToken = localStorage.getItem(TOKEN_KEY) } catch { /* ignore */ }
  return _authToken
}

export function saveToken(token: string) {
  _authToken = token
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
}

export function clearToken() {
  _authToken = null
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

export function authHeaders(): Record<string, string> {
  const token = loadToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}
