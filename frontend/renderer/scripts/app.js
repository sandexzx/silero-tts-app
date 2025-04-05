// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/renderer/scripts/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const speakerSelect = document.getElementById('speaker-select');
    const sampleRateSelect = document.getElementById('sample-rate-select');
    const textInput = document.getElementById('text-input');
    const ssmlInput = document.getElementById('ssml-input');
    const synthesizeBtn = document.getElementById('synthesize-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const playerPanel = document.getElementById('player-panel');
    const tabText = document.getElementById('tab-text');
    const tabSsml = document.getElementById('tab-ssml');
    const textEditor = document.getElementById('text-editor');
    const ssmlEditor = document.getElementById('ssml-editor');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const notificationClose = document.getElementById('notification-close');
    const synthesizeSaveBtn = document.getElementById('synthesize-save-btn');
    const saveDirDisplay = document.getElementById('save-dir-display');
    const selectSaveDirBtn = document.getElementById('select-save-dir-btn');
  
    // Состояние приложения
    let isServerOnline = false;
    let isProcessing = false;
    let activeTab = 'text'; 
    let saveDirectoryPath = '';
  
    // Инициализация
    init();
  
    async function init() {
      // Проверка существования apiClient  
      if (typeof apiClient === 'undefined') {
        console.error("❌ apiClient не определен! Создаю запасной экземпляр");
        window.apiClient = new ApiClient();
        // Используем глобальный объект для доступа отовсюду
      }
      
      await checkServerStatus();
      if (isServerOnline) {
        await loadSpeakers();
      }

      loadSaveDirectory();
      
      // Устанавливаем обработчики событий
      setupEventListeners();
      
      // Периодически проверяем статус сервера
      setInterval(checkServerStatus, 10000);
    }

    async function loadSaveDirectory() {
      try {
        saveDirectoryPath = await apiClient.getSaveDirectory();
        updateSaveDirectoryDisplay();
      } catch (error) {
        console.error('Ошибка загрузки пути сохранения:', error);
      }
    }

    function updateSaveDirectoryDisplay() {
      if (saveDirectoryPath) {
        saveDirDisplay.value = saveDirectoryPath;
        // Включаем прямое сохранение, если директория выбрана
        synthesizeSaveBtn.disabled = !isServerOnline;
      } else {
        saveDirDisplay.value = '';
        saveDirDisplay.placeholder = 'Не выбрана';
      }
    }
  
    async function checkServerStatus() {
      try {
        if (typeof apiClient === 'undefined') {
          console.error("❌ apiClient все еще не определен в checkServerStatus");
          isServerOnline = false;
          return;
        }
        isServerOnline = await apiClient.checkServerStatus();
      } catch (error) {
        console.error("💣 Ошибка проверки статуса:", error);
        isServerOnline = false;
      }
      updateServerStatus();
    }
  
    function updateServerStatus() {
      if (isServerOnline) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.textContent = 'Сервер активен';
        synthesizeBtn.disabled = false;
        synthesizeSaveBtn.disabled = false; 
      } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.textContent = 'Сервер недоступен';
        synthesizeBtn.disabled = true;
        synthesizeSaveBtn.disabled = true;
      }
    }
  
    async function loadSpeakers() {
      const speakers = await apiClient.getSpeakers();
      
      // Очищаем выпадающий список
      speakerSelect.innerHTML = '';
      
      if (speakers && speakers.length > 0) {
        // Добавляем опции для каждого спикера
        speakers.forEach(speaker => {
          const option = document.createElement('option');
          option.value = speaker;
          option.textContent = speaker;
          speakerSelect.appendChild(option);
        });
        
        speakerSelect.disabled = false;
      } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Нет доступных голосов';
        speakerSelect.appendChild(option);
        speakerSelect.disabled = true;
      }
    }
  
    function setupEventListeners() {
      // Переключение вкладок
      tabText.addEventListener('click', () => switchTab('text'));
      tabSsml.addEventListener('click', () => switchTab('ssml'));
      
      // Кнопки действий
      synthesizeBtn.addEventListener('click', handleSynthesize);
      clearBtn.addEventListener('click', handleClear);
      saveBtn.addEventListener('click', handleSave);
      resetBtn.addEventListener('click', handleReset);
      synthesizeSaveBtn.addEventListener('click', handleSynthesizeAndSave);
      
      // Закрытие уведомления
      notificationClose.addEventListener('click', hideNotification);

      // Счетчики символов
      textInput.addEventListener('input', updateCharCounter);
      ssmlInput.addEventListener('input', updateCharCounter);

      selectSaveDirBtn.addEventListener('click', async () => {
        try {
          const result = await apiClient.selectSaveDirectory();
          if (result && result.success) {
            saveDirectoryPath = result.path;
            updateSaveDirectoryDisplay();
            showNotification(`Директория установлена: ${result.path}`, 'success');
          }
        } catch (error) {
          showNotification(`Ошибка выбора директории: ${error.message}`, 'error');
        }
      });

      // SSML-кнопки вставки тегов
      document.getElementById('insert-speak-btn').addEventListener('click', () => {
        insertSsmlTag('<speak>', '</speak>');
      });

      document.getElementById('insert-break-btn').addEventListener('click', () => {
        insertSsmlTag('<break time="500ms"/>', '');
      });

      document.getElementById('insert-emphasis-btn').addEventListener('click', () => {
        insertSsmlTag('<emphasis level="strong">', '</emphasis>');
      });

      document.getElementById('insert-prosody-btn').addEventListener('click', () => {
        insertSsmlTag('<prosody rate="slow">', '</prosody>');
      });

      // Сохранение и загрузка текста
      document.getElementById('load-text-btn').addEventListener('click', loadTextFromFile);
    }
  
    function switchTab(tabName) {
      activeTab = tabName;
      
      if (tabName === 'text') {
        tabText.classList.add('active');
        tabSsml.classList.remove('active');
        textEditor.classList.remove('hidden');
        ssmlEditor.classList.add('hidden');
      } else {
        tabText.classList.remove('active');
        tabSsml.classList.add('active');
        textEditor.classList.add('hidden');
        ssmlEditor.classList.remove('hidden');
      }
    }

    async function handleSynthesize() {
      if (!isServerOnline || isProcessing) return;
      
      const text = activeTab === 'text' ? textInput.value : ssmlInput.value;
      if (!text.trim()) {
        showNotification('Пожалуйста, введите текст для синтеза', 'error');
        return;
      }
      
      try {
        isProcessing = true;
        synthesizeBtn.disabled = true;
        synthesizeBtn.textContent = 'Синтезируем...';
        
        const speaker = speakerSelect.value;
        const sampleRate = parseInt(sampleRateSelect.value);
        const useSSML = activeTab === 'ssml';
        
        const result = await apiClient.synthesize(text, speaker, sampleRate, useSSML);
        
        // Обновляем аудиоплеер и показываем панель
        const audioUrl = apiClient.getAudioUrl(result.filename);
        console.log("Ссылка на аудио:", audioUrl);
        
        const player = document.getElementById('audio-player');
        player.src = audioUrl;
        player.load();
        player.onloadedmetadata = function() {
          console.log("Метаданные загружены: длительность =", player.duration);
        };
        playerPanel.classList.remove('hidden');
        
        showNotification('Синтез успешно завершен!', 'success');
      } catch (error) {
        showNotification(`Ошибка синтеза: ${error.message}`, 'error');
      } finally {
        isProcessing = false;
        synthesizeBtn.disabled = false;
        synthesizeBtn.textContent = 'Синтезировать';
      }
    }
  
    function handleClear() {
      if (activeTab === 'text') {
        textInput.value = '';
      } else {
        ssmlInput.value = '<speak></speak>';
      }
    }
  
    async function handleSave() {
      try {
        const savedPath = await apiClient.saveAudioFile();
        if (savedPath) {
          showNotification(`Файл успешно сохранен: ${savedPath}`, 'success');
        }
      } catch (error) {
        showNotification(`Ошибка сохранения: ${error.message}`, 'error');
      }
    }
  
    function handleReset() {
      audioPlayer.reset();
      playerPanel.classList.add('hidden');
    }
  
    function showNotification(message, type = 'info') {
      notificationText.textContent = message;
      notification.className = 'notification show';
      
      if (type === 'error') {
        notification.classList.add('error');
      } else if (type === 'success') {
        notification.classList.add('success');
      }
      
      // Автоматически скрываем уведомление через 5 секунд
      setTimeout(() => {
        hideNotification();
      }, 5000);
    }

    async function handleSynthesizeAndSave() {
      if (!isServerOnline || isProcessing) return;
      
      // Проверяем, задана ли директория для сохранения
      if (!saveDirectoryPath) {
        showNotification('Пожалуйста, выберите директорию для сохранения', 'error');
        return;
      }
      
      const text = activeTab === 'text' ? textInput.value : ssmlInput.value;
      if (!text.trim()) {
        showNotification('Пожалуйста, введите текст для синтеза', 'error');
        return;
      }
      
      try {
        isProcessing = true;
        synthesizeBtn.disabled = true;
        synthesizeSaveBtn.disabled = true;
        synthesizeSaveBtn.textContent = 'Обрабатываем...';
        
        const speaker = speakerSelect.value;
        const sampleRate = parseInt(sampleRateSelect.value);
        const useSSML = activeTab === 'ssml';
        
        // Синтезируем аудио
        const result = await apiClient.synthesize(text, speaker, sampleRate, useSSML);
        
        // Сохраняем в выбранную директорию
        const saveResult = await window.api.saveAudioToDirectory(result.path, saveDirectoryPath);
        
        if (saveResult && saveResult.success) {
          showNotification(`Файл сохранен в выбранную директорию: ${saveResult.path}`, 'success');
        } else {
          throw new Error(saveResult.error || 'Не удалось сохранить файл');
        }
      } catch (error) {
        showNotification(`Ошибка при синтезе и сохранении: ${error.message}`, 'error');
      } finally {
        isProcessing = false;
        synthesizeBtn.disabled = false;
        synthesizeSaveBtn.disabled = !saveDirectoryPath;
        synthesizeSaveBtn.textContent = 'Синтезировать и сохранить';
      }
    }

    function updateCharCounter() {
      const textCounter = document.getElementById('text-char-counter');
      const ssmlCounter = document.getElementById('ssml-char-counter');
      
      if (textCounter) {
        const charCount = textInput.value.length;
        textCounter.textContent = `${charCount} символов`;
      }
      
      if (ssmlCounter) {
        const charCount = ssmlInput.value.length;
        ssmlCounter.textContent = `${charCount} символов`;
      }
    }
    
    function insertSsmlTag(openTag, closeTag) {
      const textarea = ssmlInput;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      // Если тег не требует закрывающего тега (например, <break/>)
      if (!closeTag) {
        textarea.value = textarea.value.substring(0, start) + openTag + textarea.value.substring(end);
        textarea.selectionStart = start + openTag.length;
        textarea.selectionEnd = start + openTag.length;
      } else {
        textarea.value = textarea.value.substring(0, start) + openTag + selectedText + closeTag + textarea.value.substring(end);
        textarea.selectionStart = start + openTag.length;
        textarea.selectionEnd = start + openTag.length + selectedText.length;
      }
      
      textarea.focus();
      updateCharCounter();
    }
    
    async function loadTextFromFile() {
      try {
        // Используем Electron API для загрузки файла
        const result = await window.api.loadTextFromFile();
        
        if (result && result.content) {
          if (activeTab === 'text') {
            textInput.value = result.content;
          } else {
            // Проверяем, является ли текст SSML
            const content = result.content.trim();
            if (content.startsWith('<speak') && content.endsWith('</speak>')) {
              ssmlInput.value = content;
            } else {
              ssmlInput.value = `<speak>${content}</speak>`;
            }
          }
          updateCharCounter();
          showNotification(`Текст загружен из ${result.filePath}`, 'success');
        }
      } catch (error) {
        showNotification(`Ошибка при загрузке: ${error.message}`, 'error');
      }
    }
    
    // Инициализация счетчиков символов при загрузке
    updateCharCounter();
  
    function hideNotification() {
      notification.className = 'notification';
    }
  });