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

async function translate(text, targetLang) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, error: 'Empty text' };

    const langName = LANG_MAP[targetLang] || targetLang;

    try {
        const modelInfo = await modelStateService.getCurrentModelInfo('llm');
        if (!modelInfo || !modelInfo.apiKey) {
            return { success: false, error: 'AI model or API key not configured.' };
        }

        const llm = createLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0,
            maxTokens: 256,
        });

        const messages = [
            {
                role: 'user',
                content: `Translate the following text into ${langName}. Respond with only the translation, no commentary or quotes.\n\n${trimmed}`,
            },
        ];

        const result = await llm.chat(messages);
        return { success: true, translatedText: (result.content || '').trim() };
    } catch (err) {
        console.error('[TranslateService] Translation failed:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { translate };
