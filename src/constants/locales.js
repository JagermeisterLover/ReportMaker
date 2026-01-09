// Locale definitions for internationalization

export const availableLocales = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' }
];

// Translation strings
export const translations = {
    en: {
        settings: {
            title: 'Settings',
            colorTheme: 'Color Theme',
            language: 'Language',
            close: 'Close'
        }
    },
    ru: {
        settings: {
            title: 'Настройки',
            colorTheme: 'Цветовая тема',
            language: 'Язык',
            close: 'Закрыть'
        }
    }
};

export const getTranslations = (locale = 'en') => {
    return translations[locale] || translations.en;
};
