(() => {
  const waitForElements = () => {
    const micButton = document.querySelector('#micButton');
    const commandInput = document.querySelector('#commandInput');
    const sendButton = document.querySelector('#sendButton');
    const languageSelect = document.querySelector('#languageSelect');
    const toast = document.querySelector('#toast');
    if (!micButton || !commandInput || !sendButton || !languageSelect) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let listening = false;
    let toastTimer = null;
    let lastTranscript = '';

    const notify = (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const setListeningState = (active) => {
      listening = active;
      micButton.classList.toggle('listening', active);
      micButton.setAttribute('aria-pressed', String(active));
      micButton.setAttribute('aria-label', active ? 'Stop voice input' : 'Start voice input');
      micButton.title = active ? 'Listening… tap to stop' : 'Speak to Zythar';
      const status = document.querySelector('#connectionStatus');
      if (status) {
        status.textContent = active ? 'Listening… speak now' : 'Tap the microphone and speak';
      }
    };

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target !== micButton && !micButton.contains(target)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (!Recognition) {
        notify('Voice input is not supported here. Type your message instead.');
        return;
      }

      if (listening && recognition) {
        recognition.stop();
        return;
      }

      lastTranscript = '';
      recognition = new Recognition();
      recognition.lang = languageSelect.value || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListeningState(true);
      recognition.onerror = (errorEvent) => {
        const map = {
          'not-allowed': 'Please allow microphone access in your browser settings.',
          'service-not-allowed': 'Voice recognition is blocked by the browser or device.',
          'no-speech': 'I did not hear anything. Please try again.',
          'audio-capture': 'No microphone was found. Please check your device.',
          'network': 'Voice recognition needs internet access. Please try again.'
        };
        if (errorEvent.error !== 'aborted') {
          notify(map[errorEvent.error] || 'Voice input stopped. You can type your message instead.');
        }
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            final += `${transcript} `;
          } else {
            interim += transcript;
          }
        }

        const combined = `${final}${interim}`.trim();
        if (combined) {
          commandInput.value = combined;
          commandInput.style.height = 'auto';
          commandInput.style.height = `${Math.min(commandInput.scrollHeight, 150)}px`;
        }

        if (final.trim()) {
          recognition.stop();
          commandInput.value = final.trim();
          commandInput.style.height = 'auto';
          commandInput.style.height = `${Math.min(commandInput.scrollHeight, 150)}px`;
          sendButton.click();
        }
      };

      recognition.onend = () => {
        setListeningState(false);
        recognition = null;
      };

      try {
        recognition.start();
      } catch (error) {
        setListeningState(false);
        recognition = null;
        notify('Could not start voice input. Please try again.');
      }
    }, true);

    languageSelect.addEventListener('change', () => {
      if (recognition) {
        recognition.lang = languageSelect.value || 'en-US';
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements, { once: true });
  } else {
    waitForElements();
  }
})();
