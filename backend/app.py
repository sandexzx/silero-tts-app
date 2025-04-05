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
        output_path = os.path.join(output_dir, filename)
        
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
        output_path = os.path.join(output_dir, filename)
        
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
        
        # Возвращаем путь к файлу для использования в Electron
        return {"filename": filename, "path": output_path}
    except Exception as e:
        # Добавляем логирование для отладки
        import traceback
        print(f"Ошибка в synthesize_text: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Получить аудиофайл по имени"""
    file_path = os.path.join(output_dir, filename)
    print(f"Запрос аудиофайла: {filename}, полный путь: {file_path}")
    if not os.path.exists(file_path):
        print(f"Файл не найден: {file_path}")
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path, media_type="audio/wav")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)