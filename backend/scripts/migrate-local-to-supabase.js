// One-time: copies backend/data/*.json (tokens, contacts, email history) into Supabase.
import 'dotenv/config';
import { importLocal, health } from '../store.js';

const h = await health();
if (h.store !== 'supabase') { console.error('Supabase is not configured. Fill SUPABASE_URL and SUPABASE_KEY in backend/.env'); process.exit(1); }
if (!h.ok) { console.error('Supabase not ready:', h.tables, h.hint || ''); process.exit(1); }
console.log('Imported:', await importLocal());
console.log('Done. You can now delete backend/data/ if you like (keep a backup first).');
