// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/main.js
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();
const { isDev, API_URL, API_ENDPOINTS } = require('../shared/constants');

process.env.DISABLE_VULKAN = '1';
process.env.DISABLE_GPU = '1';
process.env.ELECTRON_DISABLE_GPU = '1';
process.env.ELECTRON_NO_ASAR = '1'; // Помогает с некоторыми проблемами доступа к файлам

// Перехватываем консольные сообщения для фильтрации ошибок Vulkan
const originalConsoleError = console.error;
console.error = function() {
  // Фильтруем сообщения, связанные с Vulkan, ELFCLASS32 и ICD
  const message = Array.prototype.join.call(arguments, ' ');
  if (!message.includes('Vulkan') && 
      !message.includes('ELFCLASS32') && 
      !message.includes('ICD') &&
      !message.includes('libvulkan')) {
    originalConsoleError.apply(console, arguments);
  }
};

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
ipcMain.handle('save-audio-file', async (event, filename) => {
  console.log(`Вызов save-audio-file с параметром: ${filename}`);
  
  // Строим путь к файлу
  let srcPath;
  if (path.isAbsolute(filename)) {
    srcPath = filename;
  } else {
    // Ищем файл в различных возможных местах
    const possiblePaths = [
      path.join(__dirname, '..', 'backend', 'temp_audio', path.basename(filename)),
      path.join(require('../shared/constants').TEMP_AUDIO_DIR, path.basename(filename))
    ];
    
    for (const p of possiblePaths) {
      console.log(`Проверяем наличие файла: ${p}`);
      if (fs.existsSync(p)) {
        srcPath = p;
        console.log(`Файл найден по пути: ${srcPath}`);
        break;
      }
    }
    
    if (!srcPath) {
      console.error(`Не удалось найти файл: ${filename}`);
      throw new Error(`Файл не найден: ${filename}`);
    }
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Сохранить аудиофайл',
    defaultPath: path.join(app.getPath('downloads'), path.basename(srcPath) || 'audio.wav'),
    filters: [
      { name: 'Аудиофайлы', extensions: ['wav', 'mp3'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    console.log(`Копирую файл из ${srcPath} в ${result.filePath}`);
    fs.copyFileSync(srcPath, result.filePath);
    return result.filePath;
  }
  
  return null;
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

// Отключаем аппаратное ускорение и устанавливаем другие флаги для предотвращения проблем с Vulkan
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-webgl');
app.commandLine.appendSwitch('disable-vulkan');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-accelerated-video-decode');
app.commandLine.appendSwitch('disable-gpu-memory-buffer-video-frames');
app.commandLine.appendSwitch('use-gl', 'swiftshader');

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

// Обработка ошибок, связанных с GPU
app.on('render-process-gone', (event, webContents, details) => {
  console.log('Render процесс ушёл:', details.reason);
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