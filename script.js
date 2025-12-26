let thinkingTimer = null;
let isBotThinking = false;

function addMessage(text, type, options = {}) {
    if (!text?.trim()) return null;

    const widgetBody = document.querySelector('.widget__body');
    if (!widgetBody) return null;

    const safeText = escapeHtml(text.trim());

    const messageEl = document.createElement('div');
    messageEl.className = `message message--${type}`;

    if (type === 'bot') {
        const logoSrc = options.logoSrc || 'img/logo.png';
        const logoAlt = options.logoAlt || 'Ассистент';
        messageEl.innerHTML = `
      <img class="message__logo" src="${escapeHtml(logoSrc)}" alt="${escapeHtml(logoAlt)}">
      <div class="message__text">${safeText}</div>
    `;
    } else if (type === 'user') {
        messageEl.innerHTML = `
      <div class="message__text">${safeText}</div>
    `;
    } else {
        console.warn('Неизвестный тип сообщения:', type);
        return null;
    }

    widgetBody.appendChild(messageEl);

    requestAnimationFrame(() => {
        widgetBody.scrollTop = widgetBody.scrollHeight;
    });

    return messageEl;
}

function escapeHtml(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
}

function hideSuggestions() {
    const suggestionsList = document.querySelector('.suggestions-list');
    if (suggestionsList) {
        suggestionsList.remove();
    }
}

function showBotThinking(duration = 12, onDone) {
    const widgetBody = document.querySelector('.widget__body');
    if (!widgetBody) return;

    isBotThinking = true;
    disableInput();

    if (thinkingTimer) {
        clearTimeout(thinkingTimer.intervalId);
        thinkingTimer.element?.remove();
    }

    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'bot-thinking';
    thinkingEl.innerHTML = `
    <img class="message__logo" src="img/logo.png" alt="София">
    <div class="message-loading">
      <div class="message-loading__dot"></div>
      <div class="message-loading__dot"></div>
      <div class="message-loading__dot"></div>
      <span class="message-loading__text">Менеджер ответит вам через <span class="message-loading__counter">${duration}</span> сек</span>
    </div>
  `;
    widgetBody.appendChild(thinkingEl);

    widgetBody.scrollTop = widgetBody.scrollHeight;

    let sec = duration;
    const counterEl = thinkingEl.querySelector('.message-loading__counter');

    const intervalId = setInterval(() => {
        sec--;
        if (sec >= 0) {
            counterEl.textContent = sec;
        } else {
            clearInterval(intervalId);
            thinkingEl.remove();
            thinkingTimer = null;

            isBotThinking = false;
            enableInput();

            onDone?.();
        }
    }, 1000);

    thinkingTimer = {
        element: thinkingEl,
        intervalId
    };
}

function disableInput() {
    const textarea = document.querySelector('.message-input');
    const submitBtn = document.querySelector('.message-submit');
    const buttons = document.querySelectorAll('.suggestions-list__item');

    if (textarea) textarea.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    buttons.forEach(btn => btn.disabled = true);
}

function enableInput() {
    const textarea = document.querySelector('.message-input');
    const submitBtn = document.querySelector('.message-submit');
    const buttons = document.querySelectorAll('.suggestions-list__item');

    if (textarea) textarea.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
    buttons.forEach(btn => btn.disabled = false);

    if (textarea) setTimeout(() => textarea.focus(), 50);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.widget__form');
    const messageInput = document.querySelector('.message-input');

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    })

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isBotThinking) {
            e.preventDefault();
            return;
        }

        const text = messageInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');

        hideSuggestions();

        messageInput.value = '';
        messageInput.focus();

        showBotThinking(12, () => {
            addMessage('Это ответ от менеджера', 'bot');
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.matches('.suggestions-list__item')) {
            if (isBotThinking) return;
            e.preventDefault();

            const messageText = e.target.dataset.message || e.target.textContent;
            if (!messageText.trim()) return;

            addMessage(messageText, 'user');

            e.target.remove();

            const suggestionsList = document.querySelector('.suggestions-list');
            if (suggestionsList && suggestionsList.children.length === 0) {
                suggestionsList.remove();
            }

            showBotThinking(12, () => {
                addMessage('Это ответ от менеджера', 'bot');
            });
        }
    });


});

