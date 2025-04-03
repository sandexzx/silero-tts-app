// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/renderer/scripts/api.js
class ApiClient {
    constructor() {
      this.apiUrl = '';
      this.lastSynthesisResult = null;
    }
  
    async checkServerStatus() {
      try {
        const health = await window.api.checkHealth();
        return health && health.status === 'ok';
      } catch (error) {
        console.error('Ошибка проверки статуса сервера:', error);
        return false;
      }
    }
  
    async getSpeakers() {
      try {
        const response = await window.api.getSpeakers();
        if (response && response.speakers) {
          return response.speakers;
        }
        return [];
      } catch (error) {
        console.error('Ошибка получения списка голосов:', error);
        return [];
      }
    }
  
    async synthesize(text, speaker = 'xenia', sampleRate = 48000, useSSML = false) {
      try {
        const response = await window.api.synthesize(text, speaker, sampleRate, useSSML);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        this.lastSynthesisResult = response;
        return response;
      } catch (error) {
        console.error('Ошибка синтеза речи:', error);
        throw error;
      }
    }
  
    async saveAudioFile() {
      if (!this.lastSynthesisResult || !this.lastSynthesisResult.path) {
        throw new Error('Нет доступных аудиофайлов для сохранения');
      }
  
      try {
        const savedPath = await window.api.saveAudioFile(this.lastSynthesisResult.path);
        return savedPath;
      } catch (error) {
        console.error('Ошибка сохранения аудиофайла:', error);
        throw error;
      }
    }
    
    getAudioUrl(filename) {
      return `http://localhost:8000/audio/${filename}`;
    }
  }
  
  // Создаем глобальный экземпляр API клиента
  const apiClient = new ApiClient();