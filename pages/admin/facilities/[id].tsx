import { useRouter } from 'next/router'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminFacilityDetailPage() {
    const router = useRouter()
    const { id } = router.query

    const { data, error } = useSWR(
        id ? `/api/admin/facilities/${id}` : null,
        fetcher,
    )

    if (error) return <div>エラーが発生しました</div>
    if (!data) return <div>読み込み中...</div>
    if (!data.ok) return <div>{data.error ?? '取得に失敗しました'}</div>

    const facility = data.data

    return (
        <div>
            <h1>施設詳細</h1>
            <div>
                <div>ID: {facility.id}</div>
                <div>名称: {facility.name}</div>
                <div>住所: {facility.address}</div>
                {/* DB に合わせて項目を増やす */}
            </div>
        </div>
    )
}
