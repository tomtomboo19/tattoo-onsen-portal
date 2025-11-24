import type { NextApiRequest, NextApiResponse } from 'next'
import { clearSessionCookie } from '../../../lib/adminSession'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const cookie = clearSessionCookie()
  console.log('[logout] set-cookie=', cookie)
  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ ok: true })
}
