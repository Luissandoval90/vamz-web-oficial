"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { UiIcon } from "@/components/ui-icon";
export function ResourceRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const element = rail.current;
    if (element)
      setEdges({
        start: element.scrollLeft < 5,
        end:
          element.scrollLeft + element.clientWidth >= element.scrollWidth - 5,
      });
  };
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const move = (direction: number, keyboard: boolean) => {
    const element = rail.current;
    if (!element) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: keyboard || reduced ? "instant" : "smooth",
    });
  };
  return (
    <div className="resource-rail-frame">
      <div className="rail-controls">
        <button
          className="icon-button"
          type="button"
          aria-label="Recursos anteriores"
          disabled={edges.start}
          onClick={(event) => move(-1, event.detail === 0)}
        >
          <UiIcon name="arrow" className="points-left" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Más recursos"
          disabled={edges.end}
          onClick={(event) => move(1, event.detail === 0)}
        >
          <UiIcon name="arrow" />
        </button>
      </div>
      <div
        className="resource-rail"
        ref={rail}
        onScroll={update}
        tabIndex={0}
        role="region"
        aria-label="Recursos para descubrir"
      >
        {children}
      </div>
    </div>
  );
}
