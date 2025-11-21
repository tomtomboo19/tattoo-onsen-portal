import type { NextApiRequest, NextApiResponse } from 'next'

export function parseCookies(cookieHeader?: string) {
  const obj: Record<string, string> = {}
  if (!cookieHeader) return obj
  cookieHeader.split(';').forEach(part => {
    const [k, ...v] = part.split('=')
    obj[k.trim()] = decodeURIComponent((v || []).join('=').trim())
  })
  return obj
}

export function isAdminRequest(req: NextApiRequest) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies['tattoo_admin'] === '1'
}

export function setAdminCookie(res: NextApiResponse) {
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  // HttpOnly cookie
  res.setHeader('Set-Cookie', `tattoo_admin=1; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Lax`)
}
