import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'method_not_allowed' })
        return
    }

    const { id } = req.query
    const facilityId = Number(id)
    if (!facilityId || Number.isNaN(facilityId)) {
        res.status(400).json({ error: 'invalid_id' })
        return
    }

    try {
        const facility = await prisma.facility.findUnique({
            where: { id: facilityId },
        })

        if (!facility) {
            res.status(404).json({ error: 'not_found' })
            return
        }

        res.status(200).json(facility)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'server_error' })
    }
}
