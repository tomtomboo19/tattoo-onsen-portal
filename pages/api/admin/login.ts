import type { NextApiRequest, NextApiResponse } from 'next'
import { setAdminCookie } from '../../../lib/admin'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { password } = req.body || {}
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  if (!password || password !== expected) return res.status(401).json({ error: 'invalid_credentials' })

  setAdminCookie(res)
  return res.status(200).json({ ok: true })
}
