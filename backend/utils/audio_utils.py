# Путь: /home/zverev/sandbox/Electron/silero-tts-app/backend/utils/audio_utils.py
import os
import numpy as np
import torchaudio
import torch
from pydub import AudioSegment
from scipy.io import wavfile

def resample_audio(audio_path, target_sr=48000):
    """
    Изменяет частоту дискретизации аудиофайла
    
    Args:
        audio_path (str): Путь к исходному аудиофайлу
        target_sr (int): Целевая частота дискретизации
        
    Returns:
        numpy.ndarray: Ресемплированные аудиоданные
    """
    waveform, sample_rate = torchaudio.load(audio_path)
    if sample_rate != target_sr:
        resampler = torchaudio.transforms.Resample(sample_rate, target_sr)
        waveform = resampler(waveform)
    return waveform.numpy()[0]

def save_as_mp3(wav_path, mp3_path=None, bitrate="192k"):
    """
    Конвертирует WAV файл в MP3
    
    Args:
        wav_path (str): Путь к WAV файлу
        mp3_path (str, optional): Путь для сохранения MP3 (если не указан, заменяет расширение)
        bitrate (str, optional): Битрейт для MP3
        
    Returns:
        str: Путь к MP3 файлу
    """
    if mp3_path is None:
        mp3_path = os.path.splitext(wav_path)[0] + '.mp3'
    
    audio = AudioSegment.from_wav(wav_path)
    audio.export(mp3_path, format="mp3", bitrate=bitrate)
    return mp3_path

def normalize_audio(waveform, target_db=-3.0):
    """
    Нормализует громкость аудио
    
    Args:
        waveform (numpy.ndarray): Аудиоданные
        target_db (float): Целевой уровень громкости в dB
        
    Returns:
        numpy.ndarray: Нормализованные аудиоданные
    """
    # Вычисляем текущий RMS (корень из среднего квадрата)
    rms = np.sqrt(np.mean(np.square(waveform)))
    if rms > 0:
        # Целевой RMS (из dB)
        target_rms = 10 ** (target_db / 20.0)
        # Коэффициент усиления
        gain = target_rms / rms
        # Применяем усиление
        return waveform * gain
    return waveform

def concat_audio_files(file_paths, output_path):
    """
    Объединяет несколько аудиофайлов в один
    
    Args:
        file_paths (list): Список путей к аудиофайлам
        output_path (str): Путь для сохранения результата
        
    Returns:
        str: Путь к объединенному файлу
    """
    combined = AudioSegment.empty()
    for file_path in file_paths:
        sound = AudioSegment.from_file(file_path)
        combined += sound
    
    combined.export(output_path, format="wav")
    return output_path