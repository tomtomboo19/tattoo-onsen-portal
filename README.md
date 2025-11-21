# Tattoo-Friendly Onsen & Sauna Portal — MVP

This repository contains a minimal Next.js + Supabase starter for a portal that indexes tattoo-friendly onsen and saunas.

## What is included
- Next.js app scaffold (pages, components)
- Supabase SQL schema and seed
- Simple API route to fetch facilities using Supabase client
- CSV import script (Python) using Supabase Python client
- .env.example showing required environment variables

## How to run locally (quick)
1. Create a Supabase project and run `sql/schema.sql` and `sql/seed.sql`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase keys.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Deploy
- Push to GitHub and connect the repo to Vercel.
- Set environment variables in Vercel as in `.env.example`.

## Notes
This is an MVP: enhance authentication, validation, image uploads, and user report moderation before going public.
