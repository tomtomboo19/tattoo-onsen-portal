import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export function createFacilitiesHandler(db: any) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      if (req.method === 'GET') {
        const { prefecture, city, keyword, tags, page = '1', pageSize = '10' } = req.query
        const where: any = { status: 'approved' }
        if (prefecture) where.prefecture = String(prefecture)
        if (city) where.city = String(city)

        // Build OR conditions for keyword and tags
        const orConditions: any[] = []
        if (keyword) {
          const k = String(keyword)
          orConditions.push(
            { name: { contains: k } },
            { description: { contains: k } },
            { tags: { contains: k } }
          )
        }
        if (tags) {
          const t = String(tags).split(',').map(s => s.trim()).filter(Boolean)
          t.forEach((tag: string) => {
            orConditions.push({ tags: { contains: tag } })
          })
        }
        // Only add OR clause if there are conditions
        if (orConditions.length > 0) {
          where.OR = orConditions
        }

        const p = Math.max(1, parseInt(String(page), 10) || 1)
        const ps = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 10))
        const skip = (p - 1) * ps

        const [total, items] = await Promise.all([
          db.facility.count({ where }),
          db.facility.findMany({ where, skip, take: ps, orderBy: { createdAt: 'desc' } })
        ])

        // If pagination was requested, return structured response; otherwise return array for simplicity
        const isPagingRequested = Boolean(req.query.page || req.query.pageSize)
        if (isPagingRequested) {
          res.status(200).json({ items, total, page: p, pageSize: ps })
        } else {
          res.status(200).json(items)
        }
        return
      }
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'server_error' })
    }
  }
}

export default createFacilitiesHandler(prisma)
