import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'
import { isAdminRequest } from '../../../../../lib/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id_required' })
    const fid = Number(id)

    if (req.method === 'POST') {
      if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' })
      const { status } = req.body
      if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid_status' })
      const updated = await prisma.facility.update({ where: { id: fid }, data: { status } })
      return res.status(200).json({ updated })
    }

    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server_error' })
  }
}
