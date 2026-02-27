const OpenAI = require('openai');
const WebSocket = require('ws');
const { Readable } = require('stream');


class OpenAIProvider {
    static async validateApiKey(key) {
        if (!key || typeof key !== 'string' || !key.startsWith('sk-')) {
            return { success: false, error: 'Invalid OpenAI API key format.' };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${key}` }
            });

            if (response.ok) {
                const payload = await response.json().catch(() => ({}));
                const modelIds = Array.isArray(payload?.data)
                    ? payload.data.map(item => item?.id).filter(Boolean)
                    : [];
                return { success: true, modelIds };
            } else {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error?.message || `Validation failed with status: ${response.status}`;
                return { success: false, error: message };
            }
        } catch (error) {
            console.error(`[OpenAIProvider] Network error during key validation:`, error);
            return { success: false, error: 'A network error occurred during validation.' };
        }
    }
}


async function createSTT({ apiKey, language = 'ru', callbacks = {}, ...config }) {
  const wsUrl = 'wss://api.openai.com/v1/realtime?intent=transcription';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'OpenAI-Beta': 'realtime=v1',
  };

  const ws = new WebSocket(wsUrl, { headers });

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log("WebSocket session opened.");

      const sessionConfig = {
        type: 'transcription_session.update',
        session: {
          input_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
            prompt: config.prompt || ''
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 200,
            silence_duration_ms: 100,
          },
          input_audio_noise_reduction: {
            type: 'near_field'
          }
        }
      };

      if (language && language !== 'auto') {
        sessionConfig.session.input_audio_transcription.language = language;
      }
      
      ws.send(JSON.stringify(sessionConfig));

      const keepAlive = () => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        } catch (err) {
          console.error('[OpenAI STT] keepAlive error:', err.message);
        }
      };

      resolve({
        sendRealtimeInput: (audioData) => {
          if (ws.readyState === WebSocket.OPEN) {
            const message = {
              type: 'input_audio_buffer.append',
              audio: audioData
            };
            ws.send(JSON.stringify(message));
          }
        },
        keepAlive,
        close: () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'session.close' }));
            ws.onmessage = ws.onerror = () => {};
            ws.close(1000, 'Client initiated close.');
          }
        }
      });
    };

    ws.onmessage = (event) => {
      if (!event.data || event.data === 'null' || event.data === '[DONE]') return;

      let msg;
      try { msg = JSON.parse(event.data); }
      catch { return; }

      if (!msg || typeof msg !== 'object') return;

      msg.provider = 'openai';
      callbacks.onmessage?.(msg);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error.message);
      if (callbacks && callbacks.onerror) {
        callbacks.onerror(error);
      }
      reject(error);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason}`);
      if (callbacks && callbacks.onclose) {
        callbacks.onclose(event);
      }
    };
  });
}

function createLLM({ apiKey, model = 'gpt-4.1', temperature = 0.7, maxTokens = 2048, ...config }) {
  const client = new OpenAI({ apiKey });
  const fallbackModels = ['gpt-4.1', 'gpt-4o-mini'];

  const extractErrorMessage = (error) => {
    if (!error) return '';
    return (
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      ''
    );
  };

  const isModelAccessError = (error) => {
    const message = extractErrorMessage(error).toLowerCase();
    return (
      error?.status === 400 ||
      error?.status === 403 ||
      error?.status === 404 ||
      message.includes('model') ||
      message.includes('does not exist') ||
      message.includes('not found') ||
      message.includes('not have access') ||
      message.includes('access')
    );
  };
  
  const callApiWithModel = async (messages, modelToUse) => {
    const response = await client.chat.completions.create({
      model: modelToUse,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    });
    return {
      content: response.choices[0].message.content.trim(),
      raw: response,
      model: modelToUse,
    };
  };

  const callApi = async (messages) => {
    try {
      return await callApiWithModel(messages, model);
    } catch (error) {
      if (!isModelAccessError(error)) {
        throw error;
      }

      for (const fallbackModel of fallbackModels) {
        if (fallbackModel === model) continue;
        try {
          console.warn(`[OpenAIProvider] Model "${model}" unavailable. Falling back to "${fallbackModel}".`);
          return await callApiWithModel(messages, fallbackModel);
        } catch (fallbackError) {
          if (!isModelAccessError(fallbackError)) {
            throw fallbackError;
          }
        }
      }

      throw new Error(
        `The selected OpenAI model "${model}" is not available for this API key/project. Try GPT-4.1 or GPT-4o Mini.`
      );
    }
  };

  return {
    generateContent: async (parts) => {
      const messages = [];
      let systemPrompt = '';
      let userContent = [];
      
      for (const part of parts) {
        if (typeof part === 'string') {
          if (systemPrompt === '' && part.includes('You are')) {
            systemPrompt = part;
          } else {
            userContent.push({ type: 'text', text: part });
          }
        } else if (part.inlineData) {
          userContent.push({
            type: 'image_url',
            image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
          });
        }
      }
      
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      if (userContent.length > 0) messages.push({ role: 'user', content: userContent });
      
      const result = await callApi(messages);

      return {
        response: {
          text: () => result.content
        },
        raw: result.raw
      };
    },
    
    chat: async (messages) => {
      return await callApi(messages);
    }
  };
}

function createStreamingLLM({ apiKey, model = 'gpt-4.1', temperature = 0.7, maxTokens = 2048, ...config }) {
  const fallbackModels = ['gpt-4.1', 'gpt-4o-mini'];
  const orderedModels = [model, ...fallbackModels.filter(m => m !== model)];

  const buildRequest = async (modelToUse, messages) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    return response;
  };

  return {
    streamChat: async (messages) => {
      let lastError = null;
      for (const modelToUse of orderedModels) {
        const response = await buildRequest(modelToUse, messages);
        if (response.ok) {
          if (modelToUse !== model) {
            console.warn(`[OpenAIProvider] Streaming model "${model}" unavailable. Falling back to "${modelToUse}".`);
          }
          return response;
        }

        const errBody = await response.json().catch(() => ({}));
        const errMessage = errBody?.error?.message || `${response.status} ${response.statusText}`;
        lastError = new Error(`OpenAI API error (${modelToUse}): ${errMessage}`);

        const normalized = String(errMessage).toLowerCase();
        const modelError =
          response.status === 400 ||
          response.status === 403 ||
          response.status === 404 ||
          normalized.includes('model') ||
          normalized.includes('not found') ||
          normalized.includes('not have access');

        if (!modelError) {
          throw lastError;
        }
      }

      throw lastError || new Error(`OpenAI API error: unable to use model "${model}"`);
    }
  };
}

module.exports = {
    OpenAIProvider,
    createSTT,
    createLLM,
    createStreamingLLM
};
