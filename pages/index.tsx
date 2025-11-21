import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import FacilityCard from '../components/FacilityCard';

export default function Home() {
  const [facilities, setFacilities] = useState<any[]>([]);
  useEffect(()=>{ fetchFacilities() },[]);
  async function fetchFacilities(){
    const { data, error } = await supabase.from('facilities').select('*').limit(50);
    if (error) { console.error(error); return; }
    setFacilities(data || []);
  }
  return (
    <main style={{padding:20}}>
      <h1>タトゥーOK 温泉・サウナポータル</h1>
      <div style={{display:'grid',gap:12}}>
        {facilities.map(f => <FacilityCard key={f.id} facility={f} />)}
      </div>
    </main>
  )
}
