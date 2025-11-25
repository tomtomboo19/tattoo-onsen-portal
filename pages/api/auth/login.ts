import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import crypto from 'crypto'

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' })

  try {
    const user = await (prisma as any).user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const expected = hashPassword(password, user.passwordSalt)
    if (expected !== user.passwordHash) return res.status(401).json({ error: 'invalid_credentials' })

    // Authentication success — return user info (no session created yet)
    return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
  } catch (e) {
    console.error('[auth/login] error=', e)
    return res.status(500).json({ error: 'server_error' })
  }
}
