// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/renderer/scripts/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const speakerSelect = document.getElementById('speaker-select');
    const sampleRateSelect = document.getElementById('sample-rate-select');
    const ssmlToggle = document.getElementById('ssml-toggle');
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
  
    // Состояние приложения
    let isServerOnline = false;
    let isProcessing = false;
    let activeTab = 'text'; // 'text' или 'ssml'
  
    // Инициализация
    init();
  
    async function init() {
      await checkServerStatus();
      if (isServerOnline) {
        await loadSpeakers();
      }
      
      // Устанавливаем обработчики событий
      setupEventListeners();
      
      // Периодически проверяем статус сервера
      setInterval(checkServerStatus, 10000);
    }
  
    async function checkServerStatus() {
      isServerOnline = await apiClient.checkServerStatus();
      updateServerStatus();
    }
  
    function updateServerStatus() {
      if (isServerOnline) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.textContent = 'Сервер активен';
        synthesizeBtn.disabled = false;
      } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.textContent = 'Сервер недоступен';
        synthesizeBtn.disabled = true;
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
      
      // Включение/выключение SSML
      ssmlToggle.addEventListener('change', handleSsmlToggle);
      
      // Кнопки действий
      synthesizeBtn.addEventListener('click', handleSynthesize);
      clearBtn.addEventListener('click', handleClear);
      saveBtn.addEventListener('click', handleSave);
      resetBtn.addEventListener('click', handleReset);
      
      // Закрытие уведомления
      notificationClose.addEventListener('click', hideNotification);
    }
  
    function switchTab(tabName) {
      activeTab = tabName;
      
      if (tabName === 'text') {
        tabText.classList.add('active');
        tabSsml.classList.remove('active');
        textEditor.classList.remove('hidden');
        ssmlEditor.classList.add('hidden');
        ssmlToggle.checked = false;
      } else {
        tabText.classList.remove('active');
        tabSsml.classList.add('active');
        textEditor.classList.add('hidden');
        ssmlEditor.classList.remove('hidden');
        ssmlToggle.checked = true;
      }
    }
  
    function handleSsmlToggle() {
      if (ssmlToggle.checked) {
        switchTab('ssml');
      } else {
        switchTab('text');
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
        audioPlayer.setAudioSource(apiClient.getAudioUrl(result.filename));
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
  
    function hideNotification() {
      notification.className = 'notification';
    }
  });