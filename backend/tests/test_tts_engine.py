# Путь: /home/zverev/sandbox/Electron/silero-tts-app/backend/tests/test_tts_engine.py
import os
import unittest
import numpy as np
import sys
import time

# Добавляем родительскую директорию в путь для импорта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tts_engine import SileroTTSEngine

class TestSileroTTSEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SileroTTSEngine()
    
    def test_model_loading(self):
        """Проверяем, что модель загружается успешно"""
        self.assertIsNotNone(self.engine.model)
    
    def test_speakers(self):
        """Проверяем, что доступны голоса"""
        speakers = self.engine.get_available_speakers()
        self.assertTrue(len(speakers) > 0)
        print(f"Доступные голоса: {speakers}")
    
    def test_synthesis(self):
        """Проверяем синтез речи"""
        text = "Привет, это тест синтеза речи!"
        start_time = time.time()
        audio_data = self.engine.synthesize(text)
        elapsed = time.time() - start_time
        
        # Проверяем, что результат - это непустой массив
        self.assertIsInstance(audio_data, np.ndarray)
        self.assertGreater(len(audio_data), 0)
        print(f"Синтез завершен за {elapsed:.2f} секунд, размер аудио: {len(audio_data)}")
    
    def test_save_audio(self):
        """Проверяем сохранение в файл"""
        text = "Это тест сохранения аудио."
        output_path = "test_output.wav"
        
        try:
            start_time = time.time()
            result_path = self.engine.synthesize(text, output_path=output_path)
            elapsed = time.time() - start_time
            
            self.assertEqual(result_path, output_path)
            self.assertTrue(os.path.exists(output_path))
            self.assertGreater(os.path.getsize(output_path), 0)
            print(f"Сохранение завершено за {elapsed:.2f} секунд, размер файла: {os.path.getsize(output_path)} байт")
        finally:
            # Чистим за собой
            if os.path.exists(output_path):
                os.remove(output_path)
    
    def test_ssml(self):
        """Проверяем поддержку SSML"""
        ssml_text = "<speak>Привет! <break time='500ms'/> Это <emphasis level='strong'>SSML</emphasis> разметка!</speak>"
        output_path = "test_ssml_output.wav"
        
        try:
            start_time = time.time()
            result_path = self.engine.synthesize_with_ssml(ssml_text, output_path=output_path)
            elapsed = time.time() - start_time
            
            self.assertEqual(result_path, output_path)
            self.assertTrue(os.path.exists(output_path))
            self.assertGreater(os.path.getsize(output_path), 0)
            print(f"SSML синтез завершен за {elapsed:.2f} секунд, размер файла: {os.path.getsize(output_path)} байт")
        finally:
            # Чистим за собой
            if os.path.exists(output_path):
                os.remove(output_path)

if __name__ == "__main__":
    unittest.main()