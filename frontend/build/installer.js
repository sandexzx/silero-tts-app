// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/build/installer.js
const { MSICreator } = require('electron-wix-msi');
const path = require('path');

// Пути для сборки
const APP_DIR = path.resolve(__dirname, '../dist/win-unpacked');
const OUT_DIR = path.resolve(__dirname, '../dist/installer');

// Конфигурация для инсталлятора
const msiCreator = new MSICreator({
  appDirectory: APP_DIR,
  outputDirectory: OUT_DIR,
  description: 'Silero TTS Application',
  exe: 'silero-tts-app',
  name: 'Silero TTS App',
  manufacturer: 'Your Company',
  version: '1.0.0',
  ui: {
    chooseDirectory: true
  }
});

// Создаем и компилируем инсталлятор
async function createInstaller() {
  try {
    await msiCreator.create();
    await msiCreator.compile();
    console.log('MSI installer created successfully!');
  } catch (error) {
    console.error('Error creating MSI installer:', error);
  }
}

createInstaller();