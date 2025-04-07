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
    THEMES: constants.THEMES || { LIGHT: 'light', DARK: 'dark' },
    DEFAULT_THEME: constants.DEFAULT_THEME || 'dark',

    selectSaveDirectory: async () => {
      return await ipcRenderer.invoke('select-save-directory');
    },
    
    getSaveDirectory: async () => {
      return await ipcRenderer.invoke('get-save-directory');
    },
    
    saveAudioToDirectory: async (audioPath, directoryPath) => {
      return await ipcRenderer.invoke('save-audio-to-directory', { audioPath, directoryPath });
    },

    synthesizeAndSave: async (text, speaker, sampleRate, useSSML) => {
      try {
        console.log("Начинаем синтез и сохранение");
        // Сначала синтезируем
        const result = await fetch(API_ENDPOINTS.SYNTHESIZE_TEXT, {
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
        
        if (!result.ok) {
          const errorText = await result.text();
          throw new Error(`Ошибка сервера ${result.status}: ${errorText}`);
        }
        
        const data = await result.json();
        console.log("Получен ответ от сервера:", data);
        
        // Если успешно, сразу сохраняем
        if (data.filename && data.path) {
          return await ipcRenderer.invoke('save-audio-file', data.path);
        } else {
          throw new Error("Синтез не вернул данные о файле");
        }
      } catch (error) {
        console.error("Ошибка при синтезе и сохранении:", error);
        return { error: error.message };
      }
    },
    
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
      console.log(`Отправляю запрос по: ${API_ENDPOINTS.SYNTHESIZE_TEXT}`);
      console.log(`Параметры: speaker=${speaker}, sampleRate=${sampleRate}, useSSML=${useSSML}`);
      
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
          
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ошибка ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Ответ от сервера:", data);
          return data;
      } catch (error) {
          console.error("Критическая ошибка:", error);
          return { error: error.message };
      }
  },
    
    saveAudioFile: async (filename) => {
      try {
        // Вместо использования полного пути, который может вызвать проблемы в Windows,
        // передаем только имя файла и позволяем main процессу построить корректный путь
        return await ipcRenderer.invoke('save-audio-file', filename);
      } catch (error) {
        console.error("Ошибка сохранения файла:", error);
        return null;
      }
    },
    
    openDirectory: async (dirPath) => {
      return await ipcRenderer.invoke('open-directory', dirPath);
    },
    
    loadTextFromFile: async () => {
      return await ipcRenderer.invoke('load-text-file');
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
    THEMES: { LIGHT: 'light', DARK: 'dark' },
    DEFAULT_THEME: 'dark',

    selectSaveDirectory: async () => {
      return await ipcRenderer.invoke('select-save-directory');
    },
    
    getSaveDirectory: async () => {
      return await ipcRenderer.invoke('get-save-directory');
    },
    
    saveAudioToDirectory: async (audioPath, directoryPath) => {
      return await ipcRenderer.invoke('save-audio-to-directory', { audioPath, directoryPath });
    },
    
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
    
    saveAudioFile: async (filename) => {
      try {
        // Вместо использования полного пути, который может вызвать проблемы в Windows,
        // передаем только имя файла и позволяем main процессу построить корректный путь
        return await ipcRenderer.invoke('save-audio-file', filename);
      } catch (error) {
        console.error("Ошибка сохранения файла:", error);
        return null;
      }
    },
    
    openDirectory: async (dirPath) => {
      return await ipcRenderer.invoke('open-directory', dirPath);
    },
    
    loadTextFromFile: async () => {
      return await ipcRenderer.invoke('load-text-file');
    }
  });
}