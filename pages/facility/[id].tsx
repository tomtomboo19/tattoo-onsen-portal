import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function FacilityPage(){
  const router = useRouter();
  const { id } = router.query;
  const [facility, setFacility] = useState<any>(null);
  useEffect(()=>{ if (id) fetchFacility(id as string) },[id]);
  async function fetchFacility(id:string){
    const { data, error } = await supabase.from('facilities').select('*').eq('id', id).single();
    if (error) { console.error(error); return; }
    setFacility(data);
  }
  if (!facility) return <p>Loading...</p>;
  return (
    <main style={{padding:20}}>
      <h1>{facility.name}</h1>
      <p>{facility.prefecture} {facility.city}</p>
      <p>タトゥー: {facility.tattoo_policy}</p>
      <p>{facility.description}</p>
    </main>
  )
}
