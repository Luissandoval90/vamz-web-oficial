import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "VAMZ Studio — Crea tu propio mundo",
    template: "%s | VAMZ Studio",
  },
  description:
    "Recursos, portadas y creatividad. Explora la biblioteca de VAMZ Studio y forma parte de la comunidad.",
  applicationName: "VAMZ Studio",
  openGraph: {
    title: "VAMZ Studio",
    description:
      "Menos límites. Más creatividad. Recursos y comunidad en un mismo lugar.",
    locale: "es_PE",
    type: "website",
  },
};
export const viewport: Viewport = {
  themeColor: "#111310",
  colorScheme: "dark",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={manrope.variable}>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
