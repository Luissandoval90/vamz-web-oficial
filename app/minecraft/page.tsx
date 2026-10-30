import type { Metadata } from "next";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { MinecraftCatalog } from "@/components/minecraft-catalog";
import { getPublicMinecraftVersions } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Versiones de Minecraft", description: "Encuentra las versiones de Minecraft publicadas por VAMZ, organizadas por edición y plataforma." };

export default async function MinecraftPage() {
  const versions = await getPublicMinecraftVersions();
  return <PublicFrame><main className="page-shell catalog-page" id="contenido">
    <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span>/</span><span aria-current="page">Minecraft</span></nav>
    <div className="catalog-page-heading"><div><p className="section-kicker">ELIGE TU PRÓXIMA VERSIÓN</p><h1 className="page-title">Minecraft.<br /><span className="text-accent">A tu manera.</span></h1><p className="lead">Versiones organizadas por edición y plataforma.<br />Encuentra el archivo compatible con tu dispositivo.</p></div><div className="catalog-heading-mark" aria-hidden="true">↙</div></div>
    <MinecraftCatalog versions={versions} />
  </main></PublicFrame>;
}
