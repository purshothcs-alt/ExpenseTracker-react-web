import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    ta: { translation: taTranslation },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function setLanguage(lang: string): void {
  void i18n.changeLanguage(lang);
}

export default i18n;
