import type { Metadata } from "next";
import { FONT_VARIABLES } from "@/config/fonts";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

import { APP_NAME } from '@/config/brand';

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Plataforma de Creadores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${FONT_VARIABLES} antialiased`}>
        {children}
        <Toaster
          position="bottom-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            }
          }}
        />
      </body>
    </html>
  );
}
