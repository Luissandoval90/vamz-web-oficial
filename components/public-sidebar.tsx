import { FloatingRail } from "@/components/floating-rail";

type PublicSidebarProps = {
  active?: "home" | "resources" | "gallery" | "admin" | "admin-links";
  canPublish?: boolean;
};

const baseItems = [
  { id: "home", label: "Inicio", icon: "home" as const, href: "/" },
  { id: "resources", label: "Recursos", icon: "folder" as const, href: "/recursos" },
];

export function PublicSidebar({ active, canPublish = false }: PublicSidebarProps) {
  const items = canPublish
    ? [
        ...baseItems,
        { id: "admin", label: "Panel", icon: "spark" as const, href: "/dashboard" },
        { id: "admin-links", label: "Links", icon: "link" as const, href: "/dashboard?view=links" },
      ]
    : baseItems;

  return (
    <FloatingRail
      title="Secciones"
      items={items.map((item) => ({
        ...item,
        active: item.id === active,
      }))}
    />
  );
}
