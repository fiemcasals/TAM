import { cookies } from 'next/headers'
import crypto from 'crypto'

const SECRET = process.env.SESSION_SECRET || 'fallback-secret-at-least-32-chars-long-12345678'
const ALGORITHM = 'aes-256-cbc'
const KEY = crypto.scryptSync(SECRET, 'salt', 32)
const IV_LENGTH = 16

export interface SessionPayload {
  userId: string
  name: string
  email: string
  role: string
  expiresAt: string
}

// Encrypt payload
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

// Decrypt payload
export function decrypt(text: string): string | null {
  try {
    const parts = text.split(':')
    if (parts.length !== 2) return null
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedText = Buffer.from(parts[1], 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (e) {
    return null
  }
}
export async function createSession(user: { id: string; name: string; email: string; role: string }) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
  const payload: SessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    expiresAt: expiresAt.toISOString()
  }
  const encrypted = encrypt(JSON.stringify(payload))
  
  const cookieStore = await cookies()
  cookieStore.set('tam_session', encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/'
  })
  
  cookieStore.set('tam_user_role', user.role, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/'
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('tam_session')
  if (!cookie || !cookie.value) return null
  
  const decrypted = decrypt(cookie.value)
  if (!decrypted) return null
  
  try {
    const payload = JSON.parse(decrypted) as SessionPayload
    if (new Date(payload.expiresAt) < new Date()) {
      await destroySession()
      return null
    }
    return payload
  } catch (e) {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('tam_session')
  cookieStore.delete('tam_user_role')
}
