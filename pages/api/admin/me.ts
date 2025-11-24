import type { NextApiRequest, NextApiResponse } from 'next'
import { extractTokenFromCookie, verifySessionToken, createSessionCookie } from '../../../lib/adminSession'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 一時的なデバッグ用: /api/admin/me?force=1 で強制ログイン状態にする
  if (req.query.force === '1') {
    const cookie = createSessionCookie()
    console.log('[me][force] set-cookie=', cookie)
    res.setHeader('Set-Cookie', cookie)
    res.status(200).json({ ok: true, authed: true, forced: true })
    return
  }

  const cookieHeader = req.headers.cookie
  console.log('[me] headers cookie=', cookieHeader)

  if (!cookieHeader) {
    console.log('[me] no cookie header')
    res.status(401).json({ ok: false, authed: false, reason: 'no-cookie' })
    return
  }

  const token = extractTokenFromCookie(cookieHeader)
  console.log('[me] extracted token=', token)

  const valid = verifySessionToken(token)
  console.log('[me] valid=', valid)

  if (!valid) {
    res.status(401).json({ ok: false, authed: false, reason: 'invalid-token' })
    return
  }

  res.status(200).json({ ok: true, authed: true })
}
