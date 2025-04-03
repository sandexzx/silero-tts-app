const { contextBridge, ipcRenderer } = require('electron');
const { join } = require('path');

try {
  // Абсолютный путь с проверкой на ошибки
  const constants = require(join(__dirname, '..', 'shared', 'constants'));
  const { API_URL, API_ENDPOINTS } = constants;
  
  console.log("🚀 Constants загружены успешно:", API_URL);

  // Экспортируем API для рендерера
  contextBridge.exposeInMainWorld('api', {
    API_URL: API_URL,
    API_ENDPOINTS: API_ENDPOINTS,
    THEMES: constants.THEMES,
    DEFAULT_THEME: constants.DEFAULT_THEME,
    
    // Улучшаем функцию проверки здоровья
    checkHealth: async () => {
      console.log("Отправляю запрос по:", API_ENDPOINTS.HEALTH);
      try {
        const response = await fetch(API_ENDPOINTS.HEALTH, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache' // Отключаем кэширование
        });
        
        if (!response.ok) {
          throw new Error(`Сервер вернул ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Ответ здоровья:", data);
        return data;
      } catch (error) {
        console.error("Ошибка проверки здоровья:", error.message);
        return { status: 'error', error: error.message };
      }
    },
    
    // Остальные функции оставляем без изменений
    getSpeakers: async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SPEAKERS);
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    },
    
    synthesize: async (text, speaker, sampleRate, useSSML) => {
      try {
        const response = await fetch(API_ENDPOINTS.SYNTHESIZE_TEXT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            speaker,
            sample_rate: sampleRate,
            use_ssml: useSSML
          }),
        });
        
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    },
    
    saveAudioFile: async (audioPath) => {
      return await ipcRenderer.invoke('save-audio-file', audioPath);
    },
    
    openDirectory: async (dirPath) => {
      return await ipcRenderer.invoke('open-directory', dirPath);
    }
  });
} catch (error) {
  console.error("💀 Ошибка загрузки constants:", error);
  // Запасные значения на случай сбоя загрузки
  const API_URL = 'http://127.0.0.1:8000';
  const API_ENDPOINTS = {
    HEALTH: `${API_URL}/health`,
    SPEAKERS: `${API_URL}/speakers`,
    SYNTHESIZE: `${API_URL}/synthesize`,
    SYNTHESIZE_TEXT: `${API_URL}/synthesize_text`,
    GET_AUDIO: (filename) => `${API_URL}/audio/${filename}`
  };
  
  // Экспортируем запасные значения
  contextBridge.exposeInMainWorld('api', {
    API_URL,
    API_ENDPOINTS,
    
    // Те же функции что были...
    checkHealth: async () => {
      // ... (остальной код оставь как есть)
    },
    // ... (остальные функции оставь без изменений)
  });
}