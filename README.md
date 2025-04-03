# Silero TTS App

Графический интерфейс для синтеза речи с использованием моделей [Silero TTS](https://github.com/snakers4/silero-models).

## Возможности

- Синтез речи с использованием различных голосов
- Поддержка SSML-разметки для управления интонацией и паузами
- Выбор частоты дискретизации аудио
- Сохранение результатов в формате WAV

## Технологии

- **Бэкенд**: Python, FastAPI, Silero TTS v4
- **Фронтенд**: Electron, JavaScript, HTML, CSS

## Установка и запуск

### Требования

- Python 3.8+
- Node.js 16+
- npm 8+

### Шаги установки

1. Клонировать репозиторий:
git clone https://github.com/yourusername/silero-tts-app.git
cd silero-tts-app


2. Установить зависимости для бэкенда:
cd backend
pip install -r requirements.txt
cd ..


3. Установить зависимости для фронтенда:
cd frontend
npm install
cd ..


4. Запуск приложения:
Запустить бэкенд-сервер
cd backend
python app.py

В отдельном терминале запустить фронтенд
cd frontend
npm start


## Использование SSML

Для более точного управления синтезом речи можно использовать SSML (Speech Synthesis Markup Language). Примеры:

```xml
<speak>
Привет! <break time='500ms'/> Это текст с <emphasis level='strong'>выделением</emphasis>.
<prosody rate='slow'>Это замедленная речь.</prosody>
<prosody pitch='high'>А это высокий голос.</prosody>
</speak>
Сборка исполняемого файла
Для создания исполняемого файла используйте:

cd frontend
npm run build
Лицензия
Этот проект распространяется под лицензией MIT. См. файл LICENSE для деталей.