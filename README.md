# WealthFlow

Plataforma SaaS de finanzas personales + control de negocio de vapes.
Next.js 14 (App Router) · TypeScript · Tailwind · Drizzle + Neon PostgreSQL · Auth JWT (cookies HTTP-only).

## Lo que ya viene funcionando

- **Auth completo**: registro, login, logout. JWT firmado con `jose` en cookie `httpOnly`, middleware que protege `/dashboard` y todas las rutas privadas.
- **Módulo Finanzas (end-to-end)**: registrar ingresos y gastos desde un modal real → `POST /api/transactions` → Neon → la tabla y los totales se actualizan solos.
- **Dashboard** con balance del mes, ingresos/gastos y los buckets de distribución automática 50/30/20 (porcentajes guardados por usuario).
- **Schema completo** de las 17 tablas (finanzas, tarjetas, vapes, IA, notificaciones) con FKs e índices, y su migración SQL.
- Los demás módulos (tarjetas, vapes, metas, IA, reportes) están como placeholders listos para construir sobre la misma base.

## Arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base en Neon (https://neon.tech) y copiar el connection string

# 3. Variables de entorno
cp .env.example .env.local
#   edita .env.local:
#   - DATABASE_URL  -> tu connection string de Neon
#   - JWT_SECRET    -> genera con: openssl rand -base64 32

# 4. Crear las tablas en Neon
npm run db:push          # o: npm run db:migrate (usa la migración versionada)

# 5. Levantar
npm run dev              # http://localhost:3000
```

Entra a `/register`, crea tu cuenta (se siembran tus categorías por defecto) y empieza a registrar movimientos en **Finanzas**.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Aplica el schema directo a Neon |
| `npm run db:generate` | Genera nueva migración SQL al cambiar el schema |
| `npm run db:migrate` | Corre las migraciones versionadas |
| `npm run db:studio` | Drizzle Studio (explorar la base) |

## Estructura

```
src/
├── app/
│   ├── (auth)/            login, register
│   ├── (dashboard)/       layout con sidebar + rutas privadas
│   └── api/               auth/* y transactions
├── components/            Sidebar, Topbar, TxModal, DashboardClient, FinanzasClient
├── lib/
│   ├── db/                schema.ts, index.ts (cliente Neon), migrations/
│   ├── auth/              jwt.ts, password.ts, session.ts
│   ├── utils.ts           formato MXN + distribución de ingresos
│   └── categories.ts      categorías por defecto
└── middleware.ts          protección de rutas
```

## Deploy a Vercel

1. `git init && git add . && git commit -m "init"` y sube a GitHub.
2. Importa el repo en Vercel.
3. Agrega las env vars (`DATABASE_URL`, `JWT_SECRET`, etc.) en el proyecto de Vercel.
4. Deploy. Conecta tu dominio personalizado cuando quieras.

## Siguiente módulo

Tarjetas de crédito o Negocio de Vapes — ambos reutilizan el patrón de Finanzas:
página server que lee de Neon + cliente con modal que pega a su API route.
