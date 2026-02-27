const modelStateService = require('../common/services/modelStateService');
const { createLLM } = require('../common/ai/factory');

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

let cachedLLM = null;
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

function getLLM(modelInfo) {
    const key = `${modelInfo.provider}:${modelInfo.model}:${modelInfo.apiKey}`;
    if (key !== cachedModelKey) {
        cachedLLM = createLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0,
            maxTokens: 2048,
        });
        cachedModelKey = key;
    }
    return cachedLLM;
}

async function translate(text, targetLang) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, error: 'Empty text' };

    const cached = getCached(trimmed, targetLang);
    if (cached) return { success: true, translatedText: cached };

    const langName = LANG_MAP[targetLang] || targetLang;

    try {
        const modelInfo = await modelStateService.getCurrentModelInfo('llm');
        if (!modelInfo || !modelInfo.apiKey) {
            return { success: false, error: 'AI model or API key not configured.' };
        }

        const llm = getLLM(modelInfo);

        const messages = [
            {
                role: 'user',
                content: `Translate the following text into ${langName}. Respond with only the translation, no commentary or quotes.\n\n${trimmed}`,
            },
        ];

        const result = await llm.chat(messages);
        const translatedText = (result.content || '').trim();
        setCache(trimmed, targetLang, translatedText);
        return { success: true, translatedText };
    } catch (err) {
        console.error('[TranslateService] Translation failed:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { translate };
