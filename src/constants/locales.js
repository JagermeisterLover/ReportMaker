// Locale definitions for internationalization
// This is a wireframe placeholder - expand with actual translations as needed

export const availableLocales = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
];

// Translation strings (placeholder structure)
// In a full implementation, you would have separate files for each locale
export const translations = {
    en: {
        settings: {
            title: 'Settings',
            colorTheme: 'Color Theme',
            language: 'Language',
            plotColorscale: 'Plot Colorscale',
            gridSize3D: '3D Grid Resolution',
            gridSize3DHelp: 'Resolution for 3D surface plots',
            gridSize2D: '2D Grid Resolution',
            gridSize2DHelp: 'Resolution for 2D contour plots',
            referenceWavelength: 'Reference Wavelength (nm)',
            wavelengthHelp: 'Wavelength for optical calculations',
            fastConvertThreshold: 'Fast Convert Threshold',
            fastConvertThresholdHelp: 'Maximum deviation for automatic conversion (mm)',
            points: 'points',
            close: 'Close'
        }
    }
    // Add additional locales as needed
};

export const getTranslations = (locale = 'en') => {
    return translations[locale] || translations.en;
};
