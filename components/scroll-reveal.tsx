"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = elementRef.current;
    if (
      !node ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.animate(
            [
              { opacity: 0.4, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 550,
              delay: delayMs,
              easing: "cubic-bezier(.2,.65,.3,1)",
            },
          );
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);
  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
