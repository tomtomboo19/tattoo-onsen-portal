import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import {
    extractTokenFromCookie,
    verifySessionToken,
} from '../../../../lib/adminSession'

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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (!requireAdmin(req, res)) return

    if (req.method !== 'GET') {
        res.status(405).json({ ok: false, error: 'method_not_allowed' })
        return
    }

    const { id } = req.query
    const facilityId = Number(id)

    if (!facilityId || Number.isNaN(facilityId)) {
        res.status(400).json({ ok: false, error: 'invalid_id' })
        return
    }

    try {
        const facility = await prisma.facility.findUnique({
            where: { id: facilityId },
        })

        if (!facility) {
            res.status(404).json({ ok: false, error: 'not_found' })
            return
        }

        res.status(200).json({ ok: true, data: facility })
    } catch (e) {
        res.status(500).json({ ok: false, error: 'internal_error' })
    }
}
