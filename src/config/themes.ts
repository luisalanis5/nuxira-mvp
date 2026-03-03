export type SkinName = 'default' | 'gotham' | 'burton' | 'minimalist' | 'neumorphism' | 'sunset' | 'glassmorphism_pro' | 'minimal_border' | 'cyber_glow';

export interface SkinConfig {
    id: SkinName;
    name: string;
    containerClass: string;
    cardClass: string;
    textClass: string;
    buttonClass: string;
    baseFont: string;
}

export const SKINS: Record<SkinName, SkinConfig> = {
    default: {
        id: 'default',
        name: 'Default (Glassmorphism)',
        containerClass: 'min-h-screen bg-[#0d0d12] text-white selection:bg-[#00FFCC] selection:text-black relative overflow-hidden',
        cardClass: 'bg-gray-900/50 backdrop-blur-sm border border-gray-800',
        textClass: 'text-white',
        buttonClass: 'rounded-xl shadow-lg',
        baseFont: 'font-sans'
    },
    gotham: {
        id: 'gotham',
        name: 'Gotham (Oscuro)',
        containerClass: 'min-h-screen bg-zinc-950 text-gray-200 selection:bg-purple-600 selection:text-white relative overflow-hidden',
        cardClass: 'bg-zinc-900/80 border border-zinc-800 shadow-[0_0_15px_rgba(123,97,255,0.15)] rounded-2xl',
        textClass: 'text-gray-100 font-black',
        buttonClass: 'rounded-sm border border-purple-500/50 shadow-[0_0_20px_rgba(123,97,255,0.4)]',
        baseFont: 'font-sans'
    },
    burton: {
        id: 'burton',
        name: 'Burton (Tim Burton Style)',
        containerClass: 'min-h-screen bg-stone-100 text-black selection:bg-stone-300 selection:text-black relative overflow-hidden',
        cardClass: 'bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] rounded-2xl',
        textClass: 'text-stone-900',
        buttonClass: 'rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]',
        baseFont: 'font-serif'
    },
    minimalist: {
        id: 'minimalist',
        name: 'Minimalist (Limpio)',
        containerClass: 'min-h-screen bg-white text-black selection:bg-black selection:text-white relative overflow-hidden',
        cardClass: 'bg-white border border-gray-200 shadow-sm rounded-2xl',
        textClass: 'text-gray-900',
        buttonClass: 'rounded-full border border-gray-200 hover:bg-gray-50',
        baseFont: 'font-sans'
    },
    neumorphism: {
        id: 'neumorphism',
        name: 'Neumorphism (3D Suave)',
        containerClass: 'min-h-screen bg-[#E0E5EC] text-gray-700 selection:bg-purple-300 selection:text-black relative overflow-hidden',
        cardClass: 'bg-[#E0E5EC] rounded-2xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none',
        textClass: 'text-gray-800',
        buttonClass: 'rounded-2xl shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] border-none',
        baseFont: 'font-sans'
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset (Gradiente Cálido)',
        containerClass: 'min-h-screen bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600 text-white selection:bg-white selection:text-orange-500 relative overflow-hidden',
        cardClass: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl',
        textClass: 'text-white',
        buttonClass: 'rounded-xl bg-white/20 hover:bg-white/30 border border-white/30',
        baseFont: 'font-sans'
    },
    glassmorphism_pro: {
        id: 'glassmorphism_pro',
        name: 'Glassmorphism Pro',
        containerClass: 'min-h-screen bg-gray-900 text-white selection:bg-white selection:text-black relative overflow-hidden',
        cardClass: 'bg-white/5 backdrop-blur-[12px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl',
        textClass: 'text-white',
        buttonClass: 'rounded-2xl border border-white/20 hover:bg-white/10 transition-colors bg-white/5 backdrop-blur-[12px]',
        baseFont: 'font-sans'
    },
    minimal_border: {
        id: 'minimal_border',
        name: 'Minimal Border',
        containerClass: 'min-h-screen bg-transparent text-inherit selection:bg-black selection:text-white relative overflow-hidden',
        cardClass: 'bg-transparent border-2 border-inherit rounded-none',
        textClass: 'text-inherit font-sans',
        buttonClass: 'rounded-none border-2 border-inherit hover:bg-black/5 transition-colors',
        baseFont: 'font-sans'
    },
    cyber_glow: {
        id: 'cyber_glow',
        name: 'Cyber Glow',
        containerClass: 'min-h-screen bg-black text-white selection:bg-cyan-400 selection:text-black relative overflow-hidden',
        cardClass: 'bg-black border border-gray-800 rounded-lg shadow-none',
        textClass: 'text-white font-mono',
        buttonClass: 'rounded-none border border-gray-700 hover:bg-gray-900',
        baseFont: 'font-mono'
    }
};

export const getSkin = (skinId?: SkinName): SkinConfig => {
    return SKINS[skinId || 'default'] || SKINS['default'];
};
