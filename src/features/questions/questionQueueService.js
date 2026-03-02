const { createStreamingLLM } = require('../common/ai/factory');
const modelStateService = require('../common/services/modelStateService');

const CONTEXT_PRESETS = {
    'none': '',
    'interview': 'You are a frontend developer in a technical interview. The interviewer speaks English. Give concise, professional answers demonstrating expertise.',
    'standup': 'You are a frontend developer in a daily standup meeting with your team. Keep answers brief and status-focused.',
    'meeting': 'You are in a professional business meeting. Be clear and concise.',
};

const LANG_MAP = {
    ru: 'Russian', en: 'English', uk: 'Ukrainian',
    de: 'German', fr: 'French', es: 'Spanish',
    it: 'Italian', pt: 'Portuguese', zh: 'Chinese',
    ja: 'Japanese', ko: 'Korean', tr: 'Turkish',
    pl: 'Polish', ar: 'Arabic', hi: 'Hindi',
};

const QUESTION_STARTERS = /^(what|how|why|can|could|would|should|do|does|did|is|are|was|were|will|shall|tell me|explain|describe|have you|has |who|where|when|which)/i;

class QuestionQueueService {
    constructor() {
        this._queue = [];
        this._isActive = false;
        this._idCounter = 0;
        this._isRefreshing = false;
        this._answerLanguage = 'en';
        this._contextMode = 'none';
        this._customContext = '';
        this._cachedStreamingLLM = null;
        this._cachedModelKey = null;
    }

    // ── Public API ──────────────────────────────────

    toggle() {
        this._isActive = !this._isActive;
        if (this._isActive) {
            this._queue = [];
            this._idCounter = 0;
        }
        this._broadcastState();
        return { isActive: this._isActive };
    }

    clearQueue() {
        this._queue = [];
        this._idCounter = 0;
        this._isActive = false;
        this._broadcastState();
    }

    addTranscription(speaker, text, conversationHistory) {
        if (!this._isActive || speaker !== 'Them') return;
        if (!this._isQuestion(text)) return;

        const contextSlice = (conversationHistory || []).slice(-6);

        const item = {
            id: ++this._idCounter,
            rawText: text.trim(),
            refinedText: null,
            context: contextSlice,
            status: 'idle',
            error: null,
        };

        this._queue.push(item);
        console.log(`[QuestionQueue] Added question #${item.id}: "${text.substring(0, 60)}..."`);
        this._broadcastState();
    }

    async refreshQueue() {
        if (this._isRefreshing || this._queue.length === 0) return;
        this._isRefreshing = true;
        this._broadcastState();

        try {
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo?.apiKey) throw new Error('AI model or API key not configured.');

            const rawTexts = this._queue.map(q => q.refinedText || q.rawText);

            const systemPrompt = `You are a question deduplication and normalization assistant.
You receive a JSON array of raw question strings extracted from speech transcription.
Return a JSON array of the same length. Each entry should be either:
- A cleaned, concise version of the question (fix grammar, remove filler words, normalize phrasing)
- null if the entry is a duplicate of another question or is not actually a question

Output ONLY a valid JSON array, no explanation or markdown.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(rawTexts) },
            ];

            const streamingLLM = this._getStreamingLLM(modelInfo);
            const response = await streamingLLM.streamChat(messages);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                for (const line of chunk.split('\n').filter(l => l.trim())) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') break;
                        try {
                            const json = JSON.parse(data);
                            const token = json.choices?.[0]?.delta?.content || '';
                            fullResponse += token;
                        } catch {}
                    }
                }
            }

            const cleaned = JSON.parse(fullResponse.trim());
            if (!Array.isArray(cleaned) || cleaned.length !== this._queue.length) {
                throw new Error('LLM returned invalid array length');
            }

            const newQueue = [];
            for (let i = 0; i < this._queue.length; i++) {
                if (cleaned[i] !== null) {
                    this._queue[i].refinedText = cleaned[i];
                    this._queue[i].status = 'idle';
                    this._queue[i].error = null;
                    newQueue.push(this._queue[i]);
                }
            }
            this._queue = newQueue;
            console.log(`[QuestionQueue] Refreshed: ${newQueue.length} questions remain`);
        } catch (err) {
            console.error('[QuestionQueue] Refresh failed:', err);
        } finally {
            this._isRefreshing = false;
            this._broadcastState();
        }
    }

    async answerQuestion(id) {
        const item = this._queue.find(q => q.id === id);
        if (!item) return { success: false, error: 'Question not found' };

        item.status = 'answering';
        item.error = null;
        this._broadcastState();

        try {
            const askService = require('../ask/askService');
            const questionText = item.refinedText || item.rawText;
            const contextText = this._getContextText();
            const contextLines = (item.context || []).join('\n');

            const langName = LANG_MAP[this._answerLanguage] || 'English';
            const prompt = [
                contextText ? contextText + '\n\n' : '',
                contextLines ? `Conversation context:\n${contextLines}\n\n` : '',
                `Answer this question concisely and professionally: "${questionText}"`,
                `\n\nAfter the answer, add a separator line "---" and provide a full translation of your answer into ${langName}.`,
            ].join('');

            const result = await askService.sendMessage(prompt, [], {
                skipScreenshot: true,
                responseLanguage: this._answerLanguage,
            });

            if (result.success) {
                this._queue = this._queue.filter(q => q.id !== id);
                console.log(`[QuestionQueue] Answered and removed question #${id}`);
            } else {
                item.status = 'error';
                item.error = result.error || 'Failed to send answer';
            }
        } catch (err) {
            item.status = 'error';
            item.error = err.message;
            console.error(`[QuestionQueue] Answer failed for #${id}:`, err);
        }

        this._broadcastState();
        return { success: true };
    }

    dismissQuestion(id) {
        this._queue = this._queue.filter(q => q.id !== id);
        this._broadcastState();
    }

    setContext(mode, customContext) {
        this._contextMode = mode || 'none';
        this._customContext = customContext || '';
    }

    setAnswerLanguage(lang) {
        this._answerLanguage = lang || 'en';
    }

    getState() {
        return {
            isActive: this._isActive,
            isRefreshing: this._isRefreshing,
            queue: this._queue.map(q => ({
                id: q.id,
                rawText: q.rawText,
                refinedText: q.refinedText,
                status: q.status,
                error: q.error,
            })),
        };
    }

    // ── Private ─────────────────────────────────────

    _isQuestion(text) {
        if (!text) return false;
        const trimmed = text.trim();
        if (trimmed.endsWith('?')) return true;
        return QUESTION_STARTERS.test(trimmed);
    }

    _getContextText() {
        if (this._contextMode === 'custom') return this._customContext || '';
        return CONTEXT_PRESETS[this._contextMode] || '';
    }

    _getStreamingLLM(modelInfo) {
        const key = `${modelInfo.provider}:${modelInfo.model}:${modelInfo.apiKey}`;
        if (this._cachedStreamingLLM && this._cachedModelKey === key) {
            return this._cachedStreamingLLM;
        }
        this._cachedStreamingLLM = createStreamingLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0.3,
            maxTokens: 2048,
        });
        this._cachedModelKey = key;
        return this._cachedStreamingLLM;
    }

    _broadcastState() {
        try {
            const { windowPool } = require('../../window/windowManager');
            const win = windowPool?.get('questions');
            if (win && !win.isDestroyed()) {
                win.webContents.send('questions:stateUpdate', this.getState());
            }
        } catch {}
    }
}

module.exports = new QuestionQueueService();
