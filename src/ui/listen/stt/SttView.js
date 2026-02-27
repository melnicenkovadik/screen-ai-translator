import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class SttView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 0;
        }

        .toolbar {
            display: flex;
            gap: 6px;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            flex-shrink: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .toolbar-left {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .toolbar-right {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .lang-select {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 4px 6px;
            font-size: 11px;
            outline: none;
            cursor: pointer;
        }

        .lang-arrow {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }

        .transcription-container {
            overflow-y: auto;
            padding: 8px 12px 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: 0;
            position: relative;
            z-index: 1;
            flex: 1;
        }

        .transcription-container::-webkit-scrollbar {
            width: 8px;
        }
        .transcription-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        .transcription-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        .transcription-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .speaker-label {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.45);
            padding: 4px 4px 1px 4px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        .speaker-label.them {
            align-self: flex-start;
        }

        .speaker-label.me {
            align-self: flex-end;
        }

        .stt-message {
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.5;
            font-size: 13px;
            margin-bottom: 2px;
            box-sizing: border-box;
        }

        .message-text {
            white-space: pre-wrap;
        }

        .message-actions {
            display: flex;
            gap: 6px;
            margin-top: 6px;
        }

        .msg-button {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border: none;
            outline: none;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .msg-button:hover {
            background: rgba(255, 255, 255, 0.18);
        }

        .msg-button.answer {
            background: rgba(0, 180, 100, 0.25);
            color: rgba(180, 255, 210, 0.95);
        }

        .msg-button.answer:hover {
            background: rgba(0, 180, 100, 0.35);
        }

        .stt-message.me .msg-button {
            background: rgba(255, 255, 255, 0.2);
        }

        .stt-message.me .msg-button:hover {
            background: rgba(255, 255, 255, 0.28);
        }

        .clear-btn {
            background: transparent;
            color: rgba(255, 255, 255, 0.5);
            border: none;
            outline: none;
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .clear-btn:hover {
            background: rgba(255, 80, 80, 0.2);
            color: rgba(255, 100, 100, 0.9);
        }

        .stt-message.them {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            margin-right: auto;
        }

        .stt-message.me {
            background: rgba(0, 122, 255, 0.8);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            margin-left: auto;
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            font-style: italic;
        }

        .auto-translate-toggle {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            user-select: none;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
            padding: 3px 6px;
            border-radius: 6px;
            transition: background-color 0.15s ease;
            white-space: nowrap;
        }

        .auto-translate-toggle:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .auto-translate-toggle.active {
            color: rgba(255, 255, 255, 0.95);
        }

        .toggle-track {
            width: 26px;
            height: 14px;
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.2);
            position: relative;
            transition: background-color 0.2s ease;
            flex-shrink: 0;
        }

        .toggle-track.active {
            background: rgba(0, 122, 255, 0.8);
        }

        .toggle-thumb {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: white;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: transform 0.2s ease;
        }

        .toggle-track.active .toggle-thumb {
            transform: translateX(12px);
        }

        .translated-text {
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            font-size: 12px;
            opacity: 0.8;
            white-space: pre-wrap;
            font-style: italic;
            animation: slideInTranslation 0.25s ease-out;
        }

        @keyframes slideInTranslation {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 0.8; transform: translateY(0); }
        }

        .translating-dots {
            display: flex;
            align-items: center;
            gap: 3px;
            margin-top: 4px;
            padding-top: 4px;
        }

        .translating-dots span {
            width: 4px;
            height: 4px;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: pulse 1.4s infinite ease-in-out both;
        }
        .translating-dots span:nth-of-type(1) { animation-delay: -0.32s; }
        .translating-dots span:nth-of-type(2) { animation-delay: -0.16s; }

        @keyframes pulse {
            0%, 80%, 100% { opacity: 0.2; }
            40% { opacity: 1.0; }
        }

        .translate-error {
            margin-top: 4px;
            font-size: 10px;
            color: rgba(255, 100, 100, 0.8);
            animation: fadeOutError 3s ease-out forwards;
        }

        @keyframes fadeOutError {
            0%, 70% { opacity: 1; }
            100% { opacity: 0; }
        }

        .context-select {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 3px 6px;
            font-size: 10px;
            outline: none;
            cursor: pointer;
            max-width: 90px;
        }

        .custom-context-input {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 3px 6px;
            font-size: 10px;
            outline: none;
            width: 100%;
            box-sizing: border-box;
            margin-top: 4px;
        }

        .custom-context-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        .context-bar {
            display: flex;
            padding: 0 12px 4px 12px;
            flex-shrink: 0;
        }
    `;

    static properties = {
        sttMessages: { type: Array },
        isVisible: { type: Boolean },
        copiedMessageId: { type: Number },
        targetLanguage: { type: String },
        sourceLanguage: { type: String },
        autoTranslate: { type: Boolean },
        contextMode: { type: String },
        customContext: { type: String },
    };

    constructor() {
        super();
        this.sttMessages = [];
        this.isVisible = true;
        this.messageIdCounter = 0;
        this._shouldScrollAfterUpdate = false;

        this.handleSttUpdate = this.handleSttUpdate.bind(this);
        this.copyMessageText = this.copyMessageText.bind(this);
        this.translateMessage = this.translateMessage.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleSourceLanguageChange = this.handleSourceLanguageChange.bind(this);
        this.clearHistory = this.clearHistory.bind(this);

        this.targetLanguage = 'ru';
        this.sourceLanguage = 'auto';
        this.autoTranslate = false;
        this.contextMode = 'none';
        this.customContext = '';
        this._pendingTranslations = new Set();
        this._translateQueue = [];
        this._activeTranslations = 0;
        this._maxConcurrentTranslations = 3;
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api) {
            window.api.sttView.onSttUpdate(this.handleSttUpdate);
        }

        try {
            const saved = localStorage.getItem('sttTargetLanguage');
            if (saved) this.targetLanguage = saved;
            const savedAuto = localStorage.getItem('sttAutoTranslate');
            if (savedAuto !== null) this.autoTranslate = savedAuto === 'true';
            const savedCtx = localStorage.getItem('sttContextMode');
            if (savedCtx) this.contextMode = savedCtx;
            const savedCustomCtx = localStorage.getItem('sttCustomContext');
            if (savedCustomCtx) this.customContext = savedCustomCtx;
        } catch {}

        setTimeout(async () => {
            try {
                const current = await window.api?.listenView?.getLanguage?.();
                if (current) {
                    this.sourceLanguage = current;
                    this.requestUpdate();
                }
            } catch {}
        }, 0);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.api) {
            window.api.sttView.removeOnSttUpdate(this.handleSttUpdate);
        }
    }

    resetTranscript() {
        this.sttMessages = [];
        this.requestUpdate();
    }

    handleSttUpdate(event, { speaker, text, isFinal, isPartial }) {
        if (text === undefined) return;

        const container = this.shadowRoot.querySelector('.transcription-container');
        this._shouldScrollAfterUpdate = container
            ? container.scrollTop + container.clientHeight >= container.scrollHeight - 30
            : true;

        const findLastPartialIdx = spk => {
            for (let i = this.sttMessages.length - 1; i >= 0; i--) {
                const m = this.sttMessages[i];
                if (m.speaker === spk && m.isPartial) return i;
            }
            return -1;
        };

        const newMessages = [...this.sttMessages];
        const targetIdx = findLastPartialIdx(speaker);

        if (isPartial) {
            if (targetIdx !== -1) {
                newMessages[targetIdx] = {
                    ...newMessages[targetIdx],
                    text,
                    isPartial: true,
                    isFinal: false,
                };
            } else {
                newMessages.push({
                    id: this.messageIdCounter++,
                    speaker,
                    text,
                    isPartial: true,
                    isFinal: false,
                });
            }
        } else if (isFinal) {
            if (targetIdx !== -1) {
                newMessages[targetIdx] = {
                    ...newMessages[targetIdx],
                    text,
                    isPartial: false,
                    isFinal: true,
                };
            } else {
                newMessages.push({
                    id: this.messageIdCounter++,
                    speaker,
                    text,
                    isPartial: false,
                    isFinal: true,
                });
            }
        }

        this.sttMessages = newMessages;

        if (isFinal && this.autoTranslate) {
            const finalMsg = newMessages.find(m => m.isFinal && m.text === text && !m.translatedText && !this._pendingTranslations.has(m.id));
            if (finalMsg) {
                this._triggerAutoTranslate(finalMsg);
            }
        }
        
        this.dispatchEvent(new CustomEvent('stt-messages-updated', {
            detail: { messages: this.sttMessages },
            bubbles: true
        }));
    }

    scrollToBottom() {
        this.updateComplete.then(() => {
            const container = this.shadowRoot.querySelector('.transcription-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    getSpeakerClass(speaker) {
        return speaker.toLowerCase() === 'me' ? 'me' : 'them';
    }

    getTranscriptText() {
        return this.sttMessages.map(msg => `${msg.speaker}: ${msg.text}`).join('\n');
    }

    async copyMessageText(message) {
        try {
            await navigator.clipboard.writeText(message.text || '');
            this.copiedMessageId = message.id;
            this.requestUpdate();
            setTimeout(() => {
                this.copiedMessageId = null;
                this.requestUpdate();
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    async translateMessage(message) {
        if (!message?.text?.trim()) return;
        if (message.translatedText || this._pendingTranslations.has(message.id)) return;
        this._triggerAutoTranslate(message);
    }

    handleLanguageChange(event) {
        const value = event?.target?.value || 'ru';
        this.targetLanguage = value;
        try { localStorage.setItem('sttTargetLanguage', value); } catch {}
        this.requestUpdate();
    }

    async handleSourceLanguageChange(event) {
        const value = (event?.target?.value || 'auto').trim();
        this.sourceLanguage = value;
        try {
            await window.api?.listenView?.setLanguage?.(value);
        } catch (err) {
            console.error('Failed to set source language:', err);
        }
        this.dispatchEvent(new CustomEvent('stt-messages-updated', {
            detail: { messages: this.sttMessages },
            bubbles: true
        }));
    }

    clearHistory() {
        this.sttMessages = [];
        this._pendingTranslations.clear();
        this._translateQueue = [];
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('stt-messages-updated', {
            detail: { messages: this.sttMessages },
            bubbles: true
        }));
    }

    toggleAutoTranslate() {
        this.autoTranslate = !this.autoTranslate;
        try { localStorage.setItem('sttAutoTranslate', String(this.autoTranslate)); } catch {}
        this.requestUpdate();
    }

    _triggerAutoTranslate(msg) {
        if (!msg.text?.trim() || !window.api?.sttView?.translateText) return;
        if (this._pendingTranslations.has(msg.id)) return;

        this._pendingTranslations.add(msg.id);
        this._updateMessageField(msg.id, 'isTranslating', true);
        this._updateMessageField(msg.id, 'translateError', null);

        if (this._activeTranslations < this._maxConcurrentTranslations) {
            this._runTranslation(msg);
        } else {
            this._translateQueue.push(msg);
        }
    }

    async _runTranslation(msg) {
        this._activeTranslations++;
        try {
            const result = await window.api.sttView.translateText(msg.text, this.targetLanguage);
            if (result?.success && result.translatedText) {
                this._updateMessageField(msg.id, 'translatedText', result.translatedText);
            } else {
                this._updateMessageField(msg.id, 'translateError', result?.error || 'Failed');
                setTimeout(() => this._updateMessageField(msg.id, 'translateError', null), 3500);
            }
        } catch (err) {
            console.error('[SttView] Auto-translate failed:', err);
            this._updateMessageField(msg.id, 'translateError', 'Translation failed');
            setTimeout(() => this._updateMessageField(msg.id, 'translateError', null), 3500);
        } finally {
            this._pendingTranslations.delete(msg.id);
            this._updateMessageField(msg.id, 'isTranslating', false);
            this._activeTranslations--;
            if (this._translateQueue.length > 0) {
                this._runTranslation(this._translateQueue.shift());
            }
        }
    }

    _updateMessageField(msgId, field, value) {
        const idx = this.sttMessages.findIndex(m => m.id === msgId);
        if (idx === -1) return;
        const updated = [...this.sttMessages];
        updated[idx] = { ...updated[idx], [field]: value };
        this.sttMessages = updated;
        this.requestUpdate();
    }

    _isQuestion(text) {
        if (!text) return false;
        const trimmed = text.trim();
        if (trimmed.endsWith('?')) return true;
        const questionStarters = /^(what|how|why|can|do|does|did|is|are|was|were|could|would|should|will|shall|tell me|explain|describe|have you|has |who|where|when|which)/i;
        return questionStarters.test(trimmed);
    }

    _getLangName(code) {
        const map = { ru: 'Russian', en: 'English', uk: 'Ukrainian', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', tr: 'Turkish', pl: 'Polish', ar: 'Arabic', hi: 'Hindi' };
        return map[code] || code;
    }

    _getContextPresets() {
        return {
            'none': '',
            'interview': 'You are a frontend developer in a technical interview. The interviewer speaks English. Give concise, professional answers demonstrating expertise.',
            'standup': 'You are a frontend developer in a daily standup meeting with your team. Keep answers brief and status-focused.',
            'meeting': 'You are in a professional business meeting. Be clear and concise.',
        };
    }

    _getContextText() {
        if (this.contextMode === 'custom') return this.customContext || '';
        return this._getContextPresets()[this.contextMode] || '';
    }

    handleContextChange(event) {
        this.contextMode = event?.target?.value || 'none';
        try { localStorage.setItem('sttContextMode', this.contextMode); } catch {}
        this.requestUpdate();
    }

    handleCustomContextInput(event) {
        this.customContext = event?.target?.value || '';
        try { localStorage.setItem('sttCustomContext', this.customContext); } catch {}
    }

    async answerQuestion(msg) {
        if (!msg?.text?.trim() || !window.api?.askView?.sendMessage) return;

        const contextMessages = this.sttMessages
            .filter(m => m.isFinal && m.text?.trim())
            .slice(-15);

        const context = contextMessages
            .map(m => `${m.speaker === 'Me' ? 'You' : 'Interviewer'}: ${m.text}`)
            .join('\n');

        const modeContext = this._getContextText();
        const langName = this._getLangName(this.targetLanguage);
        const prompt = `${modeContext ? modeContext + '\n\n' : ''}Based on this conversation:\n\n${context}\n\nAnswer this question concisely and professionally: "${msg.text.trim()}"\n\nAfter the answer, add a separator line "---" and provide a full translation of your answer into ${langName}.`;

        try {
            await window.api.askView.sendMessage(prompt, { skipScreenshot: true });
        } catch (err) {
            console.error('[SttView] Failed to send answer request:', err);
        }
    }

    _isSpeakerChange(index) {
        if (index === 0) return true;
        return this.sttMessages[index].speaker !== this.sttMessages[index - 1].speaker;
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('sttMessages')) {
            if (this._shouldScrollAfterUpdate) {
                this.scrollToBottom();
                this._shouldScrollAfterUpdate = false;
            }
        }
    }

    _langOptions() {
        return html`
            <option value="auto">Auto</option>
            <option value="ru">Russian</option>
            <option value="en">English</option>
            <option value="uk">Ukrainian</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="tr">Turkish</option>
            <option value="pl">Polish</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
        `;
    }

    _targetLangOptions() {
        return html`
            <option value="ru">Russian</option>
            <option value="en">English</option>
            <option value="uk">Ukrainian</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="tr">Turkish</option>
            <option value="pl">Polish</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
        `;
    }

    render() {
        if (!this.isVisible) {
            return html`<div style="display: none;"></div>`;
        }

        return html`
            <div class="toolbar">
                <div class="toolbar-left">
                    <select class="lang-select" title="Source language for speech recognition"
                            @change=${this.handleSourceLanguageChange} .value=${this.sourceLanguage}>
                        ${this._langOptions()}
                    </select>
                    <span class="lang-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M13 6l6 6-6 6"/>
                        </svg>
                    </span>
                    <select class="lang-select" title="Target language for translation"
                            @change=${this.handleLanguageChange} .value=${this.targetLanguage}>
                        ${this._targetLangOptions()}
                    </select>
                </div>
                <div class="toolbar-right">
                    <select class="context-select" title="Set conversation context for better AI answers"
                            @change=${this.handleContextChange} .value=${this.contextMode}>
                        <option value="none">Context</option>
                        <option value="interview">Interview</option>
                        <option value="standup">Standup</option>
                        <option value="meeting">Meeting</option>
                        <option value="custom">Custom...</option>
                    </select>
                    <div class="auto-translate-toggle ${this.autoTranslate ? 'active' : ''}"
                         title="Automatically translate each finalized transcription segment"
                         @click=${this.toggleAutoTranslate}>
                        <div class="toggle-track ${this.autoTranslate ? 'active' : ''}">
                            <div class="toggle-thumb"></div>
                        </div>
                        <span>Auto Translate</span>
                    </div>
                    <button class="clear-btn" title="Clear transcript" @click=${this.clearHistory}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${this.contextMode === 'custom' ? html`
                <div class="context-bar">
                    <input class="custom-context-input" type="text"
                           placeholder="Describe your situation..."
                           .value=${this.customContext}
                           @input=${this.handleCustomContextInput}>
                </div>
            ` : ''}
            <div class="transcription-container">
                ${this.sttMessages.length === 0
                    ? html`<div class="empty-state">Waiting for speech...</div>`
                    : this.sttMessages.map((msg, idx) => html`
                        ${this._isSpeakerChange(idx) ? html`
                            <div class="speaker-label ${this.getSpeakerClass(msg.speaker)}">
                                ${msg.speaker.toLowerCase() === 'me' ? 'You' : 'Speaker'}
                            </div>
                        ` : ''}
                        <div class="stt-message ${this.getSpeakerClass(msg.speaker)}">
                            <div class="message-text">${msg.text}</div>
                            ${msg.translatedText ? html`
                                <div class="translated-text">${msg.translatedText}</div>
                            ` : msg.isTranslating ? html`
                                <div class="translating-dots"><span></span><span></span><span></span></div>
                            ` : msg.translateError ? html`
                                <div class="translate-error">${msg.translateError}</div>
                            ` : ''}
                            ${msg.isFinal ? html`
                                <div class="message-actions">
                                    <button class="msg-button"
                                        @click=${() => this.copyMessageText(msg)}>
                                        ${this.copiedMessageId === msg.id ? 'Copied' : 'Copy'}
                                    </button>
                                    ${!this.autoTranslate && !msg.translatedText && !msg.isTranslating ? html`
                                        <button class="msg-button"
                                            @click=${() => this.translateMessage(msg)}>
                                            Translate
                                        </button>
                                    ` : ''}
                                    ${this.getSpeakerClass(msg.speaker) === 'them' && this._isQuestion(msg.text) ? html`
                                        <button class="msg-button answer"
                                            @click=${() => this.answerQuestion(msg)}>
                                            Answer
                                        </button>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `)
                }
            </div>
        `;
    }
}

customElements.define('stt-view', SttView);
