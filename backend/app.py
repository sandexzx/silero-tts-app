# backend/app.py
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import uvicorn
from tts_engine import SileroTTSEngine

app = FastAPI(title="Silero TTS API", description="API для синтеза речи с использованием Silero TTS")

# Добавляем CORS, чтобы Electron мог обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене лучше ограничить конкретным доменом
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализируем движок синтеза речи
tts_engine = SileroTTSEngine(model_dir="models", language="ru", speaker="xenia")

# Папка для временных аудиофайлов
output_dir = "temp_audio"
os.makedirs(output_dir, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    speaker: str = "xenia"
    sample_rate: int = 48000
    use_ssml: bool = False

class SpeakerListResponse(BaseModel):
    speakers: list

@app.get("/health")
def health_check():
    """Проверка работоспособности API"""
    return {"status": "ok"}

@app.get("/speakers", response_model=SpeakerListResponse)
def get_speakers():
    """Получить список доступных голосов"""
    speakers = tts_engine.get_available_speakers()
    return {"speakers": speakers}

@app.post("/synthesize")
async def synthesize(request: TTSRequest):
    """Синтезировать речь из текста и вернуть аудиофайл"""
    try:
        # Генерируем уникальное имя файла
        filename = f"{uuid.uuid4()}.wav"
        # Нормализуем путь для Windows
        output_path = os.path.abspath(os.path.join(output_dir, filename))
        if os.name == 'nt':  # Проверка на Windows
            output_path = output_path.replace('\\', '/')
        
        # Синтезируем речь
        if request.use_ssml:
            tts_engine.synthesize_with_ssml(
                request.text,
                speaker=request.speaker,
                output_path=output_path,
                sample_rate=request.sample_rate
            )
        else:
            tts_engine.synthesize(
                request.text,
                speaker=request.speaker,
                output_path=output_path,
                sample_rate=request.sample_rate
            )
        
        # Возвращаем аудиофайл
        return FileResponse(
            output_path,
            media_type="audio/wav",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/synthesize_text")
async def synthesize_text(request: TTSRequest):
    """Синтезировать речь из текста и вернуть JSON с путем к файлу"""
    try:
        # Генерируем уникальное имя файла
        filename = f"{uuid.uuid4()}.wav"
        
        # Используем абсолютный путь и нормализуем слэши
        output_path = os.path.abspath(os.path.join(output_dir, filename))
        
        # Синтезируем речь
        if request.use_ssml:
            tts_engine.synthesize_with_ssml(
                request.text,
                speaker=request.speaker,
                output_path=output_path,
                sample_rate=request.sample_rate
            )
        else:
            tts_engine.synthesize(
                request.text,
                speaker=request.speaker,
                output_path=output_path,
                sample_rate=request.sample_rate
            )
        
        # Проверим, создан ли файл
        if not os.path.exists(output_path):
            raise FileNotFoundError(f"Файл не был создан: {output_path}")
            
        # Возвращаем имя файла и относительный путь
        relative_path = os.path.join(output_dir, filename)
        return {"filename": filename, "path": relative_path}
    except Exception as e:
        import traceback
        print(f"Ошибка в synthesize_text: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Получить аудиофайл по имени"""
    # Используем только имя файла без пути
    # Нормализуем путь правильно для любой ОС
    file_path = os.path.normpath(os.path.abspath(os.path.join(output_dir, filename)))
    # Добавим лог
    print(f"Запрос аудиофайла: {filename}")
    print(f"Полный путь к файлу: {file_path}")
    print(f"Директория существует: {os.path.exists(output_dir)}")
    print(f"Запрос аудиофайла: {filename}, полный путь: {file_path}")
    
    # Проверка на существование файла и его доступность
    try:
        if not os.path.exists(file_path):
            print(f"Файл не найден: {file_path}")
            raise HTTPException(status_code=404, detail="Файл не найден")
        
        # Пробуем открыть файл для чтения, чтобы убедиться в доступности
        with open(file_path, 'rb') as f:
            # Просто проверяем, что можем прочитать первые байты
            f.read(10)
            f.seek(0)
        
        # Используем стандартный путь, без нормализации
        return FileResponse(
            path=file_path, 
            media_type="audio/wav",
            filename=filename
        )
    except PermissionError:
        raise HTTPException(status_code=500, detail=f"Ошибка доступа к файлу: недостаточно прав")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка доступа к файлу: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)