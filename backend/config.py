# Путь: /home/zverev/sandbox/Electron/silero-tts-app/backend/config.py
import os

# API настройки
API_HOST = os.environ.get('API_HOST', '0.0.0.0')
API_PORT = int(os.environ.get('API_PORT', 8000))

# TTS настройки
DEFAULT_LANGUAGE = 'ru'
DEFAULT_SPEAKER = 'xenia'
DEFAULT_SAMPLE_RATE = 48000

# Проверка и нормализация путей для Windows
def normalize_path(path):
    # Нормализуем слеши в соответствии с ОС
    normalized = os.path.normpath(path)
    # Проверяем доступность и существование директории
    dir_path = os.path.dirname(normalized)
    if not os.path.exists(dir_path):
        try:
            os.makedirs(dir_path, exist_ok=True)
            print(f"Создана директория: {dir_path}")
        except Exception as e:
            print(f"Ошибка создания директории {dir_path}: {str(e)}")
    return normalized

# Определение директорий с учетом особенностей Windows
MODEL_DIR = normalize_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models'))
OUTPUT_DIR = normalize_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_audio'))