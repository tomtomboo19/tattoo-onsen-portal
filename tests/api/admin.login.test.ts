import { vi, describe, it, expect, beforeEach } from 'vitest'
import loginHandler from '../../pages/api/admin/login'

function makeRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  res.setHeader = vi.fn()
  res.end = vi.fn()
  return res
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    delete process.env.ADMIN_PASSWORD
  })

  it('succeeds with default password', async () => {
    const req: any = { method: 'POST', body: { password: 'admin123' } }
    const res = makeRes()
    await loginHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.setHeader).toHaveBeenCalled()
  })

  it('fails with wrong password', async () => {
    const req: any = { method: 'POST', body: { password: 'wrong' } }
    const res = makeRes()
    await loginHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('succeeds with custom ADMIN_PASSWORD', async () => {
    process.env.ADMIN_PASSWORD = 'topsecret'
    const req: any = { method: 'POST', body: { password: 'topsecret' } }
    const res = makeRes()
    await loginHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
