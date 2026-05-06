# Recode API Backend

# Acs

Backend Express/TypeScript for `api-recode.arteosocial.com`. The API uses live PostgreSQL data and is ready for Supabase or self-hosted Postgres through environment variables.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

## Database

Use Supabase or any PostgreSQL-compatible database. Supabase is PostgreSQL under the hood, so the backend reads from a standard Postgres connection string.

Recommended Supabase pooled connection:

```env
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
DB_SSL=true
```

Self-hosted PostgreSQL:

```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=recode_social
PGUSER=postgres
PGPASSWORD=...
DB_SSL=false
```

Do not hard-code database credentials in source code. In production, `DATABASE_URL` is required.

## Truthful Data Rule

Public data must come from the database or from verified static files. Do not ship fake metrics, fake incidents, fake users, or generated content as production truth. Seed/generator scripts in `src/scripts/` are development/import tools only.

## Health Checks

- `GET /health`: API and database health.
- `GET /api/diag`: build and live database state.
- `GET /api/system/status`: live status payload used by the frontend status page.

## Scripts

```bash
npm run build
npm start
```
