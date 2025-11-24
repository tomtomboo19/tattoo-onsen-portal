import { useRouter } from 'next/router'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

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

export default function FacilityDetailPage() {
    const router = useRouter()
    const { id } = router.query

    const { data, error } = useSWR(
        id ? `/api/facilities/${id}` : null,
        fetcher,
    )

    if (error) return <div>エラーが発生しました</div>
    if (!data) return <div>読み込み中...</div>
    if ('error' in data) return <div>施設が見つかりませんでした</div>

    const facility = data as FacilityDetail

    return (
        <div className="container">
            <h1 className="site-title">{facility.name}</h1>
            <p>{facility.description}</p>
            <div>
                <div>
                    住所: {facility.prefecture}
                    {facility.city && ` / ${facility.city}`}{' '}
                    {facility.address}
                </div>
                <div>
                    タトゥー可:{' '}
                    {facility.isTattooOk ? 'はい' : 'いいえ'}
                </div>
                <div>
                    営業時間: {facility.openingHours ?? '未設定'}
                </div>
                <div>休館日: {facility.closedDays ?? '未設定'}</div>
                <div>電話番号: {facility.phone ?? '未設定'}</div>
                {facility.website && (
                    <div>
                        公式サイト:{' '}
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
    )
}
