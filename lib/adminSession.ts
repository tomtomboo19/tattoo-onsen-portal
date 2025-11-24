import crypto from 'crypto'

const COOKIE_NAME = 'tattoo_admin_session' // ← 実際に使う名前に合わせる
const COOKIE_MAX_AGE = 60 * 60 * 24 // 1日

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    console.error('ADMIN_SESSION_SECRET is not set')  // ← デバッグ用ログ
    throw new Error('ADMIN_SESSION_SECRET is not set')
  }
  return secret
}

// シンプルな署名付きトークンを生成する
export function createSessionToken() {
  const secret = getSecret()
  const payload = JSON.stringify({
    role: 'admin',
    iat: Date.now()
  })
  const base = Buffer.from(payload).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(base).digest('base64url')
  return `${base}.${sig}`
}

// セッション Cookie を生成する（Set-Cookie 用文字列）
export function createSessionCookie(): string {
  const token = createSessionToken()
  const maxAge = 60 * 60 * 24 * 7 // 7 days

  // ローカル開発では Secure を外す / SameSite を Lax に
  const secure =
    process.env.NODE_ENV === 'production'
      ? '; Secure; SameSite=Strict'
      : '; SameSite=Lax'

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${maxAge}${secure}`
}

// セッション Cookie を削除する（ログアウト用）
export function clearSessionCookie(): string {
  const secure =
    process.env.NODE_ENV === 'production'
      ? '; Secure; SameSite=Strict'
      : '; SameSite=Lax'

  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0${secure}`
}

// Cookie ヘッダからトークン文字列を取り出す
export function extractTokenFromCookie(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';').map(v => v.trim())
  const prefix = `${COOKIE_NAME}=`
  const found = cookies.find(c => c.startsWith(prefix))
  if (!found) return undefined
  return found.slice(prefix.length)
}

// トークンを検証する
export function verifySessionToken(token: string | undefined | null): boolean {
  console.log('[verifySessionToken] raw token=', token)
  if (!token) {
    console.warn('[verifySessionToken] no token')
    return false
  }

  const secret = getSecret()
  const parts = token.split('.')
  if (parts.length !== 2) {
    console.warn('[verifySessionToken] invalid token format')
    return false
  }
  const [base, sig] = parts
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(base)
    .digest('base64url')

  // 長さが違うと timingSafeEqual で例外になるのでガード
  if (Buffer.byteLength(sig) !== Buffer.byteLength(expectedSig)) {
    console.warn('[verifySessionToken] signature length mismatch')
    return false
  }

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    console.warn('[verifySessionToken] signature mismatch')
    return false
  }

  try {
    const json = Buffer.from(base, 'base64url').toString('utf8')
    const payload = JSON.parse(json)
    console.log('[verifySessionToken] payload=', payload)
    return payload.role === 'admin'
  } catch (e) {
    console.error('[verifySessionToken] failed to parse payload', e)
    return false
  }
}
