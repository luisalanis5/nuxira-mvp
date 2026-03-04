import { getLuminance } from 'polished';
import chroma from 'chroma-js';

export function getContrastText(hexColor: string): string {
    try {
        return getLuminance(hexColor) > 0.4 ? '#111827' : '#FFFFFF';
    } catch { return '#FFFFFF'; }
}

export function getContrastYIQ(hexcolor: string): string {
    return getTextColorForBackground(hexcolor);
}

export function getTextColorForBackground(hexcolor: string): string {
    try {
        const hex = hexcolor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? 'text-gray-900' : 'text-white';
    } catch {
        return 'text-white';
    }
}

export function getSafeTextColor(backgroundColor: string): string {
    try {
        const bg = chroma(backgroundColor || '#000000');
        return chroma.contrast(bg, 'white') >= 4.5 ? '#FFFFFF' : '#111827';
    } catch {
        return '#FFFFFF';
    }
}

export function getSafeThemeTokens(baseColor: string, accentColor: string) {
    try {
        const bg = chroma(baseColor || '#1f2937');
        const isLight = bg.luminance() > 0.5;

        return {
            moduleBg: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
            textColor: isLight ? '#111827' : '#FFFFFF',
            accentColor: accentColor || '#3b82f6'
        };
    } catch {
        return {
            moduleBg: 'rgba(0, 0, 0, 0.4)',
            textColor: '#FFFFFF',
            accentColor: '#3b82f6'
        };
    }
}

export function generatePalette(primaryColor: string) {
    try {
        const base = chroma(primaryColor || '#00FFCC');

        // colorFondoModulo: Una versión con transparencia del color de tema (ej. alpha 0.4)
        const backgroundColor = base.alpha(0.4).css();

        // colorTexto: Blanco o Negro puro basado en contraste WCAG real
        const textColor = chroma.contrast(base, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#000000';

        return {
            backgroundColor,
            textColor,
            buttonColor: base.hex(),
            accentColor: base.hex()
        };
    } catch {
        return {
            backgroundColor: 'rgba(31, 41, 55, 0.4)',
            textColor: '#FFFFFF',
            buttonColor: '#00FFCC',
            accentColor: '#00FFCC'
        };
    }
}

export function calculateModuleBg(baseThemeColor: string, hasBackgroundImage: boolean): string {
    try {
        if (hasBackgroundImage) {
            return 'rgba(0, 0, 0, 0.55)';
        }

        const base = chroma(baseThemeColor || '#1f2937');
        // Si el fondo principal es oscuro, lo aclaramos. Si es claro, lo oscurecemos.
        return base.luminance() < 0.5 ? base.brighten(0.6).hex() : base.darken(0.6).hex();
    } catch {
        return 'rgba(31, 41, 55, 0.9)';
    }
}

export function getUnifiedModuleStyles(theme: any, isMediaOrAd: boolean = false) {
    const primaryColor = theme?.primaryColor || '#00FFCC';
    const hasImage = !!theme?.backgroundImage || !!theme?.videoBgUrl || !!theme?.audioBgUrl;
    const activeSkinId = theme?.activeSkin || 'default';
    const usesSkinCard = activeSkinId !== 'default';

    // Fallback safe text for global scope
    const globalTextColor = getSafeTextColor(primaryColor);
    const isDarkPrimary = globalTextColor === '#FFFFFF';

    let dynamicBoxShadow = hasImage ? 'none' : `0 0 20px ${chroma(primaryColor).alpha(0.25).css()}`;
    let dynamicBorder = hasImage ? '1px solid rgba(255,255,255,0.1)' : 'none';
    let dynamicBg = isMediaOrAd ? 'transparent' : calculateModuleBg(primaryColor, hasImage);
    let localSafeTextColor = isMediaOrAd ? globalTextColor : getSafeTextColor(dynamicBg);

    if (usesSkinCard) {
        // OVERRIDE: Si hay imagen, la única forma de garantizar legibilidad en Custom Skins 
        // es forzar un overlay oscuro y texto blanco con la clase backdrop-blur
        dynamicBg = hasImage ? 'rgba(0,0,0,0.5)' : 'transparent';
        dynamicBoxShadow = 'none';
        dynamicBorder = 'none';
        localSafeTextColor = hasImage ? '#FFFFFF' : globalTextColor;

        if (activeSkinId === 'cyber_glow') {
            dynamicBoxShadow = `0 0 20px ${chroma(primaryColor).alpha(0.6).css()}`;
            dynamicBg = '#000000';
            localSafeTextColor = '#FFFFFF';
        } else if (activeSkinId === 'minimal_border') {
            dynamicBorder = `2px solid ${primaryColor}`;
        }
    }

    if (isMediaOrAd) {
        dynamicBorder = `1px solid ${chroma(globalTextColor).alpha(0.2).css()}`;
    }

    return {
        backgroundColor: dynamicBg,
        boxShadow: dynamicBoxShadow,
        border: dynamicBorder,
        color: localSafeTextColor,
        usesSkinCard,
        hasImage,
        activeSkinId
    };
}
