import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { prefecture, city, keyword, tags, page = '1', pageSize = '10' } = req.query
      const where: any = { status: 'approved' }
      if (prefecture) where.prefecture = String(prefecture)
      if (city) where.city = String(city)
      if (keyword) {
        const k = String(keyword)
        where.OR = [
          { name: { contains: k } },
          { description: { contains: k } },
          { tags: { contains: k } }
        ]
      }
      // tags: optional comma separated values, match any
      if (tags) {
        const t = String(tags).split(',').map(s => s.trim()).filter(Boolean)
        if (t.length > 0) {
          where.OR = [...(where.OR || []), ...t.map(tag => ({ tags: { contains: tag } }))]
        }
      }

      const p = Math.max(1, parseInt(String(page), 10) || 1)
      const ps = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 10))
      const skip = (p - 1) * ps

      const [total, items] = await Promise.all([
        prisma.facility.count({ where }),
        prisma.facility.findMany({ where, skip, take: ps, orderBy: { createdAt: 'desc' } })
      ])

      res.status(200).json({ items, total, page: p, pageSize: ps })
      return
    }
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server_error' })
  }
}
