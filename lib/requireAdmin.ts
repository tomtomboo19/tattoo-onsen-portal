import type { NextApiRequest, NextApiResponse } from 'next'
import { extractTokenFromCookie, verifySessionToken } from './adminSession'

export function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const cookieHeader = req.headers.cookie
  console.log('[requireAdmin] headers cookie=', cookieHeader)

  // ここで tattoo_admin_session クッキーだけ抜き出してログ
  const token = extractTokenFromCookie(cookieHeader)
  console.log('[requireAdmin] extracted token (tattoo_admin_session)=', token)

  const valid = verifySessionToken(token)
  console.log('[requireAdmin] valid=', valid)

  if (!valid) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return false
  }
  return true
}
