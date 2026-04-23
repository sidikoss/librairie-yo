# Librairie YO

Vite + React + Firebase storefront (French/Guinea book shop), originally on Vercel.

## Stack
- Vite 5, React 18, React Router 6
- Tailwind CSS 3
- Firebase (client SDK) + firebase-admin in `api/` serverless functions
- Vercel-style serverless functions in `api/` (telegram webhook, reader)

## Replit setup
- Workflow `Start application` runs `npm run dev`
- Vite is bound to `0.0.0.0:5000` with `allowedHosts: true` and `hmr.clientPort: 443` so it works through the Replit iframe proxy.

## Env vars (configure in Secrets when needed)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_PASSWORD`
- Server-side (for `api/`): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`

## Notes
- `api/` functions are Vercel-style and not served by Vite dev. They will need a Node server adapter to run on Replit if/when needed.
