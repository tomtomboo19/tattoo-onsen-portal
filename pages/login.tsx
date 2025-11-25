import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return setMessage('メールアドレスを入力してください')
    if (!password) return setMessage('パスワードを入力してください')

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (res.status === 200) {
        // login API returns user info
        const u = json?.user ?? null
        if (u) setUser(u)
  // persist simple client-side session
  try { localStorage.setItem('user', JSON.stringify(u)) } catch (e) {}
  // notify other parts of the app in the same tab that a login occurred
  try { window.dispatchEvent(new CustomEvent('user:login', { detail: u })) } catch (e) {}
        setMessage(null)
        // keep on page and show success UI
      } else {
        setMessage('ログインに失敗しました: ' + (json?.error || res.status))
      }
    } catch (e) {
      setMessage('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="card form-card">
        {!user ? (
          <>
            <h1 style={{ margin: 0 }}>ログイン</h1>
            <p style={{ marginTop: 8, color: '#4b5563' }}>登録済みのメールアドレスとパスワードでログインしてください。</p>

            <form onSubmit={handleSubmit} className="signup-form" style={{ marginTop: 12 }}>
              <div className="form-row">
                <label className="form-label">メールアドレス</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <div className="form-row">
                <label className="form-label">パスワード</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" />
              </div>

              {message && <div className="form-message">{message}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'ログイン中...' : 'ログイン'}</button>
                <button type="button" className="btn btn-back" onClick={() => router.push('/signup')}>新規登録</button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>ようこそ、{user.name}さん 🎉</h2>
            <p style={{ color: '#4b5563' }}>ログインに成功しました。下のボタンでトップページへ移動できます。</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => router.push('/')}>ホームへ</button>
              <button className="btn btn-back" onClick={() => { setUser(null); setMessage(null); }}>別アカウントでログイン</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
