SMU Peer Evaluation — a Next.js 16 app using Prisma, MySQL, and NextAuth.

## Installation

**Prerequisites:** Node.js 20+, npm, and a running MySQL 8 server.

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url> smu
   cd smu
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required values in `.env`:
   - `DATABASE_URL` — full MySQL connection string, e.g. `mysql://root:password@localhost:3306/smu_peer_eval`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — same MySQL credentials, used by import scripts
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev
   - `PABBLY_WEBHOOK_URL` — optional; leave blank to disable evaluation-cycle email notifications
   - `GA_MEASUREMENT_ID` / `NEXT_PUBLIC_GA_MEASUREMENT_ID` — optional analytics

3. **Create the database and apply the schema**
   ```bash
   mysql -u root -p -e "CREATE DATABASE smu_peer_eval;"
   npx prisma generate
   npx prisma db push
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# smu-eval
