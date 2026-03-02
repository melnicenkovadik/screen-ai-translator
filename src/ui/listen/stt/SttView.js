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
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .lang-select {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 4px 6px;
            font-size: 11px;
            outline: none;
            cursor: default;
        }

        .lang-arrow {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }

        .transcription-container {
            overflow-y: auto !important;
            overflow-x: hidden;
            padding: 4px 10px 20px 10px;
            scroll-padding-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-height: 0;
            height: 100%;
            position: relative;
            z-index: 1;
            flex: 1;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        .transcription-container, .transcription-container * {
            pointer-events: auto !important;
        }

        .jump-to-latest {
            position: sticky;
            bottom: 8px;
            margin-left: auto;
            margin-top: 6px;
            z-index: 3;
            align-self: flex-end;
            background: rgba(0, 122, 255, 0.92);
            color: #fff;
            border: none;
            outline: none;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 500;
            cursor: default;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            transition: transform 0.15s ease, background-color 0.15s ease, opacity 0.15s ease;
            opacity: 0.95;
        }

        .jump-to-latest:hover {
            background: rgba(0, 122, 255, 1);
            transform: translateY(-1px);
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
            color: rgba(255, 255, 255, 0.35);
            padding: 3px 2px 0 2px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        .stt-message {
            padding: 3px 8px;
            border-radius: 6px;
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.4;
            font-size: 12px;
            margin-bottom: 1px;
            box-sizing: border-box;
        }

        .message-text {
            white-space: pre-wrap;
            user-select: text !important;
            cursor: default !important;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            line-height: 1.3;
        }

        .message-text.hidden-original {
            display: none;
        }

        .message-text.fallback-visible {
            color: rgba(255, 255, 255, 0.85);
            font-size: 12px;
        }

        .clear-btn {
            background: transparent;
            color: rgba(255, 255, 255, 0.5);
            border: none;
            outline: none;
            padding: 4px;
            border-radius: 4px;
            cursor: default;
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
            background: rgba(255, 255, 255, 0.04);
            color: rgba(255, 255, 255, 0.9);
        }

        .stt-message.me {
            background: rgba(0, 122, 255, 0.10);
            color: white;
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

        .toolbar-toggle {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: default;
            user-select: none;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
            padding: 3px 6px;
            border-radius: 6px;
            transition: background-color 0.15s ease;
            white-space: nowrap;
        }

        .toolbar-toggle:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .toolbar-toggle.active {
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
            margin-top: 2px;
            font-size: 14px;
            color: #fff;
            opacity: 1;
            white-space: pre-wrap;
            line-height: 1.4;
            user-select: text !important;
            cursor: default !important;
        }

        .translating-dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            margin-left: 4px;
            vertical-align: middle;
            animation: pulseDot 1.2s infinite ease-in-out;
        }

        @keyframes pulseDot {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        .translate-error {
            margin-top: 2px;
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
            cursor: default;
            max-width: 90px;
        }

        .force-seconds-select {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 3px 6px;
            font-size: 10px;
            outline: none;
            cursor: default;
            max-width: 60px;
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
        autoScroll: { type: Boolean },
        forceTranslateSeconds: { type: Number },
        micInputEnabled: { type: Boolean },
        hideOriginal: { type: Boolean },
        contextMode: { type: String },
        customContext: { type: String },
        showJumpToLatest: { type: Boolean },
    };

    constructor() {
        super();
        this.sttMessages = [];
        this.isVisible = true;
        this.messageIdCounter = 0;
        this._shouldScrollAfterUpdate = false;
        this._isNearBottom = true;
        this._containerEl = null;

        this.handleSttUpdate = this.handleSttUpdate.bind(this);
        this.copyMessageText = this.copyMessageText.bind(this);
        this.translateMessage = this.translateMessage.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleSourceLanguageChange = this.handleSourceLanguageChange.bind(this);
        this.clearHistory = this.clearHistory.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this._onContainerScroll = this._onContainerScroll.bind(this);
        this.toggleAutoScroll = this.toggleAutoScroll.bind(this);
        this.handleForceTranslateSecondsChange = this.handleForceTranslateSecondsChange.bind(this);
        this.toggleMicInput = this.toggleMicInput.bind(this);
        this._forceTranslateTick = this._forceTranslateTick.bind(this);

        this.targetLanguage = 'ru';
        this.sourceLanguage = 'auto';
        this.autoTranslate = false;
        this.autoScroll = true;
        this.forceTranslateSeconds = 0;
        this.micInputEnabled = true;
        this.hideOriginal = false;
        this.contextMode = 'none';
        this.customContext = '';
        this.showJumpToLatest = false;
        this._pendingTranslations = new Set();
        this._translateQueue = [];
        this._activeTranslations = 0;
        this._maxConcurrentTranslations = 3;
        this._jumpVisibilityRaf = null;
        this._forceTranslateTimer = null;
        this._liveDebounceTimer = null;
        this._segmentedThemPrefix = '';
        this._partialTranslateState = new Map();
        this._streamRequestId = 0;
        this._streamChunkHandlers = new Map();
        this._handleStreamChunk = this._handleStreamChunk.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api) {
            window.api.sttView.onSttUpdate(this.handleSttUpdate);
            window.api.sttView.onTranslateStreamChunk(this._handleStreamChunk);
        }

        try {
            const saved = localStorage.getItem('sttTargetLanguage');
            if (saved) {
                this.targetLanguage = saved;
                window.api?.sttView?.setSummaryLanguage?.(saved);
            }
            const savedAuto = localStorage.getItem('sttAutoTranslate');
            if (savedAuto !== null) this.autoTranslate = savedAuto === 'true';
            const savedAutoScroll = localStorage.getItem('sttAutoScroll');
            if (savedAutoScroll !== null) this.autoScroll = savedAutoScroll === 'true';
            const savedForceSeconds = Number(localStorage.getItem('sttForceTranslateSeconds'));
            if (Number.isFinite(savedForceSeconds) && savedForceSeconds >= 0) {
                this.forceTranslateSeconds = savedForceSeconds;
            }
            const savedMicInputEnabled = localStorage.getItem('sttMicInputEnabled');
            if (savedMicInputEnabled !== null) this.micInputEnabled = savedMicInputEnabled === 'true';
            const savedHideOriginal = localStorage.getItem('sttHideOriginal');
            if (savedHideOriginal !== null) this.hideOriginal = savedHideOriginal === 'true';
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

        this.updateComplete.then(() => {
            this._attachContainerScrollListener();
            this._syncMicInputState();
        });
        this._startForceTranslateTimer();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._jumpVisibilityRaf) {
            cancelAnimationFrame(this._jumpVisibilityRaf);
            this._jumpVisibilityRaf = null;
        }
        this._stopForceTranslateTimer();
        this._detachContainerScrollListener();
        if (window.api) {
            window.api.sttView.removeOnSttUpdate(this.handleSttUpdate);
            window.api.sttView.removeOnTranslateStreamChunk(this._handleStreamChunk);
        }
    }

    resetTranscript() {
        this.sttMessages = [];
        this._pendingTranslations.clear();
        this._translateQueue = [];
        this._activeTranslations = 0;
        this._resetForceTranslateSessionState();
        this._isNearBottom = true;
        this.showJumpToLatest = false;
        this.requestUpdate();
    }

    _emitMessagesUpdated() {
        this.dispatchEvent(new CustomEvent('stt-messages-updated', {
            detail: { messages: this.sttMessages },
            bubbles: true
        }));
    }

    _findLastPartialIdxBySpeaker(speaker) {
        for (let i = this.sttMessages.length - 1; i >= 0; i--) {
            const m = this.sttMessages[i];
            if (m.speaker === speaker && m.isPartial) return i;
        }
        return -1;
    }

    _isThemSpeaker(speaker) {
        return String(speaker || '').toLowerCase() === 'them';
    }

    _appendContext(existingText, newText) {
        const next = (newText || '').trim();
        if (!next) return (existingText || '').trim();
        if (!existingText) return next;
        return `${existingText} ${next}`.trim();
    }

    _stripForcedPrefix(text, alreadyEmittedText) {
        const source = (text || '').trim();
        const emitted = (alreadyEmittedText || '').trim();
        if (!source || !emitted) return source;

        if (source.startsWith(emitted)) {
            return source.slice(emitted.length).trimStart();
        }

        const maxOverlap = Math.min(source.length, emitted.length);
        for (let overlap = maxOverlap; overlap > 0; overlap--) {
            if (emitted.slice(-overlap) === source.slice(0, overlap)) {
                return source.slice(overlap).trimStart();
            }
        }

        return source;
    }

    _resetForceTranslateSessionState() {
        this._segmentedThemPrefix = '';
        this._partialTranslateState.clear();
    }

    _isForceTranslateActive() {
        return this.forceTranslateSeconds > 0;
    }

    _getForceTranslateIntervalMs() {
        return Math.max(1000, this.forceTranslateSeconds * 1000);
    }

    _getThemTranslationContext(maxChars = 900) {
        const context = this.sttMessages
            .filter(msg => this._isThemSpeaker(msg.speaker) && msg.isFinal && msg.text?.trim())
            .map(msg => msg.text.trim())
            .join(' ')
            .trim();

        if (!context) return '';
        if (context.length <= maxChars) return context;
        return context.slice(-maxChars).trimStart();
    }

    _findAdaptiveSplitIndex(text) {
        const source = (text || '').trim();
        if (!source) return -1;

        const minChars = 42;
        if (source.length < minChars) return -1;

        let splitAt = -1;
        const sentenceRe = /[.!?…]+(?:["'”’)\]]+)?\s+/g;
        let match;
        while ((match = sentenceRe.exec(source)) !== null) {
            const candidate = match.index + match[0].length;
            if (candidate >= minChars) splitAt = candidate;
        }
        if (splitAt !== -1) return splitAt;

        const clauseRe = /[,;:]\s+/g;
        while ((match = clauseRe.exec(source)) !== null) {
            const candidate = match.index + match[0].length;
            if (candidate >= minChars + 14) splitAt = candidate;
        }
        if (splitAt !== -1) return splitAt;

        if (source.length < minChars * 2) return -1;

        const target = Math.floor(source.length * 0.72);
        const from = Math.max(minChars, target - 40);
        const to = Math.min(source.length - 1, target + 80);

        for (let i = to; i >= from; i--) {
            if (/\s/.test(source[i])) return i + 1;
        }
        return -1;
    }

    _maybeSegmentThemPartial() {
        if (!this._isForceTranslateActive()) return false;

        const partialIdx = this._findLastPartialIdxBySpeaker('Them');
        if (partialIdx === -1) return false;

        const partialMsg = this.sttMessages[partialIdx];
        const text = (partialMsg?.text || '').trim();
        if (!text) return false;

        const startedAt = partialMsg.partialStartedAt || Date.now();
        if (Date.now() - startedAt < this._getForceTranslateIntervalMs()) return false;

        const splitAt = this._findAdaptiveSplitIndex(text);
        if (splitAt <= 0) return false;

        const segmentText = text.slice(0, splitAt).trim();
        const remainderText = text.slice(splitAt).trimStart();
        if (!segmentText) return false;

        const contextBefore = this._getThemTranslationContext();
        const newMessages = [...this.sttMessages];
        const finalizedMsg = {
            ...partialMsg,
            text: segmentText,
            translatedText: null,
            isPartial: false,
            isFinal: true,
            partialStartedAt: null,
            isForcedSegment: true,
        };

        newMessages[partialIdx] = finalizedMsg;
        this._partialTranslateState.delete(finalizedMsg.id);

        if (remainderText) {
            newMessages.splice(partialIdx + 1, 0, {
                id: this.messageIdCounter++,
                speaker: partialMsg.speaker,
                text: remainderText,
                isPartial: true,
                isFinal: false,
                partialStartedAt: Date.now(),
            });
        }

        this._markShouldScrollAfterUpdate();
        this.sttMessages = newMessages;
        this._segmentedThemPrefix = this._appendContext(this._segmentedThemPrefix, segmentText);

        const shouldTranslate = this.autoTranslate || this._isForceTranslateActive();
        if (shouldTranslate && !this._pendingTranslations.has(finalizedMsg.id)) {
            this._triggerAutoTranslate(finalizedMsg, { contextBefore });
        }
        this._emitMessagesUpdated();
        return true;
    }

    async _maybeTranslateThemPartial() {
        if (!this._isForceTranslateActive() || !window.api?.sttView?.translateText) return;

        const partialIdx = this._findLastPartialIdxBySpeaker('Them');
        if (partialIdx === -1) return;

        const partialMsg = this.sttMessages[partialIdx];
        const text = partialMsg?.text?.trim();
        if (!text) return;

        let state = this._partialTranslateState.get(partialMsg.id);
        if (!state) {
            state = { inFlight: false, lastAt: 0, lastText: '', startedAt: 0 };
            this._partialTranslateState.set(partialMsg.id, state);
        }

        const now = Date.now();
        const intervalMs = this._getForceTranslateIntervalMs();

        // Recover from stuck inFlight (e.g. hung API call) after 15s
        if (state.inFlight && state.startedAt && now - state.startedAt > 15_000) {
            console.warn('[SttView] Force-resetting stuck inFlight for msg', partialMsg.id);
            state.inFlight = false;
        }

        if (state.inFlight) return;
        if (state.lastText === text && now - state.lastAt < intervalMs) return;
        if (now - state.lastAt < intervalMs) return;

        state.inFlight = true;
        state.lastAt = now;
        state.lastText = text;
        state.startedAt = now;

        // Show loading indicator if no translation exists yet
        if (!partialMsg.translatedText) {
            this._updateMessageField(partialMsg.id, 'isTranslating', true);
        }

        const contextBefore = this._getThemTranslationContext();
        const useStreaming = !!window.api?.sttView?.translateStream;
        const requestId = useStreaming ? ++this._streamRequestId : null;
        try {
            if (useStreaming) {
                this._streamChunkHandlers.set(requestId, (chunk) => {
                    const latest = this.sttMessages.find(msg => msg.id === partialMsg.id);
                    if (!latest || !latest.isPartial) return;
                    const current = latest.translatedText || '';
                    this._updateMessageField(partialMsg.id, 'translatedText', current + chunk);
                });

                const streamPromise = window.api.sttView.translateStream(requestId, text, this.targetLanguage, contextBefore);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Translation timeout')), 12_000)
                );
                const result = await Promise.race([streamPromise, timeoutPromise]);
                this._streamChunkHandlers.delete(requestId);

                if (result?.success && result.translatedText) {
                    const latest = this.sttMessages.find(msg => msg.id === partialMsg.id);
                    if (latest && latest.isPartial) {
                        this._updateMessageField(partialMsg.id, 'translatedText', result.translatedText);
                    }
                }
            } else {
                const translationPromise = window.api.sttView.translateText(text, this.targetLanguage, contextBefore);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Translation timeout')), 12_000)
                );
                const result = await Promise.race([translationPromise, timeoutPromise]);

                if (!result?.success || !result.translatedText) {
                    console.warn('[SttView] Partial translation returned no result for msg', partialMsg.id);
                    return;
                }

                const latest = this.sttMessages.find(msg => msg.id === partialMsg.id);
                if (!latest || !latest.isPartial) return;
                if (latest.translatedText === result.translatedText) return;

                this._updateMessageField(partialMsg.id, 'translatedText', result.translatedText);
            }
        } catch (err) {
            if (requestId) this._streamChunkHandlers.delete(requestId);
            console.warn('[SttView] Live partial translation failed:', err.message || err);
        } finally {
            const latest = this.sttMessages.find(msg => msg.id === partialMsg.id);
            if (!latest) {
                this._partialTranslateState.delete(partialMsg.id);
            } else {
                state.inFlight = false;
                state.startedAt = 0;
                this._updateMessageField(partialMsg.id, 'isTranslating', false);
            }
        }
    }

    _startForceTranslateTimer() {
        if (this._forceTranslateTimer) return;
        this._forceTranslateTimer = setInterval(this._forceTranslateTick, 1000);
    }

    _stopForceTranslateTimer() {
        if (!this._forceTranslateTimer) return;
        clearInterval(this._forceTranslateTimer);
        this._forceTranslateTimer = null;
    }

    _forceTranslateTick() {
        if (!this._isForceTranslateActive()) return;

        const didSegment = this._maybeSegmentThemPartial();
        if (!didSegment) {
            this._maybeTranslateThemPartial();
        }
    }

    _markShouldScrollAfterUpdate() {
        const container = this.shadowRoot?.querySelector('.transcription-container');
        this._shouldScrollAfterUpdate = container ? (this.autoScroll && this._isNearBottom) : this.autoScroll;
    }

    handleSttUpdate(event, { speaker, text, isFinal, isPartial }) {
        if (text === undefined) return;

        this._markShouldScrollAfterUpdate();

        const newMessages = [...this.sttMessages];
        const targetIdx = this._findLastPartialIdxBySpeaker(speaker);
        const isThem = this._isThemSpeaker(speaker);
        const forceActiveForSpeaker = this._isForceTranslateActive() && isThem;

        let nextText = (typeof text === 'string' ? text : String(text || '')).trim();
        if (forceActiveForSpeaker && (isPartial || isFinal)) {
            nextText = this._stripForcedPrefix(nextText, this._segmentedThemPrefix);
        }

        if (isPartial) {
            if (!nextText) {
                if (targetIdx !== -1) {
                    this._partialTranslateState.delete(newMessages[targetIdx].id);
                    newMessages.splice(targetIdx, 1);
                    this.sttMessages = newMessages;
                    this._emitMessagesUpdated();
                }
                return;
            }

            if (targetIdx !== -1) {
                const existing = newMessages[targetIdx];
                newMessages[targetIdx] = {
                    ...existing,
                    text: nextText,
                    isPartial: true,
                    isFinal: false,
                    partialStartedAt: existing.partialStartedAt || Date.now(),
                };
            } else {
                newMessages.push({
                    id: this.messageIdCounter++,
                    speaker,
                    text: nextText,
                    isPartial: true,
                    isFinal: false,
                    partialStartedAt: Date.now(),
                });
            }

            this.sttMessages = newMessages;
            this._emitMessagesUpdated();

            if (forceActiveForSpeaker) {
                this._maybeTranslateThemPartial();
            }
            return;
        }

        if (!isFinal) return;

        if (!nextText) {
            if (targetIdx !== -1) {
                this._partialTranslateState.delete(newMessages[targetIdx].id);
                newMessages.splice(targetIdx, 1);
                this.sttMessages = newMessages;
                this._emitMessagesUpdated();
            }
            if (isThem) this._resetForceTranslateSessionState();
            return;
        }

        const contextBefore = forceActiveForSpeaker ? this._getThemTranslationContext() : '';

        let finalMsg;
        if (targetIdx !== -1) {
            const existing = newMessages[targetIdx];
            newMessages[targetIdx] = {
                ...existing,
                text: nextText,
                translatedText: existing.translatedText ? null : existing.translatedText,
                isPartial: false,
                isFinal: true,
                partialStartedAt: null,
            };
            this._partialTranslateState.delete(existing.id);
            finalMsg = newMessages[targetIdx];
        } else {
            finalMsg = {
                id: this.messageIdCounter++,
                speaker,
                text: nextText,
                isPartial: false,
                isFinal: true,
                partialStartedAt: null,
            };
            newMessages.push(finalMsg);
        }

        this.sttMessages = newMessages;

        const shouldTranslate = this.autoTranslate || forceActiveForSpeaker;
        if (shouldTranslate && !this._pendingTranslations.has(finalMsg.id)) {
            this._triggerAutoTranslate(finalMsg, { contextBefore });
        }

        if (isThem) {
            this._resetForceTranslateSessionState();
        }
        this._emitMessagesUpdated();
    }

    scrollToBottom() {
        this.updateComplete.then(() => {
            const container = this.shadowRoot.querySelector('.transcription-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
                this._isNearBottom = true;
                this.showJumpToLatest = false;
            }
        });
    }

    _attachContainerScrollListener() {
        const container = this.shadowRoot?.querySelector('.transcription-container');
        if (!container || this._containerEl === container) return;
        this._detachContainerScrollListener();
        this._containerEl = container;
        container.addEventListener('scroll', this._onContainerScroll, { passive: true });
    }

    _detachContainerScrollListener() {
        if (!this._containerEl) return;
        this._containerEl.removeEventListener('scroll', this._onContainerScroll);
        this._containerEl = null;
    }

    _onContainerScroll() {
        const container = this._containerEl;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
        this._isNearBottom = distanceFromBottom <= 8;
        const shouldShow = !this._isNearBottom && this.sttMessages.length > 0;
        if (this.showJumpToLatest !== shouldShow) {
            this.showJumpToLatest = shouldShow;
        }
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
        window.api?.sttView?.setSummaryLanguage?.(value);
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
        this._activeTranslations = 0;
        this._resetForceTranslateSessionState();
        this._isNearBottom = true;
        this.showJumpToLatest = false;
        this.requestUpdate();
        this._emitMessagesUpdated();
    }

    toggleAutoTranslate() {
        this.autoTranslate = !this.autoTranslate;
        try { localStorage.setItem('sttAutoTranslate', String(this.autoTranslate)); } catch {}
        this.requestUpdate();
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        try { localStorage.setItem('sttAutoScroll', String(this.autoScroll)); } catch {}
        if (this.autoScroll) {
            this.scrollToBottom();
        } else {
            this.requestUpdate();
        }
    }

    handleForceTranslateSecondsChange(event) {
        const value = Number(event?.target?.value || 0);
        this.forceTranslateSeconds = Number.isFinite(value) && value >= 0 ? value : 0;
        this._resetForceTranslateSessionState();

        try {
            localStorage.setItem('sttForceTranslateSeconds', String(this.forceTranslateSeconds));
        } catch {}
        this.requestUpdate();
    }

    toggleMicInput() {
        this.micInputEnabled = !this.micInputEnabled;
        try { localStorage.setItem('sttMicInputEnabled', String(this.micInputEnabled)); } catch {}
        this._syncMicInputState();
        this.requestUpdate();
    }

    toggleHideOriginal() {
        this.hideOriginal = !this.hideOriginal;
        try { localStorage.setItem('sttHideOriginal', String(this.hideOriginal)); } catch {}
        this.requestUpdate();
    }

    _syncMicInputState() {
        try {
            window.pickleGlass?.setMicInputEnabled?.(this.micInputEnabled);
        } catch (err) {
            console.warn('[SttView] Failed to sync mic input state:', err);
        }
    }

    _triggerAutoTranslate(msg, { contextBefore = '' } = {}) {
        if (!msg.text?.trim() || !window.api?.sttView?.translateText) return;
        if (this._pendingTranslations.has(msg.id)) return;

        // Drop stale queued translations to prevent backlog during fast segmentation
        if (this._translateQueue.length > 2) {
            const dropped = this._translateQueue.splice(0, this._translateQueue.length - 2);
            for (const stale of dropped) {
                this._pendingTranslations.delete(stale.msgId);
                this._updateMessageField(stale.msgId, 'isTranslating', false);
                this._updateMessageField(stale.msgId, 'translateError', null);
            }
        }

        this._pendingTranslations.add(msg.id);
        this._updateMessageField(msg.id, 'isTranslating', true);
        this._updateMessageField(msg.id, 'translateError', null);

        const task = {
            msgId: msg.id,
            text: msg.text,
            contextBefore,
        };

        if (this._activeTranslations < this._maxConcurrentTranslations) {
            this._runTranslation(task);
        } else {
            this._translateQueue.push(task);
        }
    }

    _handleStreamChunk(_event, { requestId, chunk }) {
        const handler = this._streamChunkHandlers.get(requestId);
        if (handler) handler(chunk);
    }

    async _runTranslation(task) {
        this._activeTranslations++;
        const requestId = ++this._streamRequestId;
        const useStreaming = !!window.api?.sttView?.translateStream;

        try {
            if (useStreaming) {
                let accumulated = '';
                this._streamChunkHandlers.set(requestId, (chunk) => {
                    accumulated += chunk;
                    this._updateMessageField(task.msgId, 'translatedText', accumulated);
                });

                const streamPromise = window.api.sttView.translateStream(requestId, task.text, this.targetLanguage, task.contextBefore);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Translation timeout')), 15_000)
                );
                const result = await Promise.race([streamPromise, timeoutPromise]);
                this._streamChunkHandlers.delete(requestId);

                if (result?.success && result.translatedText) {
                    this._updateMessageField(task.msgId, 'translatedText', result.translatedText);
                } else if (!accumulated) {
                    this._updateMessageField(task.msgId, 'translateError', result?.error || 'Failed');
                    setTimeout(() => this._updateMessageField(task.msgId, 'translateError', null), 3500);
                }
            } else {
                const translationPromise = window.api.sttView.translateText(task.text, this.targetLanguage, task.contextBefore);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Translation timeout')), 15_000)
                );
                const result = await Promise.race([translationPromise, timeoutPromise]);
                if (result?.success && result.translatedText) {
                    this._updateMessageField(task.msgId, 'translatedText', result.translatedText);
                } else {
                    this._updateMessageField(task.msgId, 'translateError', result?.error || 'Failed');
                    setTimeout(() => this._updateMessageField(task.msgId, 'translateError', null), 3500);
                }
            }
        } catch (err) {
            this._streamChunkHandlers.delete(requestId);
            console.error('[SttView] Auto-translate failed:', err);
            this._updateMessageField(task.msgId, 'translateError', 'Translation failed');
            setTimeout(() => this._updateMessageField(task.msgId, 'translateError', null), 3500);
        } finally {
            this._pendingTranslations.delete(task.msgId);
            this._updateMessageField(task.msgId, 'isTranslating', false);
            this._activeTranslations--;
            if (this._translateQueue.length > 0) {
                this._runTranslation(this._translateQueue.shift());
            }
        }
    }

    _updateMessageField(msgId, field, value) {
        const idx = this.sttMessages.findIndex(m => m.id === msgId);
        if (idx === -1) return;
        this._markShouldScrollAfterUpdate();
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
        window.api?.questionsView?.setContext?.(this.contextMode, this.customContext);
        this.requestUpdate();
    }

    handleCustomContextInput(event) {
        this.customContext = event?.target?.value || '';
        try { localStorage.setItem('sttCustomContext', this.customContext); } catch {}
        window.api?.questionsView?.setContext?.(this.contextMode, this.customContext);
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
        this._attachContainerScrollListener();

        if (changedProperties.has('sttMessages')) {
            if (this._shouldScrollAfterUpdate) {
                this.scrollToBottom();
                this._shouldScrollAfterUpdate = false;
            }
            if (this._jumpVisibilityRaf) cancelAnimationFrame(this._jumpVisibilityRaf);
            this._jumpVisibilityRaf = requestAnimationFrame(() => {
                this._jumpVisibilityRaf = null;
                this._onContainerScroll();
            });
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

    _forceSecondsOptions() {
        return html`
            <option value="0">Off</option>
            <option value="3">3s</option>
            <option value="5">5s</option>
            <option value="7">7s</option>
            <option value="10">10s</option>
            <option value="13">13s</option>
            <option value="15">15s</option>
            <option value="17">17s</option>
            <option value="20">20s</option>
            <option value="25">25s</option>
            <option value="30">30s</option>
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
                    <div class="toolbar-toggle ${this.autoScroll ? 'active' : ''}"
                         title="Auto-scroll to the latest message"
                         @click=${this.toggleAutoScroll}>
                        <div class="toggle-track ${this.autoScroll ? 'active' : ''}">
                            <div class="toggle-thumb"></div>
                        </div>
                        <span>Scroll</span>
                    </div>
                    <div class="toolbar-toggle ${this.autoTranslate ? 'active' : ''}"
                         title="Automatically translate transcription"
                         @click=${this.toggleAutoTranslate}>
                        <div class="toggle-track ${this.autoTranslate ? 'active' : ''}">
                            <div class="toggle-thumb"></div>
                        </div>
                        <span>Translate</span>
                    </div>
                    <select class="force-seconds-select" title="Live translate cadence"
                            @change=${this.handleForceTranslateSecondsChange}
                            .value=${String(this.forceTranslateSeconds)}>
                        ${this._forceSecondsOptions()}
                    </select>
                    <div class="toolbar-toggle ${this.hideOriginal ? 'active' : ''}"
                         title="Hide original text, show only translation"
                         @click=${() => this.toggleHideOriginal()}>
                        <div class="toggle-track ${this.hideOriginal ? 'active' : ''}">
                            <div class="toggle-thumb"></div>
                        </div>
                        <span>Hide Orig</span>
                    </div>
                    <div class="toolbar-toggle ${this.micInputEnabled ? 'active' : ''}"
                         title="Enable or disable your microphone input"
                         @click=${this.toggleMicInput}>
                        <div class="toggle-track ${this.micInputEnabled ? 'active' : ''}">
                            <div class="toggle-thumb"></div>
                        </div>
                        <span>Mic</span>
                    </div>
                    <button class="clear-btn" title="Clear transcript" @click=${this.clearHistory}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
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
                    : this.sttMessages.map((msg, idx) => {
                        const hasTranslation = !!msg.translatedText;
                        const shouldHideOrig = this.hideOriginal && hasTranslation;
                        const showOrigAsFallback = this.hideOriginal && !hasTranslation && !msg.isTranslating;
                        return html`
                            ${this._isSpeakerChange(idx) ? html`
                                <div class="speaker-label">
                                    ${msg.speaker.toLowerCase() === 'me' ? 'You' : 'Speaker'}
                                </div>
                            ` : ''}
                            <div class="stt-message ${this.getSpeakerClass(msg.speaker)}">
                                <div class="message-text ${shouldHideOrig ? 'hidden-original' : ''} ${showOrigAsFallback ? 'fallback-visible' : ''}">${msg.text}</div>
                                ${hasTranslation ? html`
                                    <div class="translated-text">${msg.translatedText}${msg.isTranslating && msg.isPartial ? html`<span class="translating-dot"></span>` : ''}</div>
                                ` : msg.isTranslating ? html`
                                    <div class="translated-text"><span class="translating-dot"></span></div>
                                ` : msg.translateError ? html`
                                    <div class="translate-error">${msg.translateError}</div>
                                ` : ''}
                            </div>
                        `;
                    })
                }
                ${this.showJumpToLatest ? html`
                    <button class="jump-to-latest" @click=${this.scrollToBottom} title="Jump to latest">
                        Jump to latest
                    </button>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('stt-view', SttView);
