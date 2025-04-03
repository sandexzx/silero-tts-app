// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/renderer/scripts/api.js
class ApiClient {
  constructor() {
    // Надежная инициализация с проверкой 
    if (!window.api || !window.api.API_URL) {
      console.error("🔥 window.api не инициализирован корректно!");
      this.apiUrl = 'http://127.0.0.1:8000'; // Фоллбэк
    } else {
      this.apiUrl = window.api.API_URL;
    }
    this.lastSynthesisResult = null;
    console.log("📡 ApiClient создан с URL:", this.apiUrl);
  }
  
    async checkServerStatus() {
      console.log("Проверяю сервер по адресу:", this.apiUrl + "/health"); // Можно оставить для отладки
      try {
        const health = await window.api.checkHealth(); // Вызываем функцию из preload
        console.log("Ответ сервера (checkServerStatus):", health); // Отладка

        // [!!!] ПРАВИЛЬНАЯ ПРОВЕРКА [!!!]
        // Проверяем, что ответ существует, это объект и его статус именно 'ok'
        if (health && typeof health === 'object' && health.status === 'ok') {
          console.log("Сервер действительно бодрячком! ✅"); // Обновим лог для ясности
          return true; // Сервер доступен
        } else {
          // Логируем, почему считаем сервер недоступным
          if (!health) {
            console.log("Ответ от checkHealth пустой.");
          } else if (typeof health !== 'object') {
            console.log("Ответ от checkHealth не является объектом:", health);
          } else {
            console.log("Статус сервера не 'ok':", health.status, "| Детали:", health.error || 'Нет деталей');
          }
          return false; // Сервер недоступен или вернул ошибку
        }
      } catch (error) { // Эта ошибка ловится, если window.api.checkHealth выбросил исключение (маловероятно из-за try/catch внутри preload)
        console.error('Критическая ошибка при вызове window.api.checkHealth:', error);
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
      return `${window.api.API_URL}/audio/${filename}`;
    }
  }
  
  // Создаем глобальный экземпляр API клиента
  const apiClient = new ApiClient();