# VAMZ Resource Hub

Full-stack web application built with Next.js App Router, TypeScript, Drizzle ORM, Turso, and Cloudflare R2.

## Features

- Email/password registration and login
- JWT session authentication
- Protected admin dashboard
- Public social links section
- Resource uploads with metadata stored in Turso
- File storage backed by Cloudflare R2
- Vercel-ready build and runtime setup

## Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- ORM: Drizzle ORM
- Database: Turso (`libSQL`)
- File storage: Cloudflare R2
- Styling: TailwindCSS
- Hosting target: Vercel

## Folder Structure

```text
.
|- app/
|  |- api/
|  |  |- auth/
|  |  |  |- login/route.ts
|  |  |  |- logout/route.ts
|  |  |  \- register/route.ts
|  |  \- resources/
|  |     |- [resourceId]/route.ts
|  |     |- list/route.ts
|  |     \- upload/route.ts
|  |- login/page.tsx
|  |- register/page.tsx
|  |- globals.css
|  |- layout.tsx
|  \- page.tsx
|- components/
|  |- auth-form.tsx
|  |- logout-button.tsx
|  \- upload-form.tsx
|- db/
|  |- index.ts
|  \- schema.ts
|- drizzle/
|  |- 0000_wild_makkari.sql
|  \- meta/
|- lib/
|  |- auth.ts
|  |- env.ts
|  |- request-auth.ts
|  |- server-auth.ts
|  |- uploads.ts
|  \- validators.ts
|- uploads/
|  \- .gitkeep
|- drizzle.config.ts
|- next.config.ts
|- proxy.ts
|- .env.example
└- package.json
```

## Database Schema

### `users`

- `id`
- `email`
- `password_hash`
- `created_at`

### `resources`

- `id`
- `user_id`
- `filename`
- `path`
- `created_at`

## Environment Variables

Create a `.env.local` file from `.env.example`:

```bash
Copy-Item .env.example .env.local
```

Example values:

```env
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
TURSO_DATABASE_URL=libsql://your-database-name-your-team.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
ADMIN_EMAILS=admin@example.com
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_BUCKET=your-r2-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
RESOURCE_STORAGE_LIMIT_MB=10240
TURSO_STORAGE_LIMIT_GB=5
```

## Connect Turso

1. Create a Turso database.
2. Get the database URL.
3. Create an auth token for the database.
4. Put both values into `.env.local`.
5. Push the schema:

```bash
npm install
npm run db:push
```

If you want a generated SQL migration file before pushing, it is already included in `drizzle/0000_wild_makkari.sql`. You can regenerate it with:

```bash
npm run db:generate
```

## Run Locally

```bash
npm install
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/resources/upload`
- `GET /api/resources/list`
- `GET /api/resources/[resourceId]`

## Deployment On Vercel

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Import the repository into Vercel.
3. Add these environment variables in the Vercel project settings:
   - `JWT_SECRET`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `ADMIN_EMAILS`
   - `R2_ACCOUNT_ID`
   - `R2_BUCKET`
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `RESOURCE_STORAGE_LIMIT_MB`
   - `TURSO_STORAGE_LIMIT_GB`
4. Deploy.
5. After deployment, run `npm run db:push` with the same production Turso variables if the database schema has not been applied yet.

## Production Storage

- Turso stores users, links, metadata, and resource records.
- Cloudflare R2 stores the actual uploaded files and cover images.
- The app enforces a configurable upload quota through `RESOURCE_STORAGE_LIMIT_MB`.

## Verification

The project passes:

```bash
npm run lint
npm run build
```
