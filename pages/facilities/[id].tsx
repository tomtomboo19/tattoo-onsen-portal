import { useRouter } from 'next/router'
import useSWR from 'swr'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('../../components/MapClient'), {
    ssr: false,
    loading: () => <div className="map-placeholder">地図を読み込み中...</div>,
})

const fetcher = (url: string) => fetch(url).then(r => r.json())

type BathType = {
    temperature?: number
    capacity?: number
    [key: string]: any
}

type FacilityDetail = {
    id: number
    name: string
    description?: string | null
    prefecture?: string
    city?: string | null
    address?: string | null
    isTattooOk: boolean
    price?: string | null
    bathTypes?: string | null
    openingHours?: string | null
    closedDays?: string | null
    phone?: string | null
    website?: string | null
    latitude?: number | null
    longitude?: number | null
    tags?: string | null
    facilities?: string | null
    paymentMethods?: string | null
    towelOptions?: string | null
    amenities?: string | null
    relaxation?: string | null
    accomodation?: string | null
}

export default function FacilityDetailPage() {
    const router = useRouter()
    const { id } = router.query

    const { data, error } = useSWR(
        id ? `/api/facilities/${id}` : null,
        fetcher,
    )

    if (error) {
        return (
            <div className="container">
                <div className="error-message">
                    エラーが発生しました
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="container">
                <div className="loading-message">読み込み中...</div>
            </div>
        )
    }

    if ('error' in data) {
        return (
            <div className="container">
                <div className="error-message">施設が見つかりませんでした</div>
            </div>
        )
    }

    const facility = data as FacilityDetail

    let parsedBathTypes: Record<string, BathType> = {}
    if (facility.bathTypes) {
        try {
            parsedBathTypes = JSON.parse(facility.bathTypes)
        } catch (e) {
            // JSON parse failed
        }
    }

    const bathTypesList = Object.entries(parsedBathTypes)
    const hasLocation = facility.latitude && facility.longitude

    return (
        <div className="container">
            {/* Header section */}
            <div className="facility-detail-header">
                <div>
                    <h1 className="facility-detail-title">{facility.name}</h1>
                    {/* Tags: 表示はタイトル近くに組み込む */}
                    <div style={{ marginTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {/* left: 主なカテゴリラベル + color tag chips */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {(() => {
                                    const primary = [] as string[]
                                    if (facility.tags) {
                                        facility.tags.split(',').forEach((t: string) => {
                                            const v = t.trim()
                                            if (v === '温泉' || v === 'サウナ') primary.push(v)
                                        })
                                    }
                                    if (primary.length === 0 && facility.tags) {
                                        // fallback: show first two tags if primary not found
                                        const others = facility.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                                        primary.push(...others.slice(0, 2))
                                    }

                                    if (primary.length === 0) return null

                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span className="primary-label">主なカテゴリ：</span>
                                            {primary.map((p, i) => (
                                                <span key={i} className="tag-chip">{p}</span>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* right: small info chips (自動解析して複数カテゴリ表示) */}
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {(() => {
                                    // collect arrays from known fields
                                    const collectArrayFrom = (val: any) => {
                                        if (!val) return [] as string[]
                                        if (typeof val === 'string') {
                                            try {
                                                const parsed = JSON.parse(val)
                                                if (Array.isArray(parsed)) return parsed.map(String)
                                            } catch (e) {
                                                // not JSON
                                                return [val]
                                            }
                                        }
                                        if (Array.isArray(val)) return val.map(String)
                                        return [String(val)]
                                    }

                                    const fields = ['facilities', 'amenities', 'towelOptions', 'paymentMethods', 'relaxation', 'accomodation'] as const
                                    const pool: string[] = []
                                    fields.forEach(f => {
                                        const v = (facility as any)[f]
                                        collectArrayFrom(v).forEach((it: string) => {
                                            const s = it && String(it).trim()
                                            if (s) pool.push(s)
                                        })
                                    })

                                    // helper to extract matching items by regex (removes from pool)
                                    const extract = (rx: RegExp) => {
                                        const matches: string[] = []
                                        for (let i = pool.length - 1; i >= 0; i--) {
                                            const p = pool[i]
                                            if (rx.test(p)) {
                                                matches.unshift(p)
                                                pool.splice(i, 1)
                                            }
                                        }
                                        return matches
                                    }

                                    const chips: { label: string; value: string }[] = []

                                    // 男女で入れる（裸で入れる / 水着着用 / 館内着）
                                    const genderVals = extract(/裸|水着|館内着|着用/)
                                    if (genderVals.length) chips.push({ label: '男女で入れる', value: genderVals.join(', ') })

                                    // 性別（男性/女性）
                                    const male = extract(/男性/)
                                    const female = extract(/女性/)
                                    if (male.length) chips.push({ label: '性別', value: male.join(', ') })
                                    if (female.length && !male.length) chips.push({ label: '性別', value: female.join(', ') })

                                    // 利用タイプ（宿泊者のみ, 日帰り入浴可 など）
                                    const usage = extract(/宿泊|日帰り|利用|入浴可|宿泊者/)
                                    if (usage.length) chips.push({ label: '利用タイプ', value: usage.join(', ') })

                                    // サウナタイプ
                                    const sauna = extract(/サウナ|塩サウナ|ロウリュ|フィンランド/)
                                    if (sauna.length) chips.push({ label: 'サウナタイプ', value: sauna.join(', ') })

                                    // 宿泊関連
                                    const stay = extract(/宿泊|宿泊予約/)
                                    if (stay.length) chips.push({ label: '宿泊', value: stay.join(', ') })

                                    // 施設タイプ / 残りはまとめて施設タイプへ
                                    const accom = extract(/.*/)
                                    if (accom.length) chips.push({ label: '施設タイプ', value: accom.join(', ') })

                                    // render
                                    return chips.map((c, i) => (
                                        <span key={i} className="info-chip">
                                            <strong style={{ marginRight: 6, color: '#4b5563' }}>{c.label}:</strong>
                                            <span style={{ color: '#213547' }}>{c.value}</span>
                                        </span>
                                    ))
                                })()}
                                {/* location */}
                                <div className="facility-detail-location">📍 {facility.prefecture}{facility.city && ` / ${facility.city}`}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <span
                    className={`facility-detail-badge ${
                        facility.isTattooOk ? 'tattoo-ok' : 'tattoo-ng'
                    }`}
                >
                    {facility.isTattooOk ? '✅ タトゥー可' : '⚠️ 要確認'}
                </span>
            </div>

            {/* Description */}
            {facility.description && (
                <div className="facility-detail-section">
                    <h2>概要</h2>
                    <p className="facility-detail-description">
                        {facility.description}
                    </p>
                </div>
            )}

            {/* Price section */}
            {facility.price && (
                <div className="facility-detail-section">
                    <h2>料金</h2>
                    <div className="facility-detail-price">
                        💰 {facility.price}
                    </div>
                </div>
            )}

            {/* Bath types section */}
            {bathTypesList.length > 0 && (
                <div className="facility-detail-section">
                    <h2>浴槽情報</h2>
                    <div className="bath-types-detailed-grid">
                        {bathTypesList.map(([bathName, bathInfo]) => (
                            <div
                                key={bathName}
                                className="bath-type-detailed-card"
                            >
                                <div className="bath-type-detailed-name">
                                    {bathName}
                                </div>
                                {bathInfo.temperature && (
                                    <div className="bath-type-detailed-info">
                                        <span className="info-label">温度</span>
                                        <span className="info-value">
                                            {bathInfo.temperature}°C
                                        </span>
                                    </div>
                                )}
                                {bathInfo.capacity && (
                                    <div className="bath-type-detailed-info">
                                        <span className="info-label">収容人数</span>
                                        <span className="info-value">
                                            {bathInfo.capacity}人
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Business hours */}
            <div className="facility-detail-section">
                <h2>営業情報</h2>
                <div className="business-info-grid">
                    <div className="business-info-item">
                        <span className="business-label">営業時間</span>
                        <span className="business-value">
                            {facility.openingHours ?? '未設定'}
                        </span>
                    </div>
                    <div className="business-info-item">
                        <span className="business-label">休館日</span>
                        <span className="business-value">
                            {facility.closedDays ?? '未設定'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contact information */}
            <div className="facility-detail-section">
                <h2>お問い合わせ</h2>
                <div className="contact-info-grid">
                    {facility.phone && (
                        <div className="contact-info-item">
                            <span className="contact-label">📞 電話番号</span>
                            <a href={`tel:${facility.phone}`}>
                                {facility.phone}
                            </a>
                        </div>
                    )}
                    {facility.website && (
                        <div className="contact-info-item">
                            <span className="contact-label">🌐 公式サイト</span>
                            <a
                                href={facility.website}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {facility.website}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Address */}
            {facility.address && (
                <div className="facility-detail-section">
                    <h2>住所</h2>
                    <div className="facility-detail-address">
                        {facility.prefecture}
                        {facility.city && ` / ${facility.city}`}
                        <br />
                        {facility.address}
                    </div>
                </div>
            )}

            {/* Map (移動済み — ページ下部に表示) */}

            {/* Tagsはヘッダー内に統合済み（個別セクションは表示しない） */}

            {/* ========== Facility Features & Rules ========== */}

            {/* Facilities & Rules */}
            {facility.facilities && (
                <div className="facility-detail-section">
                    <h2>🏗️ 設備・ルール</h2>
                    <div className="feature-list">
                        {JSON.parse(facility.facilities).map(
                            (item: string, idx: number) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-checkbox">✓</span>
                                    {item}
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* Payment Methods */}
            {facility.paymentMethods && (
                <div className="facility-detail-section">
                    <h2>💳 支払い方法</h2>
                    <div className="feature-list">
                        {JSON.parse(facility.paymentMethods).map(
                            (item: string, idx: number) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-checkbox">✓</span>
                                    {item}
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* Towel Options */}
            {facility.towelOptions && (
                <div className="facility-detail-section">
                    <h2>🧴 タオル・館内着・サウナマット</h2>
                    <div className="feature-list">
                        {JSON.parse(facility.towelOptions).map(
                            (item: string, idx: number) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-checkbox">✓</span>
                                    {item}
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* Amenities */}
            {facility.amenities && (
                <div className="facility-detail-section">
                    <h2>🧼 アメニティ</h2>
                    <div className="feature-list">
                        {JSON.parse(facility.amenities).map(
                            (item: string, idx: number) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-checkbox">✓</span>
                                    {item}
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* Relaxation Services */}
            {facility.relaxation && (
                <div className="facility-detail-section">
                    <h2>💆 リラクゼーション</h2>
                    <div className="feature-list">
                        {JSON.parse(facility.relaxation).map(
                            (item: string, idx: number) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-checkbox">✓</span>
                                    {item}
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* Accommodation */}
            {facility.accomodation && (
                <div className="facility-detail-section">
                    <h2>🏨 宿泊予約</h2>
                    <div className="accommodation-info">
                        {facility.accomodation}
                    </div>
                </div>
            )}

            {/* Map (ページ下部に移動) */}
            {hasLocation && (
                <div className="facility-detail-section">
                    <h2>地図</h2>
                    <MapClient
                        markers={[
                            {
                                id: facility.id,
                                name: facility.name,
                                latitude: facility.latitude,
                                longitude: facility.longitude,
                                isTattooOk: facility.isTattooOk,
                                description: facility.description,
                            },
                        ]}
                    />
                </div>
            )}

            {/* Back button */}
            <div className="facility-detail-footer">
                <button
                    className="btn-back"
                    onClick={() => router.back()}
                >
                    ← 戻る
                </button>
            </div>
        </div>
    )
}
