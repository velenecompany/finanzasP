const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const rows = await sql`SELECT email, email_verified, verify_token IS NOT NULL AS tiene_token FROM users ORDER BY created_at DESC LIMIT 5`;
  console.table(rows);
})().catch(e => console.error('ERROR:', e.message));
