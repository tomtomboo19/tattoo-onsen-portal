# Simple CSV importer for Supabase (server-side)
# Requires `pip install supabase` (supabase-py) and SUPABASE_SERVICE_ROLE_KEY
import csv, os
from supabase import create_client

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
if not url or not key:
    print('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
    exit(1)
client = create_client(url, key)

def import_csv(path='facilities.csv'):
    with open(path,encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader]
        for r in rows:
            res = client.table('facilities').insert(r).execute()
            print(res)

if __name__ == '__main__':
    import_csv()
