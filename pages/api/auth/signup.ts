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

  const { name, email, password } = req.body || {}
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name_email_password_required' })
  }

  // Basic email format check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email' })
  }

  // Hash password with salt using pbkdf2
  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)

  try {
    // Attempt to create a User record. If you don't have a User model in Prisma schema
    // this call will fail — we'll catch and return an actionable error.
    const created = await (prisma as any).user.create({
      data: {
        name,
        email,
        passwordHash,
        passwordSalt: salt,
        role: 'user',
      },
    })
    return res.status(201).json({ created })
  } catch (e: any) {
    console.error('[signup] error=', e?.message ?? e)
    const msg = String(e?.message ?? '')
    if (msg.includes('P2003') || msg.includes('model') || msg.includes('Unknown arg')) {
      // Likely the User model does not exist in Prisma schema
      return res.status(501).json({
        error: 'user_model_missing',
        message:
          'Prisma schema に `User` モデルが見つかりません。`prisma/schema.prisma` に User モデルを追加し、`npx prisma migrate dev` を実行してください。',
        suggestedModel: {
          /// example model
          User: `model User {\n  id Int @id @default(autoincrement())\n  name String\n  email String @unique\n  passwordHash String\n  passwordSalt String\n  role String @default("user")\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}`,
        },
      })
    }
    return res.status(500).json({ error: 'server_error' })
  }
}
