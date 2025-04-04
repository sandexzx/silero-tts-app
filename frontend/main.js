// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/main.js
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();
const { isDev, API_URL, API_ENDPOINTS } = require('../shared/constants');

let mainWindow;
let pythonProcess = null;

// Флаг, указывающий, запускается ли Python-сервер автоматически
const autoStartPythonServer = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'build', 'icon.png')
  });

  mainWindow.maximize();

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startPythonServer() {
  console.log("Пытаюсь проверить сервер по адресу:", API_ENDPOINTS.HEALTH);
  
  try {
    const response = await axios.get(API_ENDPOINTS.HEALTH, { timeout: 2000 });
    console.log("Ответ сервера:", response.data);
    if (response.data.status === 'ok') {
      console.log('Python сервер уже запущен');
      return true;
    }
  } catch (error) {
    console.error('Ошибка при проверке сервера:', error.message);
  }

  // Определяем путь к Python-скрипту
  const scriptPath = path.join(__dirname, '..', 'backend', 'app.py');
  
  // Запускаем Python-сервер
  pythonProcess = spawn('python', [scriptPath], {
    stdio: 'pipe'
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
  });

  // Ждем, пока сервер запустится
  let attempts = 0;
  while (attempts < 30) {
    try {
      const response = await axios.get(API_ENDPOINTS.HEALTH);
      if (response.data.status === 'ok') {
        console.log('Python сервер успешно запущен');
        return true;
      }
    } catch (error) {
      // Ждем 1 секунду перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  console.error('Не удалось запустить Python сервер');
  return false;
}

// Обработчик события: сохранить аудиофайл
ipcMain.handle('save-audio-file', async (event, audioPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Сохранить аудиофайл',
    defaultPath: path.join(app.getPath('downloads'), 'audio.wav'),
    filters: [
      { name: 'Аудиофайлы', extensions: ['wav', 'mp3'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    // Проверяем путь - абсолютный или относительный
    let srcPath = audioPath;
    if (!path.isAbsolute(audioPath)) {
      // Проверяем есть ли файл в бэкенде
      const backendPath = path.join(__dirname, '..', 'backend', 'temp_audio', path.basename(audioPath));
      if (fs.existsSync(backendPath)) {
        srcPath = backendPath;
      } else {
        // Если нет в бэкенде, используем стандартный путь из констант
        srcPath = path.join(require('../shared/constants').TEMP_AUDIO_DIR, path.basename(audioPath));
      }
    }
    
    // Логируем для отладки
    console.log(`Копирую файл из ${srcPath} в ${result.filePath}`);
    
    // Проверяем существование исходного файла
    if (!fs.existsSync(srcPath)) {
      console.error(`Аудиофайл не найден: ${srcPath}`);
      throw new Error(`Аудиофайл не найден по пути: ${srcPath}`);
    }
    
    // Копируем файл
    fs.copyFileSync(srcPath, result.filePath);
    return result.filePath;
  }
  
  return null;
});

// Обработчик события: сохранить текстовый файл
ipcMain.handle('save-text-file', async (event, { content, defaultFilename }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Сохранить текст',
    defaultPath: path.join(app.getPath('documents'), defaultFilename || 'text.txt'),
    filters: [
      { name: 'Текстовые файлы', extensions: ['txt', 'xml'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, filePath: result.filePath };
  }
  
  return { success: false };
});

// Обработчик события: загрузить текстовый файл
ipcMain.handle('load-text-file', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Открыть текстовый файл',
    properties: ['openFile'],
    filters: [
      { name: 'Текстовые файлы', extensions: ['txt', 'xml'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, filePath, content };
  }
  
  return { success: false };
});

// Обработчик события: открыть директорию
ipcMain.handle('open-directory', async (event, dirPath) => {
  shell.openPath(dirPath);
});

// Добавь перед app.whenReady()
// Обработчик события: выбрать директорию для сохранения
ipcMain.handle('select-save-directory', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выбрать директорию для сохранения',
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const dirPath = result.filePaths[0];
    // Сохраняем выбранную директорию
    store.set('save-directory', dirPath);
    return { success: true, path: dirPath };
  }
  
  return { success: false };
});

// Обработчик события: получить путь к директории для сохранения
ipcMain.handle('get-save-directory', async (event) => {
  const dirPath = store.get('save-directory', '');
  return { path: dirPath };
});

// Обработчик события: сохранить аудиофайл в выбранную директорию
ipcMain.handle('save-audio-to-directory', async (event, { audioPath, directoryPath }) => {
  try {
    // Проверяем, передан ли путь к директории
    if (!directoryPath) {
      throw new Error('Путь к директории не задан');
    }

    // Проверяем существование директории
    if (!fs.existsSync(directoryPath)) {
      throw new Error(`Директория не существует: ${directoryPath}`);
    }

    // Формируем имя файла на основе текущей даты и времени
    const now = new Date();
    const filename = now.toISOString().replace(/:/g, '-').replace(/\..+/, '') + '.wav';
    const destPath = path.join(directoryPath, filename);

    // Проверяем путь - абсолютный или относительный
    let srcPath = audioPath;
    if (!path.isAbsolute(audioPath)) {
      // Проверяем есть ли файл в бэкенде
      const backendPath = path.join(__dirname, '..', 'backend', 'temp_audio', path.basename(audioPath));
      if (fs.existsSync(backendPath)) {
        srcPath = backendPath;
      } else {
        // Если нет в бэкенде, используем стандартный путь из констант
        srcPath = path.join(require('../shared/constants').TEMP_AUDIO_DIR, path.basename(audioPath));
      }
    }
    
    // Проверяем существование исходного файла
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Аудиофайл не найден: ${srcPath}`);
    }
    
    // Копируем файл
    fs.copyFileSync(srcPath, destPath);
    return { success: true, path: destPath };
  } catch (error) {
    console.error('Ошибка при сохранении в директорию:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(async () => {
  if (autoStartPythonServer) {
    await startPythonServer();
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Останавливаем Python-сервер при выходе из приложения
  if (pythonProcess) {
    pythonProcess.kill();
  }
});