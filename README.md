# Zythar AI

**Your voice, your companion.** Zythar is a responsive, installable web app (PWA) for Android and desktop browsers.

## Use it
Open the deployed site over HTTPS, or run locally with a static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Included
- Responsive assistant interface and installable PWA shell, with basic offline caching.
- Optional browser speech recognition (where supported), speech playback, and English/Urdu/Hindi recognition language choices.
- Web search links, popular website shortcuts, Wikipedia topic summaries with source links, and search fallbacks.
- WhatsApp message drafts open for the user to review; Zythar does not send messages.
- Browser-local chat history and reminders, plus a clear-data control and light/dark theme.
- Supportive conversation responses and an urgent-safety response for self-harm language.

## Important limitations
This is a static front-end; it does not yet connect to a generative AI model or server. General chat therefore explains its available actions and offers web search rather than pretending to provide AI-generated answers. There is no account sync, background reminder notification, direct app control, or automatic sending. A website cannot open arbitrary installed apps or run when closed; those functions require platform permissions or a separately configured backend/native integration. Speech recognition availability, microphone permission, and install options depend on browser and HTTPS support. Research summaries use Wikipedia's public API and may not cover breaking news.

The chat and reminders are stored in the browser's local storage on this device. Avoid entering sensitive personal information on a shared device. Use the clear-data control to remove local history.
