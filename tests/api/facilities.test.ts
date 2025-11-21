import { describe, it, expect } from 'vitest'
import { createFacilitiesHandler } from '../../pages/api/facilities'

function makeReq(query = {}) {
  return { method: 'GET', query } as any
}
function makeRes() {
  const res: any = {}
  res.status = (code: number) => { res._status = code; return res }
  res.json = (payload: any) => { res._json = payload; return res }
  res.setHeader = () => {}
  res.end = () => {}
  return res
}

describe('GET /api/facilities', () => {
  it('returns paginated shape when page provided', async () => {
    const mockDb: any = {
      facility: {
        count: async ({ where }: any) => 2,
        findMany: async ({ where, skip, take }: any) => [
          { id: 1, name: 'A', description: 'a', latitude: 35.6, longitude: 139.6 },
          { id: 2, name: 'B', description: 'b', latitude: 35.7, longitude: 139.7 }
        ]
      }
    }

    const handler = createFacilitiesHandler(mockDb)
    const req = makeReq({ page: '1', pageSize: '10', prefecture: '東京都' })
    const res = makeRes()
    await handler(req, res)
    expect(res._status).toBe(200)
    expect(res._json).toHaveProperty('items')
    expect(res._json.total).toBe(2)
  })

  it('returns array when no paging', async () => {
    const mockDb: any = {
      facility: {
        count: async () => 2,
        findMany: async () => [ { id: 1, name: 'A' }, { id: 2, name: 'B' } ]
      }
    }
    const handler = createFacilitiesHandler(mockDb)
    const req = makeReq({})
    const res = makeRes()
    await handler(req, res)
    expect(res._status).toBe(200)
    expect(Array.isArray(res._json)).toBe(true)
  })
})
