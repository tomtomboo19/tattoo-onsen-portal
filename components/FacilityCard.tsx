export default function FacilityCard({facility}:{facility:any}) {
  return (
    <article style={{border:'1px solid #ddd',padding:12,borderRadius:8}}>
      <h2 style={{margin:0}}>{facility.name}</h2>
      <p style={{margin:'4px 0'}}>{facility.prefecture} {facility.city}</p>
      <p style={{margin:'4px 0'}}>タトゥー: {facility.tattoo_policy}</p>
      <a href={`/facility/${facility.id}`}>詳しく</a>
    </article>
  )
}
