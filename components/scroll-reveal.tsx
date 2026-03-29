"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = elementRef.current;

    if (!node) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (window.innerWidth <= 980 || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const revealFallback = window.setTimeout(() => {
      setIsVisible(true);
    }, 1400);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          window.clearTimeout(revealFallback);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -4%",
      },
    );

    observer.observe(node);

    return () => {
      window.clearTimeout(revealFallback);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal ${isVisible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
