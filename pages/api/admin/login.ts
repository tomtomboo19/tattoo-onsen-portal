import type { NextApiRequest, NextApiResponse } from 'next'
import { createSessionCookie } from '../../../lib/adminSession'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[login] method=', req.method)
  console.log('[login] headers cookie=', req.headers.cookie)

  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const { password } = req.body as { password?: string }
  console.log('[login] body password=', password)
  console.log('[login] env ADMIN_PASSWORD exists=', !!process.env.ADMIN_PASSWORD)

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[login] ADMIN_PASSWORD not set')
    res.status(500).json({ ok: false, error: 'ADMIN_PASSWORD is not set' })
    return
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.warn('[login] invalid password')
    res.status(401).json({ ok: false, error: 'Invalid password' })
    return
  }

  // 認証成功: セッションクッキーを発行
  const cookie = createSessionCookie()
  console.log('[login] set-cookie (string)=', cookie)
  res.setHeader('Set-Cookie', cookie)

  // ここで実際に付いたレスポンスヘッダをログ
  console.log('[login] response headers before send=', res.getHeaders())

  res.status(200).json({ ok: true })
}
