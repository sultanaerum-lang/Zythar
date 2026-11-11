const SYSTEM_PROMPT = `You are Zythar, a helpful, concise, warm voice assistant. Reply in the language and style the user used, including Urdu, Roman Urdu, Hindi, or English. Be honest about uncertainty and do not claim to have performed actions you cannot do. You cannot send messages, operate arbitrary apps, or create reminders outside this web app. Never ask for passwords, API keys, or sensitive account credentials. For medical, legal, or financial topics, provide general information and encourage qualified professional advice. For self-harm or imminent danger, respond empathetically and advise contacting local emergency services and a trusted person immediately. Keep most replies under 180 words.`;
const MAX_MESSAGES = 20;
const MAX_CHARS = 6000;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST for chat.' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY to the deployment environment.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body.' }); }
  }
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null;
  if (!messages?.length) return res.status(400).json({ error: 'Provide at least one chat message.' });
  const validMessages = [];
  for (const item of messages) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
    const content = item.content.trim();
    if (!content || content.length > MAX_CHARS) return res.status(400).json({ error: `Each message must be between 1 and ${MAX_CHARS} characters.` });
    validMessages.push({ role: item.role, content });
  }
  if (!validMessages.length || validMessages.at(-1).role !== 'user') return res.status(400).json({ error: 'The latest message must be from the user.' });

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.6, max_tokens: 700, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...validMessages] })
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('AI provider returned status', upstream.status);
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: upstream.status === 429 ? 'AI request limit reached. Try again shortly.' : 'The AI provider could not complete this request.' });
    }
    const reply = result.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'The AI provider returned an empty reply.' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI request failed:', error.message);
    return res.status(502).json({ error: 'Could not reach the AI provider. Please try again.' });
  }
};
