import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prefecture, q } = req.query;
  let query = supabase.from('facilities').select('*');
  if (prefecture) query = query.eq('prefecture', prefecture as string);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
