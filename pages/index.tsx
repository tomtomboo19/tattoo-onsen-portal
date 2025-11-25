import useSWR from 'swr'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import L from 'leaflet'
import dynamic from 'next/dynamic'
import FacilityCard from '../components/FacilityCard'
import MapPlaceholder from '../components/MapPlaceholder'
import FilterModal from '../components/FilterModal'

const MapClient = dynamic(() => import('../components/MapClient'), {
    ssr: false,
    loading: () => <MapPlaceholder />,
})

// 管理系 API もクッキーを送るようにする
const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then(r => r.json())

const TOKYO_CITIES = ['新宿区', '渋谷区', '港区', '世田谷区']
const TAG_OPTIONS = ['温泉', 'サウナ']

// 47都道府県（表示用）
const PREFECTURES = [
    '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
    '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
    '新潟県','富山県','石川県','福井県','山梨県','長野県',
    '岐阜県','静岡県','愛知県','三重県',
    '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
    '鳥取県','島根県','岡山県','広島県','山口県',
    '徳島県','香川県','愛媛県','高知県',
    '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'
]

async function checkMe() {
    const res = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    console.log('[checkMe] status=', res.status, 'body=', json)
    return { status: res.status, body: json }
}

async function login(password: string) {
    const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
    })
    const json = await res.json().catch(() => ({}))
    console.log('[login(client)] status=', res.status, 'body=', json)
    return { status: res.status, body: json }
}

async function logout() {
    const res = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    console.log('[logout(client)] status=', res.status, 'body=', json)
    return { status: res.status, body: json }
}

export default function Home() {
    const [prefecture, setPrefecture] = useState('東京都')
    const [city, setCity] = useState('')
    const [keyword, setKeyword] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const pageSize = 6
    const [sort, setSort] = useState('ikitai')
    const [isFilterModalOpen, setFilterModalOpen] = useState(false)
    const [detailedFilters, setDetailedFilters] = useState<Record<string, string[]>>({})
    const [filterFocusCategory, setFilterFocusCategory] = useState<string | null>(null)

    // モーダル用: 選択中の施設 ID
    const [selectedFacilityId, setSelectedFacilityId] =
        useState<number | null>(null)

    // 管理 UI 用の状態
    

    // 施設ID → Leaflet マーカー
    const markersRef = useRef<Map<number, L.Marker>>(new Map())

    // マップ本体の参照を保持しておき、marker._map のような保護されたプロパティに触らずに
    // public API (map.panTo) を呼べるようにする
    const mapRef = useRef<L.Map | null>(null)

    const handleMarkerReady = (facilityId: number, marker: L.Marker) => {
        markersRef.current.set(facilityId, marker)
    }

    const handleMapReady = (map: L.Map) => {
        mapRef.current = map
    }

    const handleFacilityCardClick = (facilityId: number) => {
        const marker = markersRef.current.get(facilityId)
        if (marker) {
            marker.openPopup()
            // マーカー位置へパン
            const map = mapRef.current
            if (map) {
                map.panTo(marker.getLatLng())
            }
        }
    }

    const query = useMemo(() => {
        const params = new URLSearchParams()
        if (prefecture) params.set('prefecture', prefecture)
        if (city) params.set('city', city)
        if (keyword) params.set('keyword', keyword)
        if (tags.length) params.set('tags', tags.join(','))
        if (sort) params.set('sort', sort)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        return '/api/facilities?' + params.toString()
    }, [prefecture, city, keyword, tags, page, sort])

    const { data, error, isValidating } = useSWR(query, fetcher)

    const facilities = data?.items ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    // ref to the container wrapping the search result items so we can focus the first item
    const resultsRef = useRef<HTMLDivElement | null>(null)

    // When page changes or new results arrive, focus the first result item (for keyboard users / accessibility).
    // Wait until data has finished validating (isValidating === false) or facilities length changes so we don't
    // try focusing before new DOM nodes are rendered.
    useEffect(() => {
        try {
            console.log('[results focus effect] page=', page, 'isValidating=', isValidating, 'facilities=', facilities.length)
            if (isValidating) return
            const container = resultsRef.current
            if (!container) return
            const first = container.querySelector<HTMLElement>('[data-result-item]')
            if (!first) return

            // Scroll the window so the results container is near the top of the viewport.
            // Use a small offset so header/title aren't covered.
            const rect = container.getBoundingClientRect()
            console.log('[results focus effect] container rect=', rect)
            const targetTop = rect.top + window.scrollY - 80
            try {
                window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
            } catch (_) {
                window.scrollTo(0, Math.max(0, targetTop))
            }

            // Focus after a short delay to allow scrolling/layout to settle
            const t = setTimeout(() => {
                try { first.focus() } catch (e) {}
            }, 180)
            return () => clearTimeout(t)
        } catch (e) {
            // ignore
        }
    }, [page, facilities.length, isValidating])

    function toggleTag(t: string) {
        setPage(1)
        setTags(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
        )
    }

    function onSearch(e?: React.FormEvent) {
        e?.preventDefault()
        setPage(1)
    }

    

    // If router query supplies keyword/prefecture/city/page, initialize state accordingly
    // so header searches and direct links work.
    const router = useRouter()
    useEffect(() => {
        try {
            const q = router.query
            if (q.keyword && typeof q.keyword === 'string') setKeyword(q.keyword)
            if (q.prefecture && typeof q.prefecture === 'string') setPrefecture(q.prefecture)
            if (q.city && typeof q.city === 'string') setCity(q.city)
            if (q.page && !Array.isArray(q.page)) setPage(Math.max(1, parseInt(q.page as string, 10) || 1))
        } catch (e) {}
        // run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="container">
            <h1 className="site-title">
                タトゥーOK 温泉・サウナ ポータル（開発版）
            </h1>
            <p className="subtitle">
                現在は東京のデータのみを対象に開発しています。
            </p>

            {/* client-only map (Leaflet) */}
            <MapClient markers={facilities} onMarkerReady={handleMarkerReady} onMapReady={handleMapReady} />

            <section style={{ marginTop: 16 }}>
                <h2>検索</h2>

                <div className="card advanced-search-card">
                    <form onSubmit={onSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* top row: region | conditions | keyword */}
                        <div className="search-row">
                            <div className="filter-box">
                                <div className="filter-label">地域</div>
                                <div className="filter-content">
                                    <select
                                        className="select"
                                        value={prefecture}
                                        onChange={e => { setPrefecture(e.target.value); setCity(''); setPage(1); }}
                                        style={{ width: 200 }}
                                    >
                                        {PREFECTURES.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="select"
                                        value={city}
                                        onChange={e => { setCity(e.target.value); setPage(1); }}
                                        style={{ marginLeft: 8 }}
                                    >
                                        <option value="">選択する</option>
                                        {prefecture === '東京都' ? (
                                            TOKYO_CITIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))
                                        ) : null}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-box">
                                <div className="filter-label">条件</div>
                                <div className="filter-content">
                                    <button type="button" className="btn small" onClick={() => setFilterModalOpen(true)}>選択する ＋</button>
                                </div>
                            </div>

                            <div className="filter-box keyword-box">
                                <div className="filter-label">キーワード</div>
                                <div className="filter-content">
                                    <input
                                        className="input"
                                        value={keyword}
                                        onChange={e => setKeyword(e.target.value)}
                                        placeholder="施設名、エリアなど"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* second row: several small filters + tag chips + search button */}
                        <div className="search-row">
                            <div className="small-filters">
                                <div className="small-filter">
                                    <div className="small-filter-label">サウナ</div>
                                    <div className="small-filter-inputs">
                                        <select className="select">
                                            <option> - </option>
                                        </select>
                                        <select className="select" style={{ marginLeft: 6 }}>
                                            <option>〜</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="small-filter">
                                    <div className="small-filter-label">水風呂</div>
                                    <div className="small-filter-inputs">
                                        <select className="select">
                                            <option> - </option>
                                        </select>
                                        <select className="select" style={{ marginLeft: 6 }}>
                                            <option>〜</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <label style={{ fontSize: 13 }}><input type="checkbox" /> 男性</label>
                                    <label style={{ fontSize: 13 }}><input type="checkbox" /> 女性</label>
                                </div>

                                {/* 温泉/サウナのピルは条件モーダル内へ移動したため表示しない */}
                            </div>

                            <div style={{ marginLeft: 'auto' }}>
                                <button className="btn search-button-blue" type="submit">🔍 検索</button>
                            </div>
                        </div>
                    </form>
                </div>
            </section>

            <FilterModal
                open={isFilterModalOpen}
                initial={detailedFilters}
                focusCategory={filterFocusCategory}
                onApply={sel => {
                    setDetailedFilters(sel)
                    // モーダル内の "主なカテゴリ" 選択を tags に反映
                    const primary = sel['主なカテゴリ'] ?? []
                    if (primary && Array.isArray(primary)) {
                        // only keep 温泉/サウナ values as tags
                        const newTags = primary.filter((v: string) => ['温泉', 'サウナ'].includes(v))
                        setTags(newTags)
                    }
                    setFilterModalOpen(false)
                    setFilterFocusCategory(null)
                }}
                onClose={() => { setFilterModalOpen(false); setFilterFocusCategory(null) }}
            />

            <section style={{ marginTop: 16 }}>
                <h2>検索結果</h2>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#213547' }}>並び順</span>
                        <select
                            className="select"
                            value={sort}
                            onChange={e => { setSort(e.target.value); setPage(1); }}
                            style={{ fontSize: 13 }}
                        >
                            <option value="ikitai">イキタイ 多い順</option>
                            <option value="new">新着順</option>
                            <option value="distance">距離順</option>
                        </select>
                    </div>

                    <div style={{ fontSize: 15, color: '#5b6a80' }}>
                        {isValidating ? (
                            <span>読み込み中...</span>
                        ) : (
                            total > 0 ? (
                                <span>
                                    <span style={{ marginRight: 8 }}>検索結果</span>
                                    <span style={{ color: '#d63939', fontWeight: 700 }}>{total.toLocaleString('ja-JP')}</span>
                                    <span>件</span>
                                </span>
                            ) : (
                                <span>該当する施設がありません</span>
                            )
                        )}
                    </div>
                </div>
                {/* 選択中の条件サマリ */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Tags (主なカテゴリ) */}
                        {tags.map(t => (
                            <span key={t} className="selected-filter-chip">{t}</span>
                        ))}

                        {/* タグがあるときだけ表示するクリアボタン */}
                        {tags.length > 0 && (
                            <button
                                type="button"
                                className="btn-outline"
                                style={{ padding: '6px 10px', fontSize: 13 }}
                                onClick={() => { setTags([]); setPage(1); }}
                                aria-label="タグをクリア"
                            >
                                クリア
                            </button>
                        )}

                        {/* Detailed filters summary - show category:values */}
                        {Object.entries(detailedFilters).map(([cat, values]) => {
                            if (!values || values.length === 0) return null
                            // Skip showing 主なカテゴリ because it's same as tags
                            if (cat === '主なカテゴリ') return null
                            return (
                                <span key={cat} className="selected-filter-group">
                                    <strong style={{ marginRight: 6 }}>{cat}:</strong>
                                    {values.join(', ')}
                                </span>
                            )
                        })}
                    </div>
                </div>
                {isValidating && <div>読み込み中...</div>}
                {error && <div>エラーが発生しました</div>}

                {facilities.length === 0 && !isValidating && (
                    <div>該当する施設が見つかりません。</div>
                )}

                <div ref={resultsRef}>
                    {facilities.map((f: any) => (
                        <FacilityCard
                            key={f.id}
                            id={f.id}
                            name={f.name}
                            description={f.description}
                            prefecture={f.prefecture}
                            city={f.city}
                            address={f.address}
                            isTattooOk={f.isTattooOk}
                            price={f.price}
                            bathTypes={f.bathTypes}
                            tags={f.tags}
                            facilities={f.facilities}
                            amenities={f.amenities}
                            towelOptions={f.towelOptions}
                            paymentMethods={f.paymentMethods}
                            relaxation={f.relaxation}
                            accomodation={f.accomodation}
                            onClick={id => {
                                console.log('[FacilityCard click] id=', id)
                                setSelectedFacilityId(id)
                                handleFacilityCardClick(id)
                            }}
                        />
                    ))}
                </div>

                {/* results container wrapper */}

                <div className="pagination">
                    <button
                        className="page-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        aria-label="前のページへ"
                    >
                        <span className="icon" aria-hidden>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#213547"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="14"
                                height="14"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </span>
                        前へ
                    </button>

                    <div className="page-info">
                        Page {page} / {totalPages} (全 {total} 件)
                    </div>

                    <button
                        className="page-btn"
                        onClick={() =>
                            setPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        aria-label="次のページへ"
                    >
                        次へ
                        <span className="icon" aria-hidden>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#213547"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="14"
                                height="14"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </span>
                    </button>
                </div>
            </section>

                    {/* 新しく追加: 都道府県一覧と特徴一覧（ページ下部） */}
                    <section style={{ marginTop: 24 }}>
                        <h2 style={{ color: '#0f5ef8' }}>都道府県からサウナを探す</h2>
                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 8 }}>
                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">北海道・東北</h3>
                                <div className="pref-list">
                                    {['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>

                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">関東</h3>
                                <div className="pref-list">
                                    {['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>

                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">北陸・甲信越</h3>
                                <div className="pref-list">
                                    {['新潟県','富山県','石川県','福井県','山梨県','長野県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>

                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">東海・近畿</h3>
                                <div className="pref-list">
                                    {['岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>

                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">中国・四国</h3>
                                <div className="pref-list">
                                    {['鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>

                            <div style={{ minWidth: 220 }}>
                                <h3 className="region-title">九州・沖縄</h3>
                                <div className="pref-list">
                                    {['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'].map(p => (
                                        <a key={p} className="pref-link" onClick={() => router.push({ pathname: '/', query: { prefecture: p } })}>{p}のサウナ</a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <h2 style={{ marginTop: 20, color: '#0f5ef8' }}>特徴からサウナを探す</h2>
                        <div className="feature-links" style={{ marginTop: 8 }}>
                            {[
                                'ロウリュ','セルフロウリュ','オートロウリュ','グルシン水風呂','銭湯サウナ','ボナサウナ','サウナ室テレビ無し','バイブラ水風呂','タトゥーOK','カプセルホテル有り','作業スペース有り','テントサウナ','サウナ小屋','湖が水風呂','プライベートサウナ'
                            ].map(f => (
                                <button key={f} className="pill-checkbox" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => { setTags([f]); setPage(1); }}>
                                    <span className="pill">{f}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section style={{ marginTop: 24 }}>
                        <h2>情報提供</h2>
                        <p>
                            施設の情報を知っている場合は投稿してください（簡易フォームは開発中）
                        </p>
                    </section>

            {/* 管理者ログイン（開発用）の UI は表示しない */}

            {/* モーダル */}
            {selectedFacilityId !== null && (
                <FacilityDetailModal
                    id={selectedFacilityId}
                    onClose={() => setSelectedFacilityId(null)}
                />
            )}
        </div>
    )
}

// モーダル内の facility 型を Facility に近い形で定義しておく
type FacilityDetail = {
    id: number
    name: string
    description?: string | null
    prefecture?: string
    city?: string | null
    address?: string | null
    isTattooOk: boolean
    openingHours?: string | null
    closedDays?: string | null
    phone?: string | null
    website?: string | null
}

function FacilityDetailModal({
    id,
    onClose,
}: {
    id: number
    onClose: () => void
}) {
    const { data, error } = useSWR(
        id ? `/api/facilities/${id}` : null,
        (url: string) => fetch(url).then(r => r.json()),
    )

    if (error) {
        return (
            <div className="facility-modal-backdrop" onClick={onClose}>
                <div
                    className="facility-modal-card"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        className="facility-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                    <div>エラーが発生しました</div>
                </div>
            </div>
        )
    }

    const isLoading = !data
    const isErrorResponse = data && 'error' in data
    const facility: FacilityDetail | null =
        !isLoading && !isErrorResponse ? data : null

    return (
        <div className="facility-modal-backdrop" onClick={onClose}>
            <div
                className="facility-modal-card"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="facility-modal-close"
                    onClick={onClose}
                >
                    ×
                </button>

                {isLoading && <div>読み込み中...</div>}
                {isErrorResponse && <div>施設が見つかりませんでした</div>}

                {facility && (
                    <>
                        <div className="facility-modal-header">
                            <div className="facility-modal-title-block">
                                <h2 className="facility-modal-title">
                                    {facility.name}
                                </h2>
                                <div className="facility-modal-location">
                                    {facility.prefecture}
                                    {facility.city &&
                                        ` / ${facility.city}`}
                                </div>
                            </div>
                            <span
                                className={
                                    'facility-modal-badge ' +
                                    (facility.isTattooOk
                                        ? 'facility-modal-badge-ok'
                                        : 'facility-modal-badge-ng')
                                }
                            >
                                {facility.isTattooOk
                                    ? 'タトゥー可'
                                    : 'タトゥー要問合せ'}
                            </span>
                        </div>

                        {facility.description && (
                            <p className="facility-modal-description">
                                {facility.description}
                            </p>
                        )}

                        <div className="facility-modal-grid">
                            <div className="facility-modal-row">
                                <span className="facility-modal-label">
                                    住所
                                </span>
                                <span className="facility-modal-value">
                                    {facility.prefecture}
                                    {facility.city &&
                                        ` / ${facility.city}`}{' '}
                                    {facility.address}
                                </span>
                            </div>
                            <div className="facility-modal-row">
                                <span className="facility-modal-label">
                                    営業時間
                                </span>
                                <span className="facility-modal-value">
                                    {facility.openingHours ?? '未設定'}
                                </span>
                            </div>
                            <div className="facility-modal-row">
                                <span className="facility-modal-label">
                                    休館日
                                </span>
                                <span className="facility-modal-value">
                                    {facility.closedDays ?? '未設定'}
                                </span>
                            </div>
                            <div className="facility-modal-row">
                                <span className="facility-modal-label">
                                    電話番号
                                </span>
                                <span className="facility-modal-value">
                                    {facility.phone ?? '未設定'}
                                </span>
                            </div>
                            {facility.website && (
                                <div className="facility-modal-row">
                                    <span className="facility-modal-label">
                                        公式サイト
                                    </span>
                                    <span className="facility-modal-value">
                                        <a
                                            href={facility.website}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {facility.website}
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
