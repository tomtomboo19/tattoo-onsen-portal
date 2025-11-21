import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { name, prefecture = '東京都', city, address, description, isTattooOk, latitude, longitude } = req.body
      if (!name) return res.status(400).json({ error: 'name_required' })
      const created = await prisma.facility.create({
        data: {
          name,
          prefecture,
          city,
          address,
          description,
          isTattooOk: !!isTattooOk,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          source: 'user',
          status: 'pending'
        }
      })
      return res.status(201).json({ created })
    }
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server_error' })
  }
}
