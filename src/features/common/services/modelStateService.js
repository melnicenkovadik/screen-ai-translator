const { EventEmitter } = require('events');
const Store = require('electron-store');
const { PROVIDERS, getProviderClass } = require('../ai/factory');
const encryptionService = require('./encryptionService');
const providerSettingsRepository = require('../repositories/providerSettings');
const authService = require('./authService');

class ModelStateService extends EventEmitter {
    constructor() {
        super();
        this.authService = authService;
        this.store = new Store({ name: 'smart-ai-translator-model-state' });
    }

    async initialize() {
        console.log('[ModelStateService] Initializing one-time setup...');
        await this._initializeEncryption();
        await this._runMigrations();
        await this._autoSelectAvailableModels([], true);
        console.log('[ModelStateService] One-time setup complete.');
    }

    async _initializeEncryption() {
        try {
            const rows = await providerSettingsRepository.getRawApiKeys();
            if (rows.some(r => r.api_key && encryptionService.looksEncrypted(r.api_key))) {
                console.log('[ModelStateService] Encrypted keys detected, initializing encryption...');
                const userIdForMigration = this.authService.getCurrentUserId();
                await encryptionService.initializeKey(userIdForMigration);
            } else {
                console.log('[ModelStateService] No encrypted keys detected, skipping encryption initialization.');
            }
        } catch (err) {
            console.warn('[ModelStateService] Error while checking encrypted keys:', err.message);
        }
    }

    async _runMigrations() {
        console.log('[ModelStateService] Checking for data migrations...');
        const userId = this.authService.getCurrentUserId();
        
        try {
            const sqliteClient = require('./sqliteClient');
            const db = sqliteClient.getDb();
            const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_model_selections'").get();
            
            if (tableExists) {
                const selections = db.prepare('SELECT * FROM user_model_selections WHERE uid = ?').get(userId);
                if (selections) {
                    console.log('[ModelStateService] Migrating from user_model_selections table...');
                    if (selections.llm_model) {
                        const llmProvider = this.getProviderForModel(selections.llm_model, 'llm');
                        if (llmProvider) {
                            await this.setSelectedModel('llm', selections.llm_model);
                        }
                    }
                    if (selections.stt_model) {
                        const sttProvider = this.getProviderForModel(selections.stt_model, 'stt');
                        if (sttProvider) {
                            await this.setSelectedModel('stt', selections.stt_model);
                        }
                    }
                    db.prepare('DROP TABLE user_model_selections').run();
                    console.log('[ModelStateService] user_model_selections migration complete.');
                }
            }
        } catch (error) {
            console.error('[ModelStateService] user_model_selections migration failed:', error);
        }

        try {
            const legacyData = this.store.get(`users.${userId}`);
            if (legacyData && legacyData.apiKeys) {
                console.log('[ModelStateService] Migrating from electron-store...');
                for (const [provider, apiKey] of Object.entries(legacyData.apiKeys)) {
                    if (apiKey && PROVIDERS[provider]) {
                        await this.setApiKey(provider, apiKey);
                    }
                }
                if (legacyData.selectedModels?.llm) {
                    await this.setSelectedModel('llm', legacyData.selectedModels.llm);
                }
                if (legacyData.selectedModels?.stt) {
                    await this.setSelectedModel('stt', legacyData.selectedModels.stt);
                }
                this.store.delete(`users.${userId}`);
                console.log('[ModelStateService] electron-store migration complete.');
            }
        } catch (error) {
            console.error('[ModelStateService] electron-store migration failed:', error);
        }
    }

    async getLiveState() {
        const providerSettings = await providerSettingsRepository.getAll();
        const apiKeys = {};
        Object.keys(PROVIDERS).forEach(provider => {
            const setting = providerSettings.find(s => s.provider === provider);
            apiKeys[provider] = setting?.api_key || null;
        });

        const activeSettings = await providerSettingsRepository.getActiveSettings();
        const selectedModels = {
            llm: activeSettings.llm?.selected_llm_model || null,
            stt: activeSettings.stt?.selected_stt_model || null
        };
        
        return { apiKeys, selectedModels };
    }

    async _autoSelectAvailableModels(forceReselectionForTypes = [], isInitialBoot = false) {
        console.log(`[ModelStateService] Running auto-selection. Force re-selection for: [${forceReselectionForTypes.join(', ')}]`);
        const { apiKeys, selectedModels } = await this.getLiveState();
        const types = ['llm', 'stt'];

        for (const type of types) {
            const currentModelId = selectedModels[type];
            let isCurrentModelValid = false;
            const forceReselection = forceReselectionForTypes.includes(type);

            if (currentModelId && !forceReselection) {
                const provider = this.getProviderForModel(currentModelId, type);
                const apiKey = apiKeys[provider];
                if (provider && apiKey) {
                    isCurrentModelValid = true;
                }
            }

            if (!isCurrentModelValid) {
                console.log(`[ModelStateService] No valid ${type.toUpperCase()} model selected or selection forced. Finding an alternative...`);
                const availableModels = await this.getAvailableModels(type);
                if (availableModels.length > 0) {
                    await this.setSelectedModel(type, availableModels[0].id);
                    console.log(`[ModelStateService] Auto-selected ${type.toUpperCase()} model: ${availableModels[0].id}`);
                } else {
                    await providerSettingsRepository.setActiveProvider(null, type);
                    if (!isInitialBoot) {
                       this.emit('state-updated', await this.getLiveState());
                    }
                }
            }
        }
    }

    async setApiKey(provider, key) {
        console.log(`[ModelStateService] setApiKey for ${provider}`);
        if (!provider) {
            throw new Error('Provider is required');
        }

        const validationResult = await this.validateApiKey(provider, key);
        if (!validationResult.success) {
            console.warn(`[ModelStateService] API key validation failed for ${provider}: ${validationResult.error}`);
            return validationResult;
        }

        const existingSettings = await providerSettingsRepository.getByProvider(provider) || {};
        await providerSettingsRepository.upsert(provider, { ...existingSettings, api_key: key });

        if (provider === 'openai') {
            this._saveOpenAIDynamicModelCatalog(validationResult.modelIds || []);
        }
        
        await this._autoSelectAvailableModels([]);
        
        this.emit('state-updated', await this.getLiveState());
        this.emit('settings-updated');
        return { success: true };
    }

    async getAllApiKeys() {
        const allSettings = await providerSettingsRepository.getAll();
        const apiKeys = {};
        allSettings.forEach(s => {
            apiKeys[s.provider] = s.api_key;
        });
        return apiKeys;
    }

    async removeApiKey(provider) {
        const setting = await providerSettingsRepository.getByProvider(provider);
        if (setting && setting.api_key) {
            await providerSettingsRepository.upsert(provider, { ...setting, api_key: null });
            if (provider === 'openai') {
                this._saveOpenAIDynamicModelCatalog([]);
            }
            await this._autoSelectAvailableModels(['llm', 'stt']);
            this.emit('state-updated', await this.getLiveState());
            this.emit('settings-updated');
            return true;
        }
        return false;
    }

    async hasValidApiKey() {
        const allSettings = await providerSettingsRepository.getAll();
        return allSettings.some(s => s.api_key && s.api_key.trim().length > 0);
    }

    getProviderForModel(arg1, arg2) {
        let type, modelId;
        if (arg1 === 'llm' || arg1 === 'stt') {
            type = arg1;
            modelId = arg2;
        } else {
            modelId = arg1;
            type = arg2;
        }
        if (!modelId || !type) return null;
        const providerConfig = this.getProviderConfig();
        for (const providerId in providerConfig) {
            const models = type === 'llm' ? providerConfig[providerId].llmModels : providerConfig[providerId].sttModels;
            if (models && models.some(m => m.id === modelId)) {
                return providerId;
            }
        }
        return null;
    }

    async getSelectedModels() {
        const active = await providerSettingsRepository.getActiveSettings();
        return {
            llm: active.llm?.selected_llm_model || null,
            stt: active.stt?.selected_stt_model || null,
        };
    }
    
    async setSelectedModel(type, modelId, providerOverride) {
        const provider = providerOverride || this.getProviderForModel(modelId, type);
        if (!provider) {
            console.warn(`[ModelStateService] No provider found for model ${modelId}`);
            return false;
        }

        const existingSettings = await providerSettingsRepository.getByProvider(provider) || {};
        const newSettings = { ...existingSettings };

        if (type === 'llm') {
            newSettings.selected_llm_model = modelId;
        } else {
            newSettings.selected_stt_model = modelId;
        }
        
        await providerSettingsRepository.upsert(provider, newSettings);
        await providerSettingsRepository.setActiveProvider(provider, type);
        
        console.log(`[ModelStateService] Selected ${type} model: ${modelId} (provider: ${provider})`);
        
        this.emit('state-updated', await this.getLiveState());
        this.emit('settings-updated');
        return true;
    }

    async getAvailableModels(type) {
        const allSettings = await providerSettingsRepository.getAll();
        const available = [];
        const modelListKey = type === 'llm' ? 'llmModels' : 'sttModels';
        const providerConfig = this.getProviderConfig();

        for (const setting of allSettings) {
            if (!setting.api_key) continue;
            const providerId = setting.provider;
            if (providerConfig[providerId]?.[modelListKey]) {
                available.push(...providerConfig[providerId][modelListKey]);
            }
        }
        return [...new Map(available.map(item => [item.id, item])).values()];
    }

    async getCurrentModelInfo(type) {
        const activeSetting = await providerSettingsRepository.getActiveProvider(type);
        if (!activeSetting) return null;
        
        const model = type === 'llm' ? activeSetting.selected_llm_model : activeSetting.selected_stt_model;
        if (!model) return null;

        return {
            provider: activeSetting.provider,
            model: model,
            apiKey: activeSetting.api_key,
        };
    }

    async validateApiKey(provider, key) {
        if (!key || key.trim() === '') {
            return { success: false, error: 'API key cannot be empty.' };
        }
        const ProviderClass = getProviderClass(provider);
        if (!ProviderClass || typeof ProviderClass.validateApiKey !== 'function') {
            return { success: true };
        }
        try {
            return await ProviderClass.validateApiKey(key);
        } catch (error) {
            return { success: false, error: 'An unexpected error occurred during validation.' };
        }
    }

    getProviderConfig() {
        const config = {};
        for (const key in PROVIDERS) {
            const { handler, ...rest } = PROVIDERS[key];
            config[key] = rest;
        }
        config.openai = this._buildOpenAIConfig(config.openai);
        return config;
    }
    
    async handleRemoveApiKey(provider) {
        const success = await this.removeApiKey(provider);
        if (success) {
            const selectedModels = await this.getSelectedModels();
            if (!selectedModels.llm && !selectedModels.stt) {
                this.emit('force-show-apikey-header');
            }
        }
        return success;
    }

    async handleValidateKey(provider, key) {
        return await this.setApiKey(provider, key);
    }

    async handleSetSelectedModel(type, modelId, provider) {
        return await this.setSelectedModel(type, modelId, provider);
    }

    async areProvidersConfigured() {
        const allSettings = await providerSettingsRepository.getAll();
        const apiKeyMap = {};
        allSettings.forEach(s => apiKeyMap[s.provider] = s.api_key);
        const hasLlmKey = Object.entries(apiKeyMap).some(([provider, key]) => {
            if (!key) return false;
            return PROVIDERS[provider]?.llmModels?.length > 0;
        });
        const hasSttKey = Object.entries(apiKeyMap).some(([provider, key]) => {
            if (!key) return false;
            return PROVIDERS[provider]?.sttModels?.length > 0;
        });
        return hasLlmKey && hasSttKey;
    }
}

ModelStateService.prototype._getDynamicModelCatalog = function () {
    return this.store.get('dynamicModelCatalog', {});
};

ModelStateService.prototype._saveOpenAIDynamicModelCatalog = function (modelIds) {
    const current = this._getDynamicModelCatalog();
    current.openai = {
        modelIds: Array.isArray(modelIds) ? modelIds : [],
        fetchedAt: Date.now(),
    };
    this.store.set('dynamicModelCatalog', current);
};

ModelStateService.prototype._buildOpenAIConfig = function (baseOpenAIConfig) {
    const dynamic = this._getDynamicModelCatalog().openai;
    const modelIds = Array.isArray(dynamic?.modelIds) ? dynamic.modelIds : [];
    if (modelIds.length === 0) return baseOpenAIConfig;

    const staticLlmMap = new Map((baseOpenAIConfig.llmModels || []).map(m => [m.id, m]));
    const staticSttMap = new Map((baseOpenAIConfig.sttModels || []).map(m => [m.id, m]));
    const staticLlmOrder = (baseOpenAIConfig.llmModels || []).map(m => m.id);
    const staticSttOrder = (baseOpenAIConfig.sttModels || []).map(m => m.id);

    const isLikelyLlm = (id) =>
        /^gpt-/i.test(id) &&
        !/transcribe|audio|realtime|tts|embedding|vision/i.test(id);
    const isLikelyStt = (id) => /transcribe/i.test(id) || id === 'whisper-1';

    const llmIds = modelIds.filter(isLikelyLlm);
    const sttIds = modelIds.filter(isLikelyStt);

    const humanize = (id) => id.toUpperCase().replace(/-/g, '-');

    const orderedLlm = [
        ...staticLlmOrder.filter(id => llmIds.includes(id)),
        ...llmIds.filter(id => !staticLlmMap.has(id)),
    ].map(id => staticLlmMap.get(id) || { id, name: humanize(id) });

    const orderedStt = [
        ...staticSttOrder.filter(id => sttIds.includes(id)),
        ...sttIds.filter(id => !staticSttMap.has(id)),
    ].map(id => staticSttMap.get(id) || { id, name: humanize(id) });

    return {
        ...baseOpenAIConfig,
        llmModels: orderedLlm.length > 0 ? orderedLlm : baseOpenAIConfig.llmModels,
        sttModels: orderedStt.length > 0 ? orderedStt : baseOpenAIConfig.sttModels,
    };
};

const modelStateService = new ModelStateService();
module.exports = modelStateService;
