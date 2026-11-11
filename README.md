# Zythar AI

**Your voice, your companion.** Zythar is a responsive, installable PWA for Android and desktop with browser voice input, speech playback, AI chat, search/research shortcuts, message drafts, reminders, optional sign-in and cross-device sync.

## Features
- AI chat through a serverless endpoint. The OpenAI API key stays on the server and is never shipped to browser code.
- Multilingual replies that follow the user's language, including English, Urdu, Roman Urdu and Hindi.
- Voice input and speech playback where supported by the browser; language selection for English, Urdu and Hindi.
- Search engine links, popular website shortcuts, Wikipedia summaries with source links, and WhatsApp message drafts for the user to review and send.
- Local chat history and reminders, data-clear control, light/dark theme, responsive layout and an installable/offline PWA shell.
- Optional Supabase email/password sign-up/sign-in and per-account chat/reminder sync. Row-level security SQL is included.
- Supportive responses. For urgent self-harm language, the assistant encourages immediate help. Zythar is not medical or crisis care.

## Deploy (Vercel — AI endpoint and static website together)
1. Import `sultanaerum-lang/Zythar` into Vercel and deploy the repository. The included `vercel.json` serves the static site and `api/chat.js` serverless function.
2. In Vercel **Project Settings → Environment Variables**, set `OPENAI_API_KEY` to your own provider key. Optionally set `OPENAI_MODEL` to a model available to your API account (defaults to `gpt-4o-mini`). Redeploy after setting variables.
3. Set the project domain in Vercel. HTTPS is required for reliable microphone access, PWA install and service workers.

Local development: install Node.js 18+, run `npm install`, set `OPENAI_API_KEY` in a local `.env.local` file (never commit it), then run `npm run dev` and open the local URL shown by Vercel CLI.

## Optional account and cross-device sync
1. Create a Supabase project and enable Email auth.
2. Run `supabase/schema.sql` in the Supabase SQL editor. It creates a table with row-level security so authenticated users can only access their own row.
3. Put your Supabase project URL and **public anon/publishable key** in `app-config.js`. These are browser-visible by design; do not use a service-role key there. Redeploy. Email confirmation behavior is configured in Supabase.
4. Zythar syncs conversation/reminders after sign-in. If the optional integration is not configured, sign-in is unavailable and local mode still works.

## GitHub Pages / static-only hosting
The static UI can be hosted on GitHub Pages, but `/api/chat` needs a serverless host and will not work on static-only hosting. Use Vercel for the included AI backend; never expose an AI API key in browser code.

## Privacy and safety
Chat and reminders are stored in browser local storage unless optional Supabase sync is configured. Clear local data from the sidebar; cloud rows are governed by the Supabase account and can be deleted from the account's data store. AI requests send recent conversation messages to the configured provider so it can generate replies. Do not send information you do not want processed by that provider. Zythar does not have live web browsing in its AI chat endpoint; search shortcuts open external search pages.
