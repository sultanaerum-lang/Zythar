# Zythar AI

**Your voice, your companion.** Responsive, installable PWA for Android and desktop, with browser voice input, speech playback, AI chat, search/research, message drafts, reminders, optional sign-in, and local history.

## What is implemented
- AI chat through a serverless endpoint. The OpenAI key stays on the server and is never shipped to browser code.
- Voice input/output where supported; English, Urdu, and Hindi recognition/speech language selection.
- Search engine links, popular website shortcuts, Wikipedia summaries with source links, and WhatsApp message drafts that the user reviews and sends themselves.
- Local chat history and reminders, data-clear control, light/dark theme, responsive layout, and installable/offline PWA shell.
- Optional Supabase email/password sign-up/sign-in and per-account chat/reminder sync. Row-level security SQL is included.
- Friendly emotional-support responses; urgent language receives a crisis-support prompt. This is not medical or crisis care.

## Deploy (Vercel — AI endpoint and static website together)
1. Import `sultanaerum-lang/Zythar` into Vercel and deploy the repository. The included `vercel.json` routes the static site and `api/chat.js` serverless function.
2. In Vercel **Project Settings → Environment Variables**, set `OPENAI_API_KEY` to your own provider key. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`). Redeploy after setting variables. Never add a real API key to frontend files, commits, or chat messages. Provider usage may incur charges.
3. Set the project domain in Vercel. HTTPS is required for reliable microphone access, PWA install, and service workers.

Local development: install Node.js 18+, run `npm install`, set `OPENAI_API_KEY` in a local `.env.local` file (never commit it), then `npm run dev` and open the local URL shown by Vercel CLI.

## Optional account and cross-device sync
1. Create a Supabase project; enable Email auth.
2. Run `supabase/schema.sql` in the Supabase SQL editor. It creates a table with row-level security so authenticated users can only access their own row.
3. Put your Supabase project URL and **public anon/publishable key** in `app-config.js`. These are browser-visible by design; do not use a service-role key there. Redeploy. Email confirmation behavior is controlled in Supabase Auth settings.
4. Zythar syncs conversation/reminders after sign-in. If the optional integration is not configured, sign-in is unavailable and local mode still works.

## GitHub Pages / static-only hosting
The static UI can be hosted on GitHub Pages, but `/api/chat` needs a serverless host and will not work on static-only hosting. Use Vercel for the included AI backend; do not expose an AI API key in client JavaScript. The website cannot control arbitrary installed phone/desktop apps, send WhatsApp messages automatically, or notify while closed; OS/browser restrictions and explicit user confirmation apply.

## Safety and privacy
Chat/reminders are stored in browser local storage unless optional Supabase sync is configured. Clear local data from the sidebar; cloud rows are governed by the Supabase account and can be deleted by signing in and removing the account data through the configured backend. Do not enter highly sensitive information on a shared device. AI replies can be wrong, and research uses Wikipedia summaries rather than a complete scholarly review.
