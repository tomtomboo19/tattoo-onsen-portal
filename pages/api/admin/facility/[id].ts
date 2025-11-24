import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/requireAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return

  const id = Number(req.query.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ ok: false, error: 'Invalid id' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const { status } = req.body as { status?: string }
  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ ok: false, error: 'Invalid status' })
    return
  }

  await prisma.facility.update({
    where: { id },
    data: { status },
  })

  res.status(200).json({ ok: true })
}
