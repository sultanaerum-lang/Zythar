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
    let submitted = false;
    let finalTranscript = '';
    let toastTimer = null;

    const notify = (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    };

    const setListeningState = (active) => {
      listening = active;
      micButton.classList.toggle('listening', active);
      micButton.setAttribute('aria-pressed', String(active));
      micButton.setAttribute('aria-label', active ? 'Stop voice input' : 'Start voice input');
      micButton.title = active ? 'Listening… tap to stop' : 'Speak to Zythar';
      const status = document.querySelector('#connectionStatus');
      if (status) status.textContent = active ? 'Listening… speak now' : 'Tap the microphone and speak';
    };

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target !== micButton && !micButton.contains(target)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (!Recognition) {
        notify('Voice input is not supported in this browser. Try a current version of Chrome or Edge, or type your message.');
        return;
      }

      if (listening && recognition) {
        recognition.stop();
        return;
      }

      finalTranscript = '';
      submitted = false;
      recognition = new Recognition();
      recognition.lang = languageSelect.value || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListeningState(true);
      recognition.onerror = (errorEvent) => {
        const messages = {
          'not-allowed': 'Please allow microphone access in your browser settings.',
          'service-not-allowed': 'Voice recognition is blocked by the browser or device.',
          'no-speech': 'I did not hear anything. Please try again.',
          'audio-capture': 'No microphone was found. Check your device microphone.',
          'network': 'Voice recognition needs an internet connection. Please try again.'
        };
        if (errorEvent.error !== 'aborted') {
          notify(messages[errorEvent.error] || 'Voice input stopped. You can type your message instead.');
        }
      };

      recognition.onresult = (resultEvent) => {
        let interim = '';
        for (let i = resultEvent.resultIndex; i < resultEvent.results.length; i += 1) {
          const phrase = resultEvent.results[i][0]?.transcript?.trim() || '';
          if (!phrase) continue;
          if (resultEvent.results[i].isFinal) finalTranscript += `${phrase} `;
          else interim += `${phrase} `;
        }

        const transcript = `${finalTranscript}${interim}`.trim();
        if (transcript) {
          commandInput.value = transcript;
          commandInput.style.height = 'auto';
          commandInput.style.height = `${Math.min(commandInput.scrollHeight, 150)}px`;
        }

        if (finalTranscript.trim() && !submitted) {
          submitted = true;
          commandInput.value = finalTranscript.trim();
          commandInput.style.height = 'auto';
          commandInput.style.height = `${Math.min(commandInput.scrollHeight, 150)}px`;
          recognition.stop();
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
        notify(error.name === 'NotAllowedError'
          ? 'Please allow microphone access in your browser settings.'
          : 'Could not start voice input. Please try again.');
      }
    }, true);

    languageSelect.addEventListener('change', () => {
      if (recognition && listening) {
        recognition.stop();
        notify('Voice language changed. Tap the microphone to start listening again.');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements, { once: true });
  } else {
    waitForElements();
  }
})();
