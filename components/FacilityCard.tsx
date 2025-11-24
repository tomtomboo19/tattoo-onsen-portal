import Link from 'next/link'

type Props = {
    id: number
    name: string
    description?: string | null
    prefecture?: string
    city?: string | null
    isTattooOk?: boolean
    onClick?: (id: number) => void
}

export default function FacilityCard({
    id,
    name,
    description,
    prefecture,
    city,
    isTattooOk,
    onClick,
}: Props) {
    return (
        <div
            className="card facility-card"
            onClick={() => onClick?.(id)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <h3 className="facility-title">{name}</h3>
            <div className="facility-meta">
                {prefecture}
                {city ? ` / ${city}` : ''}
            </div>
            <p className="facility-desc">{description}</p>
            <div style={{ marginTop: 8 }}>
                <span className="badge">
                    {isTattooOk ? 'タトゥー可' : 'タトゥー要問合せ'}
                </span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
                <Link
                    href={`/facilities/${id}`}
                    onClick={e => e.stopPropagation()}
                >
                    詳細ページを開く
                </Link>
            </div>
        </div>
    )
}
