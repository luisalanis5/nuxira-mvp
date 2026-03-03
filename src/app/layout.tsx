import type { Metadata } from "next";
import { FONT_VARIABLES } from "@/config/fonts";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Nexia",
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
