import { useEffect, useState } from 'react'

type Facility = {
  id: number
  name: string
  city?: string
  prefecture?: string
  status: string
}

export default function AdminPage() {
  const [items, setItems] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/pending')
    if (res.status === 401) {
      setAuthed(false)
      setItems([])
      setLoading(false)
      return
    }
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/admin/me')
        if (res.ok) {
          const data = await res.json()
          setAuthed(data.authed)
          if (data.authed) {
            await load()
          }
        } else {
          setAuthed(false)
        }
      } catch {
        setAuthed(false)
      }
    }
    init()
  }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/facility/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      if (res.ok) {
        setAuthed(true)
        setPassword('')
        load()
      } else {
        alert('認証に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  async function doLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    setItems([])
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>管理画面（仮） - 投稿の承認</h1>
      {loading && <div>読み込み中...</div>}
      {!authed && (
        <form onSubmit={doLogin} style={{ marginBottom: 12 }}>
          <label>管理者パスワード: <input value={password} onChange={e => setPassword(e.target.value)} type="password" /></label>
          <button style={{ marginLeft: 8 }} type="submit">ログイン</button>
        </form>
      )}
      {authed && <button onClick={doLogout}>ログアウト</button>}
      <ul>
        {items.map(i => (
          <li key={i.id} style={{ marginBottom: 12 }}>
            <strong>{i.name}</strong> <span style={{ color: '#666' }}>{i.prefecture}{i.city ? ` / ${i.city}` : ''}</span>
            <div>
              <button onClick={() => updateStatus(i.id, 'approved')}>承認</button>
              <button onClick={() => updateStatus(i.id, 'rejected')} style={{ marginLeft: 8 }}>却下</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
