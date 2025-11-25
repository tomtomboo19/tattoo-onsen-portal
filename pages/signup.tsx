import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Signup() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return setMessage('表示名を入力してください')
    if (!email.trim()) return setMessage('メールアドレスを入力してください')
    if (!password) return setMessage('パスワードを入力してください')
    if (password !== confirmPassword) return setMessage('パスワードが一致しません')

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName, email, password }),
      })
      const json = await res.json()
      if (res.status === 201) {
        setMessage('登録が完了しました。ログインしてご利用ください。')
        setTimeout(() => router.push('/'), 1400)
      } else if (res.status === 501 && json && json.suggestedModel) {
        setMessage('サーバー側で User モデルが未定義です。管理者に依頼してスキーマを更新してください。コンソール参照。')
        console.error('signup: server response', json)
      } else {
        setMessage('登録に失敗しました: ' + (json?.error || res.status))
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
        <h1 style={{ margin: 0 }}>ユーザー登録</h1>
        <p style={{ marginTop: 8, color: '#4b5563' }}>アカウントを作成してサービスを利用してください。必須項目は <span className="required">*</span> です。</p>

        <form onSubmit={handleSubmit} className="signup-form" style={{ marginTop: 12 }}>
          <div className="form-row">
            <label className="form-label">表示名 <span className="required">*</span></label>
            <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="例: 山田 太郎" />
            <div className="helper-text">サイト上で表示される名前です（公開）。</div>
          </div>

          <div className="form-row">
            <label className="form-label">メールアドレス <span className="required">*</span></label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <div className="helper-text">ログインに使用します。確認のメールは送信されません（開発）。</div>
          </div>

          <div className="form-row two-cols">
            <div>
              <label className="form-label">パスワード <span className="required">*</span></label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8文字以上" />
            </div>
            <div>
              <label className="form-label">パスワード確認 <span className="required">*</span></label>
              <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="確認のため再入力" />
            </div>
          </div>

          {message && <div className="form-message">{message}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '登録中...' : 'アカウント作成'}</button>
            <button type="button" className="btn btn-back" onClick={() => router.push('/')}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  )
}

