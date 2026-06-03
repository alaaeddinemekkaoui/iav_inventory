This is a [Next.js](https://nextjs.org) inventory application.

## Local Data

The app stores everything locally as JSON files. No PostgreSQL, Docker, or external database is required.

- `data/inventory.json` stores materials, movements, and settings.
- `data/auth.json` stores local users and sessions.
- `data/backups/` stores JSON backup snapshots.

The folders are created automatically when the app starts. To use a different data folder, set:

```txt
INVENTAIRE_DATA_DIR=C:\InventaireData
```

Add demonstration data:

```bash
npm run seed
```

## Desktop App

Build a portable Windows executable:

```bash
npm run desktop:build
```

The output is created in `dist-desktop/`. When the executable runs, it creates a `data` folder next to the `.exe`, so the app can be moved with its data and backups together.

For a quick desktop test without packaging:

```bash
npm run desktop
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
