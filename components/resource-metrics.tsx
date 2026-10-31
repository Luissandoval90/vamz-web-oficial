import { UiIcon } from "@/components/ui-icon";
export type ResourceMetricsData = {
  views: number;
  downloads: number;
  rating: number;
  reviewCount: number;
};
const numbers = new Intl.NumberFormat("es", {
  notation: "compact",
  maximumFractionDigits: 1,
});
export function ResourceMetrics({
  views = 0,
  downloads = 0,
  rating = 0,
  reviewCount = 0,
}: Partial<ResourceMetricsData>) {
  return (
    <div className="resource-metrics">
      <span title="Visitas registradas por navegador y día">
        <UiIcon name="eye" />
        {numbers.format(views)} <span className="metric-word">visitas</span>
      </span>
      <span title="Descargas iniciadas por navegador y día">
        <UiIcon name="download" />
        {numbers.format(downloads)}{" "}
        <span className="metric-word">descargas</span>
      </span>
      <span
        className={reviewCount ? "has-rating" : ""}
        title={`${reviewCount} reseñas aprobadas`}
      >
        <UiIcon name="star" />
        {reviewCount ? Number(rating).toFixed(1) : "Sin valorar"}
      </span>
    </div>
  );
}
