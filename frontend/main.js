// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/main.js
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
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
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'build', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startPythonServer() {
  // Проверяем, работает ли сервер уже
  try {
    const response = await axios.get(API_ENDPOINTS.HEALTH);
    if (response.data.status === 'ok') {
      console.log('Python сервер уже запущен');
      return true;
    }
  } catch (error) {
    console.log('Python сервер не запущен, запускаем...');
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
    // Копируем аудиофайл из временной директории
    fs.copyFileSync(audioPath, result.filePath);
    return result.filePath;
  }
  
  return null;
});

// Обработчик события: открыть директорию
ipcMain.handle('open-directory', async (event, dirPath) => {
  shell.openPath(dirPath);
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