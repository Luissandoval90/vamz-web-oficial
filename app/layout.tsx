import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./library.css";
import "./studio.css";
import { connection } from "next/server";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://vamz.umifront.com"),
  title: {
    default: "VAMZ — Recursos para tu mundo de Minecraft",
    template: "%s | VAMZ Studio",
  },
  description:
    "Recursos, portadas y creatividad. Explora la biblioteca de VAMZ Studio y forma parte de la comunidad.",
  applicationName: "VAMZ Studio",
  openGraph: {
    title: "VAMZ Studio",
    description:
      "Packs, texturas, versiones y opiniones de la comunidad de Minecraft en VAMZ.",
    locale: "es_PE",
    type: "website",
  },
};
export const viewport: Viewport = {
  themeColor: "#090f1a",
  colorScheme: "dark",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
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
