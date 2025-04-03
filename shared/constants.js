// Путь: /home/zverev/sandbox/Electron/silero-tts-app/shared/constants.js
const isDev = process.env.NODE_ENV === 'development' || 
              process.argv.includes('--dev');

const API_URL = isDev ? 'http://localhost:8000' : 'http://localhost:8000';

module.exports = {
  isDev,
  API_URL,
  API_ENDPOINTS: {
    HEALTH: `${API_URL}/health`,
    SPEAKERS: `${API_URL}/speakers`,
    SYNTHESIZE: `${API_URL}/synthesize`,
    SYNTHESIZE_TEXT: `${API_URL}/synthesize_text`,
    GET_AUDIO: (filename) => `${API_URL}/audio/${filename}`
  },
  DEFAULT_SPEAKER: 'xenia',
  DEFAULT_SAMPLE_RATE: 48000,
  SAMPLE_RATES: [8000, 24000, 48000]
};