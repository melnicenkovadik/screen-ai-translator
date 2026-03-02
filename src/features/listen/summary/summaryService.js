const { createStreamingLLM } = require('../../common/ai/factory');
const sessionRepository = require('../../common/repositories/session');
const summaryRepository = require('./repositories');
const modelStateService = require('../../common/services/modelStateService');

const SUMMARY_INTERVAL_MS = 30_000;

const SYSTEM_PROMPT = `You are a live meeting-notes assistant. You receive the full conversation transcript so far and the previous summary (if any). Your job is to produce an updated, concise summary that captures:
- What is being discussed (topics, decisions, questions)
- Who said what (use speaker labels like "me" / "them" when clear)
- Any action items or conclusions

Rules:
- Output ONLY the updated summary text — no labels like "Summary:", no markdown headers, no bullet prefixes
- Write in plain flowing paragraphs; keep it compact but informative
- If the previous summary is still accurate and no new meaningful content appeared, return it unchanged
- Expand, edit, or refine the summary as the conversation evolves — treat it like living meeting notes
- Write in the language specified by the user (defaults to the conversation language if not specified)`;

class SummaryService {
    constructor() {
        this.conversationHistory = [];
        this.currentSessionId = null;
        this._previousSummary = '';
        this._lastSummarizedTurnCount = 0;
        this._autoSummaryTimer = null;
        this._isUpdating = false;

        // Cached streaming LLM
        this._cachedStreamingLLM = null;
        this._cachedModelKey = null;

        this._summaryLanguage = 'en';

        // Callbacks
        this.onAnalysisComplete = null;
        this.onStatusUpdate = null;
    }

    setCallbacks({ onAnalysisComplete, onStatusUpdate }) {
        this.onAnalysisComplete = onAnalysisComplete;
        this.onStatusUpdate = onStatusUpdate;
    }

    setSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }

    setSummaryLanguage(lang) {
        this._summaryLanguage = lang || 'en';
    }

    sendToRenderer(channel, data) {
        const { windowPool } = require('../../../window/windowManager');
        const listenWindow = windowPool?.get('listen');
        if (listenWindow && !listenWindow.isDestroyed()) {
            listenWindow.webContents.send(channel, data);
        }
    }

    addConversationTurn(speaker, text) {
        const conversationText = `${speaker.toLowerCase()}: ${text.trim()}`;
        this.conversationHistory.push(conversationText);
        console.log(`[SummaryService] Turn added (${this.conversationHistory.length} total)`);
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    resetConversationHistory() {
        this.conversationHistory = [];
        this._previousSummary = '';
        this._lastSummarizedTurnCount = 0;
        this._isUpdating = false;
    }

    // ── Auto-summary timer ──────────────────────────

    startAutoSummary() {
        this.stopAutoSummary();
        console.log(`[SummaryService] Auto-summary started (every ${SUMMARY_INTERVAL_MS / 1000}s)`);
        this._autoSummaryTimer = setInterval(() => this._tick(), SUMMARY_INTERVAL_MS);
    }

    stopAutoSummary() {
        if (this._autoSummaryTimer) {
            clearInterval(this._autoSummaryTimer);
            this._autoSummaryTimer = null;
            console.log('[SummaryService] Auto-summary stopped');
        }
    }

    async _tick() {
        if (this._isUpdating) return;
        if (this.conversationHistory.length === 0) return;
        if (this.conversationHistory.length === this._lastSummarizedTurnCount) return;

        try {
            this._isUpdating = true;
            this.sendToRenderer('summary-stream-start', {});
            await this._generateStreamingSummary();
        } catch (err) {
            console.error('[SummaryService] Summary update failed:', err.message);
        } finally {
            this._isUpdating = false;
        }
    }

    // ── Streaming LLM ───────────────────────────────

    _getStreamingLLM(modelInfo) {
        const key = `${modelInfo.provider}:${modelInfo.model}:${modelInfo.apiKey}`;
        if (key !== this._cachedModelKey) {
            this._cachedStreamingLLM = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.5,
                maxTokens: 1024,
            });
            this._cachedModelKey = key;
        }
        return this._cachedStreamingLLM;
    }

    // ── Core summary generation ─────────────────────

    async _generateStreamingSummary() {
        const modelInfo = await modelStateService.getCurrentModelInfo('llm');
        if (!modelInfo || !modelInfo.apiKey) {
            console.warn('[SummaryService] No AI model configured, skipping summary');
            return;
        }

        const transcript = this.conversationHistory.join('\n');
        const turnCount = this.conversationHistory.length;

        const LANG_MAP = { ru: 'Russian', en: 'English', uk: 'Ukrainian', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', tr: 'Turkish', pl: 'Polish', ar: 'Arabic', hi: 'Hindi' };
        const langName = LANG_MAP[this._summaryLanguage] || this._summaryLanguage || 'English';
        const langInstruction = `Write the summary in ${langName}.\n\n`;

        const userContent = this._previousSummary
            ? `${langInstruction}Previous summary:\n${this._previousSummary}\n\nFull conversation transcript:\n${transcript}`
            : `${langInstruction}Full conversation transcript:\n${transcript}`;

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
        ];

        if (this.currentSessionId) {
            try { await sessionRepository.touch(this.currentSessionId); } catch {}
        }

        const streamingLLM = this._getStreamingLLM(modelInfo);
        const response = await streamingLLM.streamChat(messages);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim() !== '');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.substring(6);
                if (data === '[DONE]') break;
                try {
                    const json = JSON.parse(data);
                    const token = json.choices?.[0]?.delta?.content || '';
                    if (token) {
                        fullText += token;
                        this.sendToRenderer('summary-stream-chunk', { chunk: token });
                    }
                } catch {}
            }
        }

        fullText = fullText.trim();
        if (fullText) {
            this._previousSummary = fullText;
            this._lastSummarizedTurnCount = turnCount;

            this.sendToRenderer('summary-stream-done', { text: fullText });

            // Persist to DB
            if (this.currentSessionId) {
                try {
                    summaryRepository.saveSummary({
                        sessionId: this.currentSessionId,
                        text: fullText,
                        tldr: fullText.substring(0, 200),
                        bullet_json: '[]',
                        action_json: '[]',
                        model: modelInfo.model,
                    });
                } catch (err) {
                    console.error('[SummaryService] Failed to save summary:', err);
                }
            }

            if (this.onAnalysisComplete) {
                this.onAnalysisComplete({ summary: fullText });
            }
        }
    }

    getCurrentAnalysisData() {
        return {
            previousSummary: this._previousSummary,
            conversationLength: this.conversationHistory.length,
        };
    }
}

module.exports = SummaryService;
