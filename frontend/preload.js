// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { API_URL, API_ENDPOINTS } = require('../shared/constants');

// Экспортируем API для рендерера
contextBridge.exposeInMainWorld('api', {
  // Проверка работоспособности сервера
  checkHealth: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH);
      return await response.json();
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  },
  
  // Получение списка доступных голосов
  getSpeakers: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SPEAKERS);
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },
  
  // Синтез речи и получение аудиофайла
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
  
  // Сохранение аудиофайла
  saveAudioFile: async (audioPath) => {
    return await ipcRenderer.invoke('save-audio-file', audioPath);
  },
  
  // Открытие директории
  openDirectory: async (dirPath) => {
    return await ipcRenderer.invoke('open-directory', dirPath);
  }
});