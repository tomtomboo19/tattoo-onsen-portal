import useSWR from 'swr'
import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import FacilityCard from '../components/FacilityCard'
import MapPlaceholder from '../components/MapPlaceholder'

const MapClient = dynamic(() => import('../components/MapClient'), { ssr: false, loading: () => <MapPlaceholder /> })

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TOKYO_CITIES = ['新宿区', '渋谷区', '港区', '世田谷区']
const TAG_OPTIONS = ['温泉', 'サウナ']

export default function Home() {
  const [prefecture, setPrefecture] = useState('東京都')
  const [city, setCity] = useState('')
  const [keyword, setKeyword] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 6

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (prefecture) params.set('prefecture', prefecture)
    if (city) params.set('city', city)
    if (keyword) params.set('keyword', keyword)
    if (tags.length) params.set('tags', tags.join(','))
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return '/api/facilities?' + params.toString()
  }, [prefecture, city, keyword, tags, page])

  const { data, error, isValidating } = useSWR(query, fetcher)

  const facilities = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleTag(t: string) {
    setPage(1)
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]))
  }

  function onSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setPage(1)
  }

  return (
    <div className="container">
      <h1 className="site-title">タトゥーOK 温泉・サウナ ポータル（開発版）</h1>
      <p className="subtitle">現在は東京のデータのみを対象に開発しています。</p>

  {/* client-only map (Leaflet) - loads dynamically to avoid SSR issues */}
  <MapClient markers={facilities} />

      <section style={{ marginTop: 16 }}>
        <h2>検索</h2>
        <form onSubmit={onSearch} className="search-form">
          <label>
            都道府県
            <select className="select" value={prefecture} onChange={(e) => { setPrefecture(e.target.value); setPage(1) }}>
              <option value="東京都">東京都</option>
              {/* 追加は将来 */}
            </select>
          </label>

          <label>
            市区町村
            <select className="select" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }}>
              <option value="">全て</option>
              {TOKYO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            キーワード
            <input className="input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例: サウナ" />
          </label>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {TAG_OPTIONS.map(t => (
              <label key={t} style={{ fontSize: 13 }}>
                <input type="checkbox" checked={tags.includes(t)} onChange={() => toggleTag(t)} /> {t}
              </label>
            ))}
          </div>

          <button className="btn" type="submit">検索</button>
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>検索結果</h2>
        {isValidating && <div>読み込み中...</div>}
        {error && <div>エラーが発生しました</div>}

        {facilities.length === 0 && !isValidating && <div>該当する施設が見つかりません。</div>}

        {facilities.map((f: any) => (
          <FacilityCard key={f.id} id={f.id} name={f.name} description={f.description} prefecture={f.prefecture} city={f.city} isTattooOk={f.isTattooOk} />
        ))}

        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="前のページへ"
          >
            <span className="icon" aria-hidden>
              {/* left chevron */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#213547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </span>
            前へ
          </button>

          <div className="page-info">Page {page} / {totalPages} (全 {total} 件)</div>

          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="次のページへ"
          >
            次へ
            <span className="icon" aria-hidden>
              {/* right chevron */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#213547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>情報提供</h2>
        <p>施設の情報を知っている場合は投稿してください（簡易フォームは開発中）</p>
      </section>
    </div>
  )
}
