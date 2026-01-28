const API_URL = 'https://sr.neuro7.pro:5009/webhook/widget';
const PROJECTS = '1';
const LOGO_URL = 'https://denisionov1.github.io/widget_full_screen/img/logo.png';
const LOGO_ALT = 'Ассистент';
let thinkingTimer = null;
let isBotThinking = false;
let isFirstUserMessage = true;

function addMessage(text, type, options = {}) {
    if (!text?.trim()) return null;

    const widgetBody = document.querySelector('.widget__body');
    if (!widgetBody) return null;

    const safeText = escapeHtml(text.trim());

    const messageEl = document.createElement('div');
    messageEl.className = `message message--${type}`;

    if (type === 'bot') {
        const logoSrc = options.logoSrc || LOGO_URL;
        const logoAlt = options.logoAlt || LOGO_ALT;
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

function showTypingIndicator() {
    const widgetBody = document.querySelector('.widget__body');
    if (!widgetBody) return;

    isBotThinking = true;
    disableInput();

    const typing = document.createElement('div');
    typing.className = 'bot-thinking';
    typing.innerHTML = `
        <img class="message__logo" src="${LOGO_URL}" alt="${LOGO_ALT}">
        <div class="message-loading">
            <div class="message-loading__dot"></div>
            <div class="message-loading__dot"></div>
            <div class="message-loading__dot"></div>

        <div class="typing">
            <span class="pencil">
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                 d="M17.71 4.0425C18.1 3.6525 18.1 3.0025 17.71 2.6325L15.37 0.2925C15 -0.0975 14.35 -0.0975 13.96 0.2925L12.12 2.1225L15.87 5.8725M0 14.2525V18.0025H3.75L14.81 6.9325L11.06 3.1825L0 14.2525Z"
                 fill="#000" />
                </svg>
            </span>
        </div>
    </div>
    `;

    widgetBody.appendChild(typing);
    widgetBody.scrollTop = widgetBody.scrollHeight;

    thinkingTimer = {element : typing};
}

function showBotThinking(duration = 12) {
    const widgetBody = document.querySelector('.widget__body');
    if (!widgetBody) return;

    isBotThinking = true;
    disableInput();

    if (thinkingTimer) {
        clearInterval(thinkingTimer.intervalId);
        thinkingTimer.element?.remove();
    }

    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'bot-thinking';
    thinkingEl.innerHTML = `
    <img class="message__logo" src="${LOGO_URL}" alt="${LOGO_ALT}">
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
        }
    }, 1000);

    thinkingTimer = {
        element: thinkingEl,
        intervalId
    };
}

function hideAnyThinking() {
    if (thinkingTimer) {
        thinkingTimer.element?.remove();
        if (thinkingTimer.intervalId) {
            clearInterval(thinkingTimer.intervalId);
        }
        thinkingTimer = null;
    }
    isBotThinking = false;
    enableInput();
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

function getChatId(forceNew = false) {
    if (forceNew || !window.currentChatId) {
        window.currentChatId = crypto.randomUUID();
    }
    return window.currentChatId;
}

function generateMessageId() {
    return crypto.randomUUID();
}

function buildMessagePayload(text) {
    return {
        messages: [
            {
                messageId: generateMessageId(),
                chatType: 'neuro_widget',
                chatId: getChatId(),
                projects: PROJECTS,
                type: 'text',
                status: 'inbound',
                text: text,
                timestamp: Math.floor(Date.now() / 1000)
            }
        ]
    }
}

async function sendMessageToBackend(text) {
    const payload = buildMessagePayload(text);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Ошибка отправки сообщения');
        }

        return await response.json();
    } catch (err) {
        console.error('Ошибка API:', err);
        throw err;
    }
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isBotThinking) return;

        const text = messageInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        hideSuggestions();
        messageInput.value = '';
        messageInput.focus();

        if (isFirstUserMessage) {
            showBotThinking(12);
            isFirstUserMessage = false;
        }else {
            showTypingIndicator();
        }

        try {
            const result = await sendMessageToBackend(text);

            hideAnyThinking();

            if (result?.response) {
                addMessage(result.response, 'bot');
            }
        } catch {
            hideAnyThinking();
            addMessage('Произошла ошибка. Попробуйте позже', 'bot');
        }
    });

    document.addEventListener('click', async (e) => {
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

            if (isFirstUserMessage) {
                showBotThinking(12);
                isFirstUserMessage = false;
            }else {
                showTypingIndicator();
            }


            try {
                const result = await sendMessageToBackend(messageText);

                hideAnyThinking();

                if (result?.response) {
                    addMessage(result.response, 'bot');
                }
            } catch {
                hideAnyThinking();
                addMessage('Произошла ошибка. Попробуйте позже', 'bot');
            }
        }
    });
});