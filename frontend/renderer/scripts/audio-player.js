// Путь: /home/zverev/sandbox/Electron/silero-tts-app/frontend/renderer/scripts/audio-player.js
class AudioPlayer {
    constructor() {
      this.player = document.getElementById('audio-player');
    }
  
    setAudioSource(src) {
      this.player.src = src;
      this.player.load();
    }
  
    play() {
      this.player.play();
    }
  
    pause() {
      this.player.pause();
    }
  
    stop() {
      this.player.pause();
      this.player.currentTime = 0;
    }
  
    reset() {
      this.player.src = '';
    }
  }
  
  // Создаем глобальный экземпляр аудиоплеера
  const audioPlayer = new AudioPlayer();