class ThemeManager {
  constructor() {
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.sunIcon = document.querySelector('.sun-icon');
    this.moonIcon = document.querySelector('.moon-icon');
    this.themes = window.api.THEMES || { LIGHT: 'light', DARK: 'dark' };
    this.defaultTheme = window.api.DEFAULT_THEME || 'dark';
    
    // Инициализация
    this.init();
  }
  
  init() {
    // Проверяем, есть ли сохраненная тема
    const savedTheme = localStorage.getItem('theme');
    
    // Если нет сохраненной темы, применяем дефолтную
    if (!savedTheme) {
      this.applyTheme(this.defaultTheme);
      localStorage.setItem('theme', this.defaultTheme);
    } else {
      this.applyTheme(savedTheme);
    }
    
    // Обработчик события клика по кнопке
    this.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK;
      
      this.animateThemeChange(currentTheme, newTheme);
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
    
    // Убираем анимацию при начальной загрузке
    setTimeout(() => {
      this.sunIcon.style.transition = 'all 0.3s ease';
      this.moonIcon.style.transition = 'all 0.3s ease';
    }, 100);
  }
  
  animateThemeChange(oldTheme, newTheme) {
    // Добавляем классы для анимации
    if (newTheme === this.themes.DARK) {
      this.sunIcon.classList.add('inactive-icon');
      this.moonIcon.classList.add('active-icon');
    } else {
      this.sunIcon.classList.add('active-icon');
      this.moonIcon.classList.add('inactive-icon');
    }
    
    // Удаляем классы после завершения анимации
    setTimeout(() => {
      this.sunIcon.classList.remove('active-icon', 'inactive-icon');
      this.moonIcon.classList.remove('active-icon', 'inactive-icon');
    }, 500);
  }
  
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Инициализация менеджера темы после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});