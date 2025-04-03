# Путь: /home/zverev/sandbox/Electron/silero-tts-app/backend/config.py
import os

# API настройки
API_HOST = os.environ.get('API_HOST', '0.0.0.0')
API_PORT = int(os.environ.get('API_PORT', 8000))

# TTS настройки
DEFAULT_LANGUAGE = 'ru'
DEFAULT_SPEAKER = 'xenia'
DEFAULT_SAMPLE_RATE = 48000

# Пути
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_audio')

# Создаем директории если их нет
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)