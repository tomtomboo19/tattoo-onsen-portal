import useSWR from 'swr'
import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import FacilityCard from '../components/FacilityCard'
import MapPlaceholder from '../components/MapPlaceholder'

const MapClient = dynamic(() => import('../components/MapClient'), {
    ssr: false,
    loading: () => <MapPlaceholder />,
})

// 管理系 API もクッキーを送るようにする
const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then(r => r.json())

const TOKYO_CITIES = ['新宿区', '渋谷区', '港区', '世田谷区']
const TAG_OPTIONS = ['温泉', 'サウナ']

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

    // モーダル用: 選択中の施設 ID
    const [selectedFacilityId, setSelectedFacilityId] =
        useState<number | null>(null)

    // 管理 UI 用の状態
    const [adminPassword, setAdminPassword] = useState('')
    const [adminStatus, setAdminStatus] =
        useState<'unknown' | 'authed' | 'not-authed'>('unknown')
    const [adminMessage, setAdminMessage] = useState<string>('')

    // 施設ID → Leaflet マーカー
    const markersRef = useRef<Map<number, L.Marker>>(new Map())

    const handleMarkerReady = (facilityId: number, marker: L.Marker) => {
        markersRef.current.set(facilityId, marker)
    }

    const handleFacilityCardClick = (facilityId: number) => {
        const marker = markersRef.current.get(facilityId)
        if (marker) {
            marker.openPopup()
            // マーカー位置へパンしたい場合:
            const map = marker._map as L.Map | undefined
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
        setTags(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
        )
    }

    function onSearch(e?: React.FormEvent) {
        e?.preventDefault()
        setPage(1)
    }

    async function handleCheckMe() {
        const { status, body } = await checkMe()
        setAdminStatus(status === 200 ? 'authed' : 'not-authed')
        setAdminMessage(`status=${status} body=${JSON.stringify(body)}`)
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        const { status, body } = await login(adminPassword)
        setAdminMessage(`login status=${status} body=${JSON.stringify(body)}`)
        setAdminStatus(status === 200 ? 'authed' : 'not-authed')
    }

    async function handleLogout() {
        const { status, body } = await logout()
        setAdminMessage(`logout status=${status} body=${JSON.stringify(body)}`)
        setAdminStatus('not-authed')
    }

    return (
        <div className="container">
            <h1 className="site-title">
                タトゥーOK 温泉・サウナ ポータル（開発版）
            </h1>
            <p className="subtitle">
                現在は東京のデータのみを対象に開発しています。
            </p>

            {/* client-only map (Leaflet) */}
            <MapClient markers={facilities} onMarkerReady={handleMarkerReady} />

            <section style={{ marginTop: 16 }}>
                <h2>検索</h2>
                <form onSubmit={onSearch} className="search-form">
                    <label>
                        都道府県
                        <select
                            className="select"
                            value={prefecture}
                            onChange={e => {
                                setPrefecture(e.target.value)
                                setPage(1)
                            }}
                        >
                            <option value="東京都">東京都</option>
                        </select>
                    </label>

                    <label>
                        市区町村
                        <select
                            className="select"
                            value={city}
                            onChange={e => {
                                setCity(e.target.value)
                                setPage(1)
                            }}
                        >
                            <option value="">全て</option>
                            {TOKYO_CITIES.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        キーワード
                        <input
                            className="input"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="例: サウナ"
                        />
                    </label>

                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                        }}
                    >
                        {TAG_OPTIONS.map(t => (
                            <label key={t} style={{ fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={tags.includes(t)}
                                    onChange={() => toggleTag(t)}
                                />{' '}
                                {t}
                            </label>
                        ))}
                    </div>

                    <button className="btn" type="submit">
                        検索
                    </button>
                </form>
            </section>

            <section style={{ marginTop: 16 }}>
                <h2>検索結果</h2>
                {isValidating && <div>読み込み中...</div>}
                {error && <div>エラーが発生しました</div>}

                {facilities.length === 0 && !isValidating && (
                    <div>該当する施設が見つかりません。</div>
                )}

                {facilities.map((f: any) => (
                    <FacilityCard
                        key={f.id}
                        id={f.id}
                        name={f.name}
                        description={f.description}
                        prefecture={f.prefecture}
                        city={f.city}
                        isTattooOk={f.isTattooOk}
                        onClick={id => {
                            console.log('[FacilityCard click] id=', id)
                            setSelectedFacilityId(id)
                            handleFacilityCardClick(id)
                        }}
                    />
                ))}

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

            <section style={{ marginTop: 24 }}>
                <h2>情報提供</h2>
                <p>
                    施設の情報を知っている場合は投稿してください（簡易フォームは開発中）
                </p>
            </section>

            {/* 管理者ログイン UI */}
            <section
                style={{
                    marginTop: 32,
                    borderTop: '1px solid #ddd',
                    paddingTop: 16,
                }}
            >
                <h2>管理者ログイン（開発用）</h2>
                <form
                    onSubmit={handleLogin}
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <input
                        type="password"
                        className="input"
                        placeholder="ADMIN_PASSWORD"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                    />
                    <button className="btn" type="submit">
                        ログイン
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={handleLogout}
                    >
                        ログアウト
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={handleCheckMe}
                    >
                        /api/admin/me を確認
                    </button>
                </form>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                    状態:{' '}
                    {adminStatus === 'unknown'
                        ? '未確認'
                        : adminStatus === 'authed'
                          ? 'ログイン中'
                          : '未ログイン'}
                </div>
                {adminMessage && (
                    <pre
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            background: '#f7f7f7',
                            padding: 8,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {adminMessage}
                    </pre>
                )}
            </section>

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
