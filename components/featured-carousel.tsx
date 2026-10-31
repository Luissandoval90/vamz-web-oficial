"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ResourceThumb } from "@/components/resource-thumb";
import { UiIcon } from "@/components/ui-icon";
import { formatBytes, getResourceKind } from "@/lib/resource-utils";
import type { CatalogResource } from "@/components/resource-catalog";

const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotion = () => true;

export function FeaturedCarousel({
  resources,
}: {
  resources: CatalogResource[];
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    getMotion,
    serverMotion,
  );
  const root = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const playIntent = useRef(true);
  const resource = resources[index] || resources[0];
  const rotating =
    playing && !reduced && !hovered && visible && resources.length > 1;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let inView = false;
    const update = () =>
      setVisible(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      setInstant(false);
      setIndex((value) => (value + 1) % resources.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [rotating, resources.length, index]);

  function select(value: number, keyboard = false) {
    setPlaying(false);
    setInstant(keyboard);
    setIndex((value + resources.length) % resources.length);
  }

  if (!resource) return null;
  return (
    <section
      ref={root}
      className="spotlight"
      aria-label="Recursos destacados"
      aria-roledescription="carrusel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setPlaying(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          select(index + (event.key === "ArrowRight" ? 1 : -1), true);
        }
      }}
      onTouchStart={(event) => {
        touch.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }}
      onTouchEnd={(event) => {
        if (!touch.current) return;
        const dx = touch.current.x - event.changedTouches[0].clientX;
        const dy = touch.current.y - event.changedTouches[0].clientY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3)
          select(index + (dx > 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div
        className="spotlight-art"
        key={resource.id}
        data-instant={instant || reduced}
      >
        <ResourceThumb
          resource={resource}
          optimize
          priority
          sizes="(max-width: 760px) 100vw, 1100px"
        />
      </div>
      <div className="spotlight-shade" />
      <div
        className="spotlight-copy"
        key={resource.id + "-copy"}
        data-instant={instant || reduced}
      >
        <span className="spotlight-label">
          <span /> Descubre en VAMZ
        </span>
        <div className="spotlight-meta">
          <span>{getResourceKind(resource.filename)}</span>
          <span>{formatBytes(resource.fileSize)}</span>
        </div>
        <h1 id="home-title">{resource.title || resource.filename}</h1>
        <p>
          {resource.description && resource.description.length > 30
            ? resource.description.slice(0, 150)
            : "Una nueva forma de darle vida a tu mundo. Conoce el recurso, descubre sus detalles y hazlo parte de tu próxima partida."}
        </p>
        <div className="spotlight-actions">
          <Link
            href={"/recurso/" + resource.id}
            prefetch={false}
            className="action-button is-accent"
          >
            Ver recurso <UiIcon name="arrow" />
          </Link>
          <Link href="/recursos" className="spotlight-library">
            Explorar biblioteca <UiIcon name="grid" />
          </Link>
        </div>
      </div>
      {resources.length > 1 ? (
        <div className="spotlight-navigation">
          <div
            className="spotlight-tabs"
            role="group"
            aria-label="Elegir recurso destacado"
          >
            {resources.map((item, position) => (
              <button
                type="button"
                key={item.id}
                className={position === index ? "is-active" : ""}
                aria-label={"Mostrar " + (item.title || item.filename)}
                aria-pressed={position === index}
                onClick={(event) => select(position, event.detail === 0)}
              >
                <span className="spotlight-tab-track">
                  <span
                    key={position === index ? index + "-" + rotating : "idle"}
                    data-running={position === index && rotating}
                  />
                </span>
                <span className="spotlight-tab-title">
                  {item.title || item.filename}
                </span>
              </button>
            ))}
          </div>
          <div className="carousel-controls">
            {!reduced ? (
              <button
                type="button"
                className="icon-button carousel-play"
                aria-label={playing ? "Pausar carrusel" : "Reproducir carrusel"}
                onPointerDown={() => {
                  playIntent.current = playing;
                }}
                onClick={(event) =>
                  setPlaying(event.detail ? !playIntent.current : !playing)
                }
              >
                <UiIcon name={playing ? "pause" : "play"} />
              </button>
            ) : null}
            <button
              type="button"
              className="icon-button"
              aria-label="Recurso anterior"
              onClick={(event) => select(index - 1, event.detail === 0)}
            >
              <UiIcon name="arrow" className="points-left" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Recurso siguiente"
              onClick={(event) => select(index + 1, event.detail === 0)}
            >
              <UiIcon name="arrow" />
            </button>
          </div>
        </div>
      ) : null}
      <p
        className="sr-only"
        aria-live={rotating ? "off" : "polite"}
        aria-atomic="true"
      >
        Recurso {index + 1} de {resources.length}:{" "}
        {resource.title || resource.filename}
      </p>
    </section>
  );
}
