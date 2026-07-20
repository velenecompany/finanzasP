const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='users' AND column_name IN ('verify_expires','onboarded')`;
  console.log('Columnas nuevas:', cols.map(c => c.column_name));
  if (cols.length === 2) console.log('✅ Base lista, puedes subir.');
  else console.log('❌ Faltan columnas, dale Run en Neon.');
})().catch(e => console.error('ERROR:', e.message));
