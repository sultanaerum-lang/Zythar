const $ = (selector) => document.querySelector(selector);
const chatLog = $('#chatLog');
const input = $('#commandInput');
const welcome = $('#welcome');
const toast = $('#toast');
const langSelect = $('#languageSelect');
const STORAGE = { chat: 'zythar-chat-v2', reminders: 'zythar-reminders-v2', language: 'zythar-language', theme: 'zythar-theme' };
const sites = { youtube: 'https://youtube.com', google: 'https://google.com', gmail: 'https://mail.google.com', github: 'https://github.com', wikipedia: 'https://wikipedia.org', whatsapp: 'https://web.whatsapp.com', instagram: 'https://instagram.com', facebook: 'https://facebook.com', x: 'https://x.com', twitter: 'https://x.com', linkedin: 'https://linkedin.com', maps: 'https://maps.google.com', spotify: 'https://open.spotify.com', netflix: 'https://netflix.com', reddit: 'https://reddit.com', amazon: 'https://amazon.com' };
let recognition;
let listening = false;
let deferredInstall;
let toastTimer;
let conversation = readStore(STORAGE.chat, []);
let reminders = readStore(STORAGE.reminders, []);

function readStore(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; } catch { return fallback; } }
function saveChat() { localStorage.setItem(STORAGE.chat, JSON.stringify(conversation.slice(-50))); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
function safeLink(url) { try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; } catch { return null; } }
function linkButton(container, label, href) { const safe = safeLink(href); if (!safe) return; const a = document.createElement('a'); a.className = 'result-link'; a.href = safe; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label; container.append(a); }
function addMessage(text, role = 'assistant', options = {}) {
  const row = document.createElement('article'); row.className = `message ${role === 'user' ? 'user' : ''}`;
  if (role !== 'user') { const avatar = document.createElement('span'); avatar.className = 'message-avatar'; avatar.textContent = 'z'; row.append(avatar); }
  const body = document.createElement('div'); body.className = 'message-body'; body.textContent = text; row.append(body);
  if (options.links?.length) { const links = document.createElement('div'); links.className = 'message-actions'; options.links.forEach(({ label, href }) => linkButton(links, label, href)); body.append(links); }
  if (options.source) { const source = document.createElement('div'); source.className = 'source'; source.textContent = 'Source: '; const a = document.createElement('a'); a.href = safeLink(options.source) || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = options.sourceLabel || 'Read more'; source.append(a); body.append(source); }
  chatLog.append(row); chatLog.scrollTop = chatLog.scrollHeight; return row;
}
function renderConversation() { chatLog.replaceChildren(); conversation.forEach(item => addMessage(item.text, item.role, item.options || {})); updateChatView(); }
function updateChatView() { const hasMessages = conversation.length > 0; welcome.hidden = hasMessages; chatLog.classList.toggle('visible', hasMessages); }
function respond(text, options = {}) { conversation.push({ role: 'assistant', text, options }); addMessage(text, 'assistant', options); saveChat(); speak(text); }
function speak(text) { if (!('speechSynthesis' in window)) return; const utterance = new SpeechSynthesisUtterance(text); utterance.lang = langSelect.value; utterance.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(utterance); }
function addUser(text) { conversation.push({ role: 'user', text }); addMessage(text, 'user'); saveChat(); updateChatView(); }
function openSearch(query) { const q = encodeURIComponent(query); respond(`I’ve prepared web search results for “${query}”. Choose a search engine to continue.`, { links: [{ label: 'Google search ↗', href: `https://www.google.com/search?q=${q}` }, { label: 'DuckDuckGo ↗', href: `https://duckduckgo.com/?q=${q}` }] }); }
function openSite(target) {
  const normalized = target.toLowerCase().replace(/\b(please|now|for me|website|app|site)\b/g, '').trim();
  const known = Object.keys(sites).find(name => normalized.includes(name));
  if (known) { respond(`Here’s ${known[0].toUpperCase() + known.slice(1)}. Tap to open it.`, { links: [{ label: `Open ${known} ↗`, href: sites[known] }] }); return; }
  const urlCandidate = target.match(/https?:\/\/[^\s]+/i)?.[0];
  if (urlCandidate && safeLink(urlCandidate)) { respond('Tap below to open that website.', { links: [{ label: 'Open website ↗', href: urlCandidate }] }); return; }
  respond(`I don’t have a shortcut for “${target}”. Search for it and choose a result.`, { links: [{ label: `Search ${target} ↗`, href: `https://www.google.com/search?q=${encodeURIComponent(target)}` }] });
}
async function research(topic) {
  respond(`I’m looking up “${topic}”…`);
  const index = conversation.length - 1;
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('No matching encyclopedia summary');
    const data = await response.json();
    const summary = data.extract || `I couldn’t find an encyclopedia summary for ${topic}. Try broadening the topic or open a web search.`;
    const options = { source: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replaceAll(' ', '_'))}`, sourceLabel: 'Wikipedia article', links: [{ label: `More results for ${topic} ↗`, href: `https://www.google.com/search?q=${encodeURIComponent(topic)}` }] };
    conversation[index] = { role: 'assistant', text: summary, options }; saveChat(); renderConversation(); speak(summary.slice(0, 450));
  } catch {
    conversation[index] = { role: 'assistant', text: `I couldn’t fetch a live summary right now. You can still explore current results for “${topic}”.`, options: { links: [{ label: `Search ${topic} ↗`, href: `https://www.google.com/search?q=${encodeURIComponent(topic)}` }, { label: 'Search DuckDuckGo ↗', href: `https://duckduckgo.com/?q=${encodeURIComponent(topic)}` }] } }; saveChat(); renderConversation();
  }
}
function addReminder(text) { const reminder = { id: crypto.randomUUID?.() || String(Date.now()), text, created: new Date().toISOString() }; reminders.unshift(reminder); localStorage.setItem(STORAGE.reminders, JSON.stringify(reminders)); renderReminders(); return reminder; }
function handleReminder(text) { const content = text.replace(/^(please\s+)?(remind me to|remind me|set a reminder to|add a reminder|remember to|reminder)\s*/i, '').trim(); if (!content) { respond('What would you like me to remind you about?'); return; } addReminder(content); respond(`Saved “${content}” in your reminders on this device. I can’t trigger a notification while this website is closed.`); }
function shareMessage(text) { const content = text.replace(/^(please\s+)?(draft|write|prepare|send|message|msg|whatsapp)(\s+(a\s+)?(message|msg))?\s*/i, '').trim(); if (!content) { respond('Tell me what you would like the message to say, and I’ll prepare a draft.'); return; } const link = `https://wa.me/?text=${encodeURIComponent(content)}`; respond(`Your WhatsApp message is ready to review. Zythar won’t send it for you—check the recipient and message in WhatsApp before you tap Send.`, { links: [{ label: 'Review WhatsApp draft ↗', href: link }] }); }
function supportiveReply(text) {
  const lower = text.toLowerCase();
  if (/suicid|kill myself|end my life|hurt myself|self harm|want to die/.test(lower)) return 'I’m really sorry you’re carrying this. You deserve immediate support from a real person. If you may be in immediate danger, call your local emergency number now or go to the nearest emergency department. If you can, tell someone you trust and stay with them. I’m an AI and can’t provide crisis care.';
  if (/anxious|anxiety|panic|overwhelm|stress|stressed|worried/.test(lower)) return 'That sounds like a lot to hold. If it feels okay, pause and take one slow breath out, then name one small thing you can do next. Would you like to tell me what’s weighing on you? I can listen, though I’m not a mental-health professional.';
  if (/sad|lonely|upset|hurt|angry|frustrat|feeling|feel /.test(lower)) return 'Thank you for sharing that with me. Your feelings matter, and you don’t have to solve everything at once. Would you like to say more about what happened, or think together about one small next step?';
  return null;
}
function parseCommand(raw) {
  const text = raw.trim(); const lower = text.toLowerCase();
  if (/^(open|launch|khol|kholo|start)\b/i.test(text)) { openSite(text.replace(/^(open|launch|khol|kholo|start)\s*/i, '')); return; }
  if (/^(search|google|find|look up|talash|dhundo|search karo)\b/i.test(text)) { const query = text.replace(/^(search( for)?|google( for)?|find|look up|talash|dhundo|search karo)\s*/i, '').trim(); query ? openSearch(query) : respond('What would you like me to search for?'); return; }
  if (/^(research|study|explore|research karo|study karo)\b/i.test(text)) { const topic = text.replace(/^(research|study|explore|research karo|study karo)\s*/i, '').trim(); topic ? research(topic) : respond('What topic should I look into?'); return; }
  if (/^(remind me|set a reminder|add a reminder|remember to|reminder)\b/i.test(text)) { handleReminder(text); return; }
  if (/^(draft|write|prepare|send|message|msg|whatsapp)\b/i.test(text)) { shareMessage(text); return; }
  const emotional = supportiveReply(text); if (emotional) { respond(emotional); return; }
  if (/^(hi|hello|hey|salam|assalam|assalamu|namaste)\b/i.test(lower)) { respond('Wa alaikum assalam! I’m here to help. You can ask me to search, research a topic, open a website, save a reminder, or just talk.'); return; }
  if (/what can you do|help me|help|kya kar|madad/i.test(lower)) { respond('I can help you search the web, find a brief topic summary, open popular websites, draft a WhatsApp message for you to review, save local reminders, or listen when you want to share how you feel. Try “Research healthy sleep” or “Open YouTube”.'); return; }
  if (/how are you|kaise ho|kese ho/i.test(lower)) { respond('I’m here and ready to help. How are you doing?'); return; }
  if (/^(thank|thanks|shukriya)/i.test(lower)) { respond('You’re welcome. I’m glad I could help.'); return; }
  respond(`I hear you. I’m a browser-based assistant and don’t have a connected generative AI service yet, but I can search the web, research public encyclopedia summaries, open websites, draft messages, and save reminders. Try “Search ${text.slice(0, 50)}”.`, { links: [{ label: `Search the web ↗`, href: `https://www.google.com/search?q=${encodeURIComponent(text)}` }] });
}
function sendCommand() { const text = input.value.trim(); if (!text) return; input.value = ''; input.style.height = 'auto'; addUser(text); parseCommand(text); }
function renderReminders() { $('#reminderCount').textContent = reminders.length; const list = $('#reminderList'); list.replaceChildren(); if (!reminders.length) { const empty = document.createElement('p'); empty.className = 'welcome-copy'; empty.textContent = 'No reminders yet. Add one below, or tell Zythar “Remind me to take a break”.'; list.append(empty); return; } reminders.forEach(item => { const row = document.createElement('div'); row.className = 'reminder-item'; const icon = document.createElement('span'); icon.textContent = '◷'; const content = document.createElement('p'); content.textContent = item.text; const date = document.createElement('small'); date.textContent = new Date(item.created).toLocaleString(); content.append(date); const del = document.createElement('button'); del.className = 'delete-reminder'; del.setAttribute('aria-label', 'Delete reminder'); del.textContent = '×'; del.addEventListener('click', () => { reminders = reminders.filter(reminder => reminder.id !== item.id); localStorage.setItem(STORAGE.reminders, JSON.stringify(reminders)); renderReminders(); }); row.append(icon, content, del); list.append(row); }); }
function setView(view) { const isReminders = view === 'reminders'; $('#chatView').hidden = isReminders; $('#remindersView').hidden = !isReminders; $('#pageTitle').textContent = isReminders ? 'My reminders' : 'Your assistant'; document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view)); $('#sidebar').classList.remove('open'); }
function setupRecognition() { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { $('#connectionStatus').textContent = 'Voice input unsupported here — typing still works'; $('#micButton').title = 'Voice input is not supported in this browser'; $('#micButton').addEventListener('click', () => showToast('Try Chrome or Edge for voice input; typing works everywhere.')); return; } recognition = new SpeechRecognition(); recognition.lang = langSelect.value; recognition.continuous = false; recognition.interimResults = true; recognition.onstart = () => { listening = true; $('#micButton').classList.add('listening'); $('#micButton').setAttribute('aria-label', 'Stop voice input'); }; recognition.onend = () => { listening = false; $('#micButton').classList.remove('listening'); $('#micButton').setAttribute('aria-label', 'Start voice input'); }; recognition.onerror = event => { if (event.error !== 'no-speech' && event.error !== 'aborted') showToast(event.error === 'not-allowed' ? 'Please allow microphone access in your browser.' : 'Voice input stopped. You can type instead.'); }; recognition.onresult = event => { let transcript = ''; for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript; input.value = transcript; input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 150)}px`; if (event.results[event.results.length - 1].isFinal) sendCommand(); }; }
$('#sendButton').addEventListener('click', sendCommand);
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendCommand(); } });
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 150)}px`; });
$('#micButton').addEventListener('click', () => { if (!recognition) return; try { listening ? recognition.stop() : recognition.start(); } catch { showToast('Voice input is already active.'); } });
langSelect.value = localStorage.getItem(STORAGE.language) || 'en-US'; langSelect.addEventListener('change', () => { localStorage.setItem(STORAGE.language, langSelect.value); if (recognition) recognition.lang = langSelect.value; showToast('Voice language updated.'); });
document.querySelectorAll('.suggestion').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.command; sendCommand(); }));
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('#newChatBtn').addEventListener('click', () => { conversation = []; saveChat(); renderConversation(); setView('chat'); input.focus(); });
$('#reminderForm').addEventListener('submit', event => { event.preventDefault(); const text = $('#reminderInput').value.trim(); if (!text) return; addReminder(text); $('#reminderInput').value = ''; showToast('Reminder saved on this device.'); });
$('#themeBtn').addEventListener('click', () => { document.body.classList.toggle('light'); localStorage.setItem(STORAGE.theme, document.body.classList.contains('light') ? 'light' : 'dark'); });
if (localStorage.getItem(STORAGE.theme) === 'light') document.body.classList.add('light');
$('#clearDataBtn').addEventListener('click', () => { if (!confirm('Delete your saved chat and reminders from this browser? This cannot be undone.')) return; localStorage.removeItem(STORAGE.chat); localStorage.removeItem(STORAGE.reminders); conversation = []; reminders = []; renderConversation(); renderReminders(); showToast('Your local data has been cleared.'); });
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#installBtn').hidden = true; });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
setupRecognition(); renderConversation(); renderReminders();
