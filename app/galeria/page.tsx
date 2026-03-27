import { PublicPageShell } from "@/components/public-page-shell";

export default function GaleriaPage() {
  return (
    <PublicPageShell
      active="gallery"
      subtitle="Galeria"
      title="Portadas del proyecto."
      description="Esta seccion queda reservada para mostrar la identidad visual del sitio sin mezclarla con bloques innecesarios."
      imageSrc="/remtop.webp"
      imageAlt="Galeria"
    />
  );
}
