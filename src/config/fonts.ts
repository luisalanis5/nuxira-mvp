import { Inter, Playfair_Display, Roboto_Mono, Montserrat, Oswald, Quicksand, Lora, Fira_Code } from 'next/font/google';

export const fontInter = Inter({ subsets: ['latin'], display: 'swap' });
export const fontPlayfair = Playfair_Display({ subsets: ['latin'], display: 'swap' });
export const fontRobotoMono = Roboto_Mono({ subsets: ['latin'], display: 'swap' });
export const fontMontserrat = Montserrat({ subsets: ['latin'], display: 'swap' });
export const fontOswald = Oswald({ subsets: ['latin'], display: 'swap' });
export const fontQuicksand = Quicksand({ subsets: ['latin'], display: 'swap' });
export const fontLora = Lora({ subsets: ['latin'], display: 'swap' });
export const fontFiraCode = Fira_Code({ subsets: ['latin'], display: 'swap' });

export const FONT_MAP: Record<string, string> = {
    'Inter': fontInter.className,
    'Playfair Display': fontPlayfair.className,
    'Roboto Mono': fontRobotoMono.className,
    'Montserrat': fontMontserrat.className,
    'Oswald': fontOswald.className,
    'Quicksand': fontQuicksand.className,
    'Lora': fontLora.className,
    'Fira Code': fontFiraCode.className,
};

export const FONT_WHITELIST = Object.keys(FONT_MAP);
