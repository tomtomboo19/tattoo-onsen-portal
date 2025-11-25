import Link from 'next/link'

type BathType = {
    temperature?: number
    capacity?: number
    [key: string]: any
}

type Props = {
    id: number
    name: string
    description?: string | null
    prefecture?: string
    city?: string | null
    address?: string | null
    isTattooOk?: boolean
    price?: string | null
    bathTypes?: string | null
    tags?: string | null
    facilities?: string | null
    amenities?: string | null
    towelOptions?: string | null
    paymentMethods?: string | null
    relaxation?: string | null
    accomodation?: string | null
    onClick?: (id: number) => void
}

export default function FacilityCard({
    id,
    name,
    description,
    prefecture,
    city,
    address,
    isTattooOk,
    price,
    bathTypes,
    tags,
    facilities,
    amenities,
    towelOptions,
    paymentMethods,
    relaxation,
    accomodation,
    onClick,
}: Props) {
    let parsedBathTypes: Record<string, BathType> = {}
    if (bathTypes) {
        try {
            parsedBathTypes = JSON.parse(bathTypes)
        } catch (e) {
            // JSON parse failed, show raw string
        }
    }

    const bathTypesList = Object.entries(parsedBathTypes)

    return (
        <div
            className="card facility-card-enhanced"
            onClick={() => onClick?.(id)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            tabIndex={-1}
            data-result-item
        >
            {/* Header section: title and tattoo badge */}
            <div className="facility-card-header">
                <div>
                    <h3 className="facility-title">{name}</h3>
                    <div style={{ marginTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {(() => {
                                    const primary: string[] = []
                                    if (tags) {
                                        tags.split(',').forEach((t: string) => {
                                            const v = t.trim()
                                            if (v === '温泉' || v === 'サウナ') primary.push(v)
                                        })
                                    }
                                    if (primary.length === 0 && tags) {
                                        const others = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
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

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {(function () {
                                    const collectArrayFrom = (val: any) => {
                                        if (!val) return [] as string[]
                                        if (typeof val === 'string') {
                                            try {
                                                const parsed = JSON.parse(val)
                                                if (Array.isArray(parsed)) return parsed.map(String)
                                            } catch (e) {
                                                return [val]
                                            }
                                        }
                                        if (Array.isArray(val)) return val.map(String)
                                        return [String(val)]
                                    }

                                    const fields = [facilities, amenities, towelOptions, paymentMethods, relaxation, accomodation]
                                    const pool: string[] = []
                                    fields.forEach((v: any) => collectArrayFrom(v).forEach((it: string) => { const s = it && String(it).trim(); if (s) pool.push(s) }))

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
                                    const genderVals = extract(/裸|水着|館内着|着用/)
                                    if (genderVals.length) chips.push({ label: '男女で入れる', value: genderVals.join(', ') })
                                    const male = extract(/男性/)
                                    const female = extract(/女性/)
                                    if (male.length) chips.push({ label: '性別', value: male.join(', ') })
                                    if (female.length && !male.length) chips.push({ label: '性別', value: female.join(', ') })
                                    const usage = extract(/宿泊|日帰り|利用|入浴可|宿泊者/)
                                    if (usage.length) chips.push({ label: '利用タイプ', value: usage.join(', ') })
                                    const sauna = extract(/サウナ|塩サウナ|ロウリュ|フィンランド/)
                                    if (sauna.length) chips.push({ label: 'サウナタイプ', value: sauna.join(', ') })
                                    const stay = extract(/宿泊|宿泊予約/)
                                    if (stay.length) chips.push({ label: '宿泊', value: stay.join(', ') })
                                    const accom = extract(/.*/)
                                    if (accom.length) chips.push({ label: '施設タイプ', value: accom.join(', ') })

                                    return chips.map((c, i) => (
                                        <span key={i} className="info-chip">
                                            <strong style={{ marginRight: 6, color: '#4b5563' }}>{c.label}:</strong>
                                            <span style={{ color: '#213547' }}>{c.value}</span>
                                        </span>
                                    ))
                                })()}

                                <div className="facility-location">{prefecture}{city ? ` / ${city}` : ''}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <span
                    className={`facility-tattoo-badge ${
                        isTattooOk ? 'tattoo-ok' : 'tattoo-ng'
                    }`}
                >
                    {isTattooOk ? '🏷️ タトゥー可' : '❌ 要確認'}
                </span>
            </div>

            {/* Description */}
            {description && (
                <p className="facility-desc">{description}</p>
            )}

            {/* Address */}
            {address && (
                <div className="facility-address">
                    📍 {address}
                </div>
            )}

            {/* Price info */}
            {price && (
                <div className="facility-price">
                    💰 {price}
                </div>
            )}

            {/* Bath types section */}
            {bathTypesList.length > 0 && (
                <div className="facility-bath-types">
                    <div className="bath-types-title">浴槽タイプ</div>
                    <div className="bath-types-grid">
                        {bathTypesList.map(([bathName, bathInfo]) => (
                            <div key={bathName} className="bath-type-card">
                                <div className="bath-type-name">{bathName}</div>
                                {bathInfo.temperature && (
                                    <div className="bath-type-info">
                                        🌡️ {bathInfo.temperature}°C
                                    </div>
                                )}
                                {bathInfo.capacity && (
                                    <div className="bath-type-info">
                                        👥 {bathInfo.capacity}人
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Details link */}
            <div style={{ marginTop: 12, fontSize: 13 }}>
                <Link
                    href={`/facilities/${id}`}
                    onClick={e => e.stopPropagation()}
                    className="facility-link"
                >
                    詳細ページを開く →
                </Link>
            </div>
        </div>
    )
}
