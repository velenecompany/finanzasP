const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_name IN ('financial_profile','alerts')`;
  console.log('Tablas nuevas:', t.map(x => x.table_name));
  const kind = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='ai_chat_sessions' AND column_name='kind'`;
  console.log('Columna kind en ai_chat_sessions:', kind.length ? '✅' : '❌');
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant');
  console.log('ANTHROPIC_API_KEY:', hasKey ? '✅ cargada' : '❌ falta');
  console.log('ANTHROPIC_MODEL:', process.env.ANTHROPIC_MODEL || '❌ falta');
})().catch(e => console.error('ERROR:', e.message));
