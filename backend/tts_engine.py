# Путь: /home/zverev/sandbox/Electron/silero-tts-app/backend/tts_engine.py 
# Заменяем содержимое на:
import os
import torch
import torchaudio
import time

class SileroTTSEngine:
    def __init__(self, model_dir="models", language="ru", speaker="xenia", sample_rate=48000):
        self.model_dir = model_dir
        self.language = language
        self.speaker = speaker
        self.device = torch.device("cpu")
        self.model = None
        self.sample_rate = sample_rate
        
        # Убедимся, что директория для моделей существует
        os.makedirs(model_dir, exist_ok=True)
        
        # Загрузим модель (скачает если нужно)
        self._load_model()
    
    def _load_model(self):
        """Загружает модель или скачивает, если её нет"""
        print(f"Загрузка модели Silero TTS v4 ({self.language}) на {self.device}...")
        
        # Путь к модели
        model_path = os.path.join(self.model_dir, f"v4_{self.language}.pt")
        
        # Скачиваем модель, если её нет
        if not os.path.isfile(model_path):
            print("Модель не найдена, скачиваю...")
            torch.hub.download_url_to_file(
                f'https://models.silero.ai/models/tts/{self.language}/v4_{self.language}.pt',
                model_path
            )
        
        # Загрузка модели
        self.model = torch.package.PackageImporter(model_path).load_pickle("tts_models", "model")
        self.model.to(self.device)
        
        print(f"Модель загружена успешно! Доступные спикеры: {self.model.speakers}")
    
    def get_available_speakers(self):
        """Возвращает список доступных голосов"""
        if self.model is None:
            self._load_model()
        return self.model.speakers
    
    def synthesize(self, text, speaker=None, output_path=None, sample_rate=None):
        """
        Синтезирует речь из текста
        
        Args:
            text (str): Текст для синтеза
            speaker (str, optional): Голос спикера (если не указан, используется по умолчанию)
            output_path (str, optional): Путь для сохранения файла (если не указан, возвращает аудио как массив)
            sample_rate (int, optional): Частота дискретизации (если не указана, используется значение по умолчанию)
            
        Returns:
            str or np.array: Путь к файлу или аудио данные
        """
        if self.model is None:
            self._load_model()
            
        speaker = speaker or self.speaker
        sr = sample_rate or self.sample_rate
        
        if speaker not in self.model.speakers:
            raise ValueError(f"Спикер {speaker} не найден. Доступные: {self.model.speakers}")
        
        # Засекаем время синтеза
        start_time = time.time()
        
        # Синтез речи
        with torch.no_grad():
            audio = self.model.apply_tts(
                text=text,
                speaker=speaker,
                sample_rate=sr
            )
        
        elapsed = time.time() - start_time
        audio_length = len(audio) / sr
        rtf = elapsed / audio_length if audio_length > 0 else 0
        
        print(f"Синтез завершен: длина аудио = {audio_length:.2f}с, время синтеза = {elapsed:.2f}с, RTF = {rtf:.2f}")
        
        # Если указан путь для сохранения
        if output_path:
            torchaudio.save(
                output_path,
                audio.unsqueeze(0),
                sample_rate=sr
            )
            return output_path
        
        # Иначе возвращаем аудио данные
        return audio.cpu().numpy()
    
    def synthesize_with_ssml(self, ssml_text, speaker=None, output_path=None, sample_rate=None):
        """
        Синтезирует речь из текста с SSML-разметкой
        
        Args:
            ssml_text (str): Текст с SSML-разметкой для синтеза
            speaker (str, optional): Голос спикера
            output_path (str, optional): Путь для сохранения
            sample_rate (int, optional): Частота дискретизации
            
        Returns:
            str or np.array: Путь к файлу или аудио данные
        """
        # Тут мы просто передаем SSML-текст напрямую в модель,
        # так как v4 поддерживает SSML из коробки
        return self.synthesize(ssml_text, speaker, output_path, sample_rate)