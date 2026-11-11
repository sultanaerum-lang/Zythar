const siteMap = {
  youtube: 'https://www.youtube.com/',
  google: 'https://www.google.com/',
  gmail: 'https://mail.google.com/',
  github: 'https://github.com/',
  wikipedia: 'https://www.wikipedia.org/',
  whatsapp: 'https://web.whatsapp.com/',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  twitter: 'https://x.com/',
  linkedin: 'https://www.linkedin.com/',
  maps: 'https://www.google.com/maps',
  bing: 'https://www.bing.com/',
  duckduckgo: 'https://duckduckgo.com/'
};

const chatLog = document.getElementById('chatLog');
const commandInput = document.getElementById('commandInput');
const runCommandBtn = document.getElementById('runCommandBtn');
const micButton = document.getElementById('micButton');
const statusPill = document.getElementById('statusPill');
const speakBtn = document.getElementById('speakBtn');
const researchBox = document.getElementById('researchBox');

let recognition = null;
let recognitionActive = false;
let lastSpokenText = '';

function addMessage(text, role = 'bot') {
  const message = document.createElement('div');
  message.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;

  const label = document.createElement('span');
  label.className = 'role';
  label.textContent = role === 'user' ? 'You' : 'Zythar';

  const para = document.createElement('p');
  para.textContent = text;

  message.appendChild(label);
  message.appendChild(para);
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setStatus(text, listening = false) {
  statusPill.innerHTML = `<span class="pulse" style="background:${listening ? '#ff7d7d' : '#7ef2af'}"></span>${text}`;
}

function speakText(text) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  lastSpokenText = text;
}

function openWebsite(name) {
  const cleaned = name.toLowerCase().trim();
  const url = siteMap[cleaned] || null;

  if (url) {
    window.open(url, '_blank', 'noopener');
    return `Opening ${cleaned}.`;
  }

  if (/^https?:\/\//i.test(name)) {
    window.open(name, '_blank', 'noopener');
    return `Opening ${name}.`;
  }

  const searchQuery = encodeURIComponent(name);
  window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener');
  return `Searching the web for ${name}.`;
}

function searchWeb(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(url, '_blank', 'noopener');
  return `I opened a search for: ${query}`;
}

function createMessageLink(text) {
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener');
  return 'I drafted a WhatsApp message. Please review and send it.';
}

async function fetchResearchSummary(topic) {
  const fallback = `I found a summary for “${topic}”. Start with trusted sources like Wikipedia, official docs, and recent news. If you want, I can also explain it in simpler Urdu or English.`;

  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const response = await fetch(wikiUrl);

    if (!response.ok) {
      throw new Error('Wikipedia fetch failed');
    }

    const data = await response.json();
    const summary = data.extract || fallback;
    const display = summary.length > 300 ? `${summary.slice(0, 300)}...` : summary;
    researchBox.innerHTML = `<strong>${topic}</strong><br>${display}<br><br><a href="${data.content_urls?.desktop?.page || 'https://en.wikipedia.org/'}" target="_blank" rel="noreferrer">Read more on Wikipedia</a>`;
    return `I researched ${topic}. ${display}`;
  } catch (error) {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_redirect=1&no_html=1`;

    try {
      const ddgResponse = await fetch(ddgUrl);
      const ddgData = await ddgResponse.json();
      const subject = ddgData.AbstractText || ddgData.RelatedTopics?.[0]?.Text || fallback;
      const brief = subject.length > 300 ? `${subject.slice(0, 300)}...` : subject;
      researchBox.innerHTML = `<strong>${topic}</strong><br>${brief}<br><br><a href="https://duckduckgo.com/?q=${encodeURIComponent(topic)}" target="_blank" rel="noreferrer">Open search results</a>`;
      return `I researched ${topic}. ${brief}`;
    } catch (ddgError) {
      researchBox.innerHTML = `<strong>${topic}</strong><br>${fallback}<br><br><a href="https://duckduckgo.com/?q=${encodeURIComponent(topic)}" target="_blank" rel="noreferrer">Open search results</a>`;
      return `I could not fetch a live summary for ${topic}, but here is the best next step: search trusted sources and review recent updates.`;
    }
  }
}

async function handleCommand(command) {
  const text = command.trim();
  if (!text) return;

  addMessage(text, 'user');

  const lower = text.toLowerCase();

  if (/(hello|hi|hey|salam|assalam|namaste)/i.test(lower)) {
    const reply = 'Hello! I am Zythar AI. I can help with voice search, websites, research, messages, and emotional support.';
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(how are you|kese ho|aap kaise ho|tum theek ho)/i.test(lower)) {
    const reply = 'I am doing well and ready to help you. What can I do for you today?';
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(open|launch|khol|kholo|start)/i.test(lower)) {
    const match = text.match(/(?:open|launch|khol|kholo|start)\s+(.*)/i);
    const target = match ? match[1].trim() : '';

    if (!target) {
      const reply = 'Please tell me which website or app you want to open.';
      addMessage(reply, 'bot');
      speakText(reply);
      return;
    }

    const reply = openWebsite(target);
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(search|google|duckduckgo|find|talash|search karo|dhundho)/i.test(lower)) {
    const match = text.match(/(?:search|google|duckduckgo|find|talash|search karo|dhundho)\s+(.*)/i);
    const query = match ? match[1].trim() : text.replace(/(?:search|google|duckduckgo|find|talash|search karo|dhundho)/i, '').trim();

    if (!query) {
      const reply = 'What would you like me to search for?';
      addMessage(reply, 'bot');
      speakText(reply);
      return;
    }

    const reply = searchWeb(query);
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(research|study|research karo|study karo|investigate|explore)/i.test(lower)) {
    const match = text.match(/(?:research|study|research karo|study karo|investigate|explore)\s+(.*)/i);
    const topic = match ? match[1].trim() : text.replace(/(?:research|study|research karo|study karo|investigate|explore)/i, '').trim();

    if (!topic) {
      const reply = 'Please tell me which topic to research.';
      addMessage(reply, 'bot');
      speakText(reply);
      return;
    }

    const reply = await fetchResearchSummary(topic);
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(message|msg|send message|whatsapp|sms|text|message bhejo|msg bhejo|sms bhejo)/i.test(lower)) {
    const match = text.match(/(?:message|msg|send message|whatsapp|sms|text|message bhejo|msg bhejo|sms bhejo)\s+(.*)/i);
    const content = match ? match[1].trim() : text.replace(/(?:message|msg|send message|whatsapp|sms|text|message bhejo|msg bhejo|sms bhejo)/i, '').trim();

    if (!content) {
      const reply = 'What message should I prepare?';
      addMessage(reply, 'bot');
      speakText(reply);
      return;
    }

    const reply = createMessageLink(content);
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(feel|feeling|emotion|stress|anxious|sad|happy|depressed|frustrated|i feel|main feel|main mehsoos karta hoon)/i.test(lower)) {
    const reply = 'Thank you for sharing that. It is okay to feel this way. Try to breathe slowly for 10 seconds, note one thing you can control, and if it feels overwhelming, talk to someone you trust or a mental health professional.';
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(reminder|note|remember|yaad|note kar|remind me|remember me)/i.test(lower)) {
    const reply = 'Reminder saved in your browser. You can revisit it later from the local notes or your app memory.';
    const stored = JSON.parse(localStorage.getItem('zytharReminders') || '[]');
    stored.push(text);
    localStorage.setItem('zytharReminders', JSON.stringify(stored));
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  if (/(what can you do|help|aap kya kar sakte ho|madad|assistance)/i.test(lower)) {
    const reply = 'I can open websites, search the web, research topics, draft WhatsApp messages, help with emotional support, reminders, and daily productivity guidance.';
    addMessage(reply, 'bot');
    speakText(reply);
    return;
  }

  const reply = `I understand your request: “${text}”. I can help with a command like “Open YouTube”, “Search AI trends”, “Research climate change”, or “Send message hello team”.`;
  addMessage(reply, 'bot');
  speakText(reply);
}

async function runCommandFromInput() {
  const text = commandInput.value.trim();
  if (!text) return;
  commandInput.value = '';
  await handleCommand(text);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micButton.title = 'Speech recognition not supported in this browser.';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognitionActive = true;
    micButton.classList.add('listening');
    setStatus('Listening...', true);
  };

  recognition.onend = () => {
    recognitionActive = false;
    micButton.classList.remove('listening');
    setStatus('Ready');
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    setStatus('Ready');
    addMessage(`Voice recognition error: ${event.error}. Please type your command instead.`, 'bot');
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    commandInput.value = transcript;
    await handleCommand(transcript);
  };
}

micButton.addEventListener('click', () => {
  if (!recognition) {
    setupSpeechRecognition();
  }

  if (recognitionActive) {
    recognition.stop();
    return;
  }

  recognition.start();
});

runCommandBtn.addEventListener('click', runCommandFromInput);
commandInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    await runCommandFromInput();
  }
});

speakBtn.addEventListener('click', () => {
  if (lastSpokenText) {
    speakText(lastSpokenText);
  } else {
    speakText('I am Zythar AI, ready to help you.');
  }
});

document.querySelectorAll('.action-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const command = button.dataset.command;
    commandInput.value = command;
    await handleCommand(command);
  });
});

setupSpeechRecognition();
setStatus('Ready');
