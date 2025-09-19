// /public/js/i18n.js
import i18next from 'i18next';

i18next.init({
  lng: localStorage.getItem('lang') || 'ar',
  resources: {
    ar: { translation: await fetch('/locales/ar/common.json').then(r => r.json()) },
    en: { translation: await fetch('/locales/en/common.json').then(r => r.json()) }
  }
});

// In HTML: <span data-i18n="welcome"></span>
// In JS: i18next.t('save')

// Language switcher
document.getElementById('langSwitch').addEventListener('click', () => {
  const newLang = i18next.language === 'ar' ? 'en' : 'ar';
  i18next.changeLanguage(newLang);
  localStorage.setItem('lang', newLang);
  location.reload(); // or re-render dynamically
});