const modelStateService = require('../common/services/modelStateService');
const { createLLM, createStreamingLLM } = require('../common/ai/factory');

const LANG_MAP = {
    'ru': 'Russian',
    'en': 'English',
    'uk': 'Ukrainian',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'tr': 'Turkish',
    'pl': 'Polish',
    'ar': 'Arabic',
    'hi': 'Hindi',
};

const SYSTEM_PROMPT = `You are a professional real-time translator for live speech transcription. Translate naturally and accurately while preserving the speaker's tone, intent, and register. Keep technical terms, proper nouns, and abbreviations intact when appropriate. Output ONLY the translation — no quotes, labels, commentary, or formatting.`;

let cachedLLM = null;
let cachedStreamingLLM = null;
let cachedModelKey = null;

const CACHE_MAX = 100;
const CACHE_TTL = 5 * 60 * 1000;
const translationCache = new Map();

function getCacheKey(text, targetLang) {
    return `${targetLang}:${text}`;
}

function getCached(text, targetLang) {
    const key = getCacheKey(text, targetLang);
    const entry = translationCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
        translationCache.delete(key);
        return null;
    }
    return entry.value;
}

function setCache(text, targetLang, translatedText) {
    if (translationCache.size >= CACHE_MAX) {
        const oldest = translationCache.keys().next().value;
        translationCache.delete(oldest);
    }
    translationCache.set(getCacheKey(text, targetLang), { value: translatedText, ts: Date.now() });
}

function getModelInfo() {
    return modelStateService.getCurrentModelInfo('llm');
}

function getLLM(modelInfo) {
    const key = `${modelInfo.provider}:${modelInfo.model}:${modelInfo.apiKey}`;
    if (key !== cachedModelKey) {
        const opts = {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0,
            maxTokens: 2048,
        };
        cachedLLM = createLLM(modelInfo.provider, opts);
        cachedStreamingLLM = createStreamingLLM(modelInfo.provider, opts);
        cachedModelKey = key;
    }
    return cachedLLM;
}

function getStreamingLLM(modelInfo) {
    getLLM(modelInfo); // ensures cache is populated
    return cachedStreamingLLM;
}

function buildMessages(text, targetLang, contextBefore) {
    const langName = LANG_MAP[targetLang] || targetLang;
    const hasContext = typeof contextBefore === 'string' && contextBefore.trim().length > 0;

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (hasContext) {
        messages.push({
            role: 'user',
            content: `[Previous context for reference — do NOT translate this]\n${contextBefore.trim()}\n\n[Translate the following into ${langName}]\n${text}`,
        });
    } else {
        messages.push({
            role: 'user',
            content: `[Translate into ${langName}]\n${text}`,
        });
    }

    return messages;
}

async function translate(text, targetLang, contextBefore = '') {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, error: 'Empty text' };

    const hasContext = typeof contextBefore === 'string' && contextBefore.trim().length > 0;
    if (!hasContext) {
        const cached = getCached(trimmed, targetLang);
        if (cached) return { success: true, translatedText: cached };
    }

    try {
        const modelInfo = await getModelInfo();
        if (!modelInfo || !modelInfo.apiKey) {
            return { success: false, error: 'AI model or API key not configured.' };
        }

        const llm = getLLM(modelInfo);
        const messages = buildMessages(trimmed, targetLang, contextBefore);
        const result = await llm.chat(messages);
        const translatedText = (result.content || '').trim();

        if (!hasContext) {
            setCache(trimmed, targetLang, translatedText);
        }
        return { success: true, translatedText };
    } catch (err) {
        console.error('[TranslateService] Translation failed:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Stream translation — sends chunks to `onChunk(token)` as they arrive.
 * Returns the full translated text when done.
 */
async function translateStream(text, targetLang, contextBefore = '', onChunk) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, error: 'Empty text' };

    const hasContext = typeof contextBefore === 'string' && contextBefore.trim().length > 0;
    if (!hasContext) {
        const cached = getCached(trimmed, targetLang);
        if (cached) {
            if (onChunk) onChunk(cached);
            return { success: true, translatedText: cached };
        }
    }

    try {
        const modelInfo = await getModelInfo();
        if (!modelInfo || !modelInfo.apiKey) {
            return { success: false, error: 'AI model or API key not configured.' };
        }

        const streamingLLM = getStreamingLLM(modelInfo);
        const messages = buildMessages(trimmed, targetLang, contextBefore);
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
                        if (onChunk) onChunk(token);
                    }
                } catch {}
            }
        }

        fullText = fullText.trim();
        if (!hasContext && fullText) {
            setCache(trimmed, targetLang, fullText);
        }
        return { success: true, translatedText: fullText };
    } catch (err) {
        console.error('[TranslateService] Stream translation failed:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { translate, translateStream };
