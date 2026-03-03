import { Inter, Roboto, Oswald, Playfair_Display, Montserrat, Lora, Quicksand, Fira_Code } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap' });
const lora = Lora({ subsets: ['latin'], display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin'], display: 'swap' });
const firaCode = Fira_Code({ subsets: ['latin'], display: 'swap' });

export const fontDictionary: Record<string, { className: string }> = {
    'Inter': { className: inter.className },
    'Roboto': { className: roboto.className },
    'Oswald': { className: oswald.className },
    'Playfair Display': { className: playfair.className },
    'Montserrat': { className: montserrat.className },
    'Lora': { className: lora.className },
    'Quicksand': { className: quicksand.className },
    'Fira Code': { className: firaCode.className },
};

export const FONT_WHITELIST = Object.keys(fontDictionary);
