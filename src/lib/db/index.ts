import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof drizzle> };

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida");
  return drizzle(neon(url), { schema });
}

export const db: ReturnType<typeof drizzle> = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    if (!globalForDb.db) globalForDb.db = createDb();
    return globalForDb.db[prop as keyof typeof globalForDb.db];
  },
});

export * from "./schema";