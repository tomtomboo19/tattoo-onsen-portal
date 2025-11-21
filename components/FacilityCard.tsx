type Props = {
  id: number
  name: string
  description?: string | null
  prefecture?: string
  city?: string | null
  isTattooOk?: boolean
}

export default function FacilityCard({ name, description, prefecture, city, isTattooOk }: Props) {
  return (
    <div className="card facility-card">
      <h3 className="facility-title">{name}</h3>
      <div className="facility-meta">{prefecture}{city ? ` / ${city}` : ''}</div>
      <p className="facility-desc">{description}</p>
      <div style={{ marginTop: 8 }}>
        <span className="badge">{isTattooOk ? 'タトゥー可' : 'タトゥー要問合せ'}</span>
      </div>
    </div>
  )
}
