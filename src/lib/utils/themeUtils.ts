import { getLuminance } from 'polished';

export function getContrastText(hexColor: string): string {
    try {
        return getLuminance(hexColor) > 0.4 ? '#111827' : '#FFFFFF';
    } catch { return '#FFFFFF'; }
}

export function getContrastYIQ(hexcolor: string): string {
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
