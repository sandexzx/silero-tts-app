class ThemeManager {
    constructor() {
      this.themeSwitch = document.getElementById('theme-switch');
      this.themeLabel = document.getElementById('theme-label');
      this.themes = window.api.THEMES || { LIGHT: 'light', DARK: 'dark' };
      this.defaultTheme = window.api.DEFAULT_THEME || 'light';
      
      // Инициализация
      this.init();
    }
    
    init() {
      // Загружаем сохраненную тему или используем тему по умолчанию
      const savedTheme = localStorage.getItem('theme') || this.defaultTheme;
      this.applyTheme(savedTheme);
      
      // Устанавливаем состояние переключателя в соответствии с темой
      this.themeSwitch.checked = savedTheme === this.themes.DARK;
      
      // Обработчик события изменения переключателя
      this.themeSwitch.addEventListener('change', () => {
        const newTheme = this.themeSwitch.checked ? this.themes.DARK : this.themes.LIGHT;
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
    
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      this.themeLabel.textContent = theme === this.themes.DARK ? 'Тёмная' : 'Светлая';
    }
  }
  
  // Инициализация менеджера темы после загрузки DOM
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });