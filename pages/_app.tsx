import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

// Leaflet & MarkerCluster のスタイルを必ず読み込む
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [headerKeyword, setHeaderKeyword] = useState('')
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null)

  const doHeaderSearch = (kw?: string) => {
    const k = kw ?? headerKeyword
    // navigate to home with keyword as query so the index page can pick it up
    router.push({ pathname: '/', query: k ? { keyword: k } : {} })
  }

  const scrollToAdmin = () => {
    // navigate to home and scroll to admin section via hash
    router.push('/#admin')
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        setUser(JSON.parse(raw))
      }
    } catch (e) {}
  }, [])

  // Listen for login events dispatched from the login page so the header updates
  useEffect(() => {
    const onLogin = (e: Event) => {
      try {
        // CustomEvent with detail set in login.tsx
        const ce = e as CustomEvent
        if (ce?.detail) setUser(ce.detail as any)
        else {
          const raw = localStorage.getItem('user')
          if (raw) setUser(JSON.parse(raw))
        }
      } catch (e) {}
    }
    window.addEventListener('user:login', onLogin)
    return () => window.removeEventListener('user:login', onLogin)
  }, [])

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>

      {/* Global header */}
      <header className="site-header">
        <div className="container header-inner">
          <div className="header-left">
            <div className="logo">タトゥーOK 温泉・サウナ</div>
          </div>

          <div className="header-center">
            <div className="header-search">
              <input
                aria-label="サイト内検索"
                placeholder="キーワードでサウナ検索"
                value={headerKeyword}
                onChange={e => setHeaderKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doHeaderSearch() }}
              />
              <button className="search-btn" onClick={() => doHeaderSearch()} aria-label="検索">
                🔍
              </button>
            </div>
          </div>

          <div className="header-right">
            {user ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: '#0f1729' }}>ようこそ、{user.name}さん</div>
                <button className="btn-outline" onClick={() => { localStorage.removeItem('user'); setUser(null); router.push('/'); }}>ログアウト</button>
              </div>
            ) : (
              <>
                <button className="btn-outline" onClick={() => router.push('/login')}>ログイン</button>
                <button className="btn-primary" onClick={() => router.push('/signup')}>新規登録</button>
              </>
            )}
          </div>
        </div>
      </header>

      <Component {...pageProps} />
    </>
  )
}

export default App
