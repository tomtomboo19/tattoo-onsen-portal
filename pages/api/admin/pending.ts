import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { requireAdmin } from '../../../lib/requireAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  const facilities = await prisma.facility.findMany({
    where: { status: 'pending' },
    orderBy: { id: 'desc' },
  })
  res.status(200).json(facilities)
}
