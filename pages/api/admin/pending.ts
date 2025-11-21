import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminRequest } from '../../../lib/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' })
      const items = await prisma.facility.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } })
      return res.status(200).json(items)
    }
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server_error' })
  }
}
