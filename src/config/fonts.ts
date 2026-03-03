import { Inter, Roboto, Oswald, Playfair_Display, Montserrat, Lora, Quicksand, Fira_Code } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-roboto' });
export const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
export const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
export const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
export const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
export const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand' });
export const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

// Variables CSS inyectadas en el <body>
export const FONT_VARIABLES = `${inter.variable} ${roboto.variable} ${oswald.variable} ${playfair.variable} ${montserrat.variable} ${lora.variable} ${quicksand.variable} ${firaCode.variable}`;

// Mapeo seguro para usar en style={{ fontFamily: ... }}
export const FONT_MAP: Record<string, string> = {
    'Inter': 'var(--font-inter)',
    'Roboto': 'var(--font-roboto)',
    'Oswald': 'var(--font-oswald)',
    'Playfair Display': 'var(--font-playfair)',
    'Montserrat': 'var(--font-montserrat)',
    'Lora': 'var(--font-lora)',
    'Quicksand': 'var(--font-quicksand)',
    'Fira Code': 'var(--font-fira-code)',
};

export const FONT_WHITELIST = Object.keys(FONT_MAP);
