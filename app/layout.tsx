import type { Metadata } from "next";
import { Dela_Gothic_One, Manrope } from "next/font/google";

import "./globals.css";

const delaGothicOne = Dela_Gothic_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VAMZ Studio",
  description: "Biblioteca privada de VAMZ Studio con acceso, recursos y panel personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${delaGothicOne.variable} ${manrope.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
