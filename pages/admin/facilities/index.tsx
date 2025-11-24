import { useRouter } from 'next/router'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminFacilityListPage() {
    const { data, error } = useSWR('/api/admin/facilities', fetcher)

    if (error) return <div>エラーが発生しました</div>
    if (!data) return <div>読み込み中...</div>
    if (!data.ok) return <div>{data.error ?? '取得に失敗しました'}</div>

    const facilities = data.data

    return (
        <div>
            <h1>施設一覧</h1>
            {facilities.map((facility: any) => (
                <div key={facility.id}>
                    <div>ID: {facility.id}</div>
                    <div>名称: {facility.name}</div>
                    <div>住所: {facility.address}</div>
                    <Link href={`/admin/facilities/${facility.id}`}>
                        詳細を見る
                    </Link>
                </div>
            ))}
        </div>
    )
}
