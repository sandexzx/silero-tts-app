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
          console.error("Ошибка от API:", response.error);
          throw new Error(response.error);
        }
        
        // Проверяем наличие имени файла
        if (!response.filename) {
          console.error("Некорректный ответ API:", response);
          throw new Error("API вернул некорректный ответ без имени файла");
        }
        
        // Проверяем, что ответ содержит и имя файла и путь
        if (response.filename && response.path) {
          this.lastSynthesisResult = {
            filename: response.filename,
            path: response.path
          };
        } else {
          console.error("API вернул некорректный ответ:", response);
          throw new Error("API вернул ответ без нужных данных о файле");
        }
        
        console.log("Синтез успешен, имя файла:", response.filename);
        return this.lastSynthesisResult;
      } catch (error) {
        console.error('Ошибка синтеза речи:', error);
        throw error;
      }
    }
  
    async saveAudioFile() {
      if (!this.lastSynthesisResult || !this.lastSynthesisResult.filename) {
        throw new Error('Нет доступных аудиофайлов для сохранения');
      }
  
      try {
        const savedPath = await window.api.saveAudioFile(this.lastSynthesisResult.filename);
        return savedPath;
      } catch (error) {
        console.error('Ошибка сохранения аудиофайла:', error);
        throw error;
      }
    }

    async synthesizeAndSave(text, speaker = 'xenia', sampleRate = 48000, useSSML = false) {
      try {
        const result = await window.api.synthesizeAndSave(text, speaker, sampleRate, useSSML);
        return result;
      } catch (error) {
        console.error('Ошибка при синтезе и сохранении:', error);
        throw error;
      }
    }

    // Добавь новые методы в класс ApiClient
    async selectSaveDirectory() {
      try {
        const result = await window.api.selectSaveDirectory();
        return result;
      } catch (error) {
        console.error('Ошибка выбора директории:', error);
        throw error;
      }
    }

    async getSaveDirectory() {
      try {
        const result = await window.api.getSaveDirectory();
        return result.path;
      } catch (error) {
        console.error('Ошибка получения пути директории:', error);
        return '';
      }
    }

    async saveAudioToDirectory(directoryPath) {
      if (!this.lastSynthesisResult || !this.lastSynthesisResult.filename) {
        throw new Error('Нет доступных аудиофайлов для сохранения');
      }

      try {
        const result = await window.api.saveAudioToDirectory(
          this.lastSynthesisResult.path, 
          directoryPath
        );
        return result;
      } catch (error) {
        console.error('Ошибка сохранения в директорию:', error);
        throw error;
      }
    }
    
    getAudioUrl(filename) {
      return `${window.api.API_URL}/audio/${filename}`;
    }
  }
  
  // Создаем глобальный экземпляр API клиента
  const apiClient = new ApiClient();