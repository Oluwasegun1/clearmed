# ClearMed

ClearMed is a multi-role healthcare authorization platform built with Next.js,
NextAuth, Prisma, and SQLite. It includes separate experiences for patients,
hospital staff, HMO reviewers, and administrators.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env.local
```

3. Generate the Prisma client and apply the SQLite schema:

```bash
npx prisma generate
npx prisma db push
```

4. Seed demo data so you can log in immediately:

```bash
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Environment variables

Create `.env.local` with the following values:

```bash
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"
```

Notes:

- `DATABASE_URL` points Prisma to the local SQLite database.
- `NEXTAUTH_URL` must match the local port used by the app.
- `NEXTAUTH_SECRET` is required for stable login sessions.
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` shows seeded quick-login options on the login page.

## Demo accounts

After running `npm run db:seed`, the following accounts are available. All use
the password `password123`.

- `patient@example.com` -> patient dashboard
- `doctor@example.com` -> hospital dashboard
- `hospital@example.com` -> hospital admin dashboard
- `pharmacy@example.com` -> pharmacy dashboard
- `lab@example.com` -> lab dashboard
- `hmo@example.com` -> HMO staff dashboard
- `hmo-admin@example.com` -> HMO admin dashboard
- `admin@example.com` -> admin dashboard

## Scripts

- `npm run dev` starts the app on port `3001`
- `npm run build` creates a production build
- `npm run start` runs the production server on port `3001`
- `npm run lint` runs ESLint
- `npm run db:seed` seeds demo users and supporting records
