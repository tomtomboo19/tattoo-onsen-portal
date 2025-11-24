import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import {
    extractTokenFromCookie,
    verifySessionToken,
} from '../../../lib/adminSession'

function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
    const cookieHeader = req.headers.cookie
    const token = extractTokenFromCookie(cookieHeader)
    const valid = verifySessionToken(token)
    if (!valid) {
        res.status(401).json({ ok: false, error: 'unauthorized' })
        return false
    }
    return true
}

// 一覧取得用ハンドラ
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (!requireAdmin(req, res)) return

    if (req.method !== 'GET') {
        res.status(405).json({ ok: false, error: 'method_not_allowed' })
        return
    }

    const { q } = req.query

    try {
        const facilities = await prisma.facility.findMany({
            where: q
                ? {
                    OR: [
                        {
                            name: {
                                contains: String(q),
                                mode: 'insensitive',
                            },
                        },
                        {
                            address: {
                                contains: String(q),
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : undefined,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                address: true,
            },
        })

        res.status(200).json({ ok: true, data: facilities })
    } catch (e) {
        res.status(500).json({ ok: false, error: 'internal_error' })
    }
}
