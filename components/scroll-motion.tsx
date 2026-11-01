"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollMotion() {
  const pathname = usePathname();
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const animations = new Map<HTMLElement, Animation>();
    let frame = 0;
    const reveal = (element: HTMLElement, instant = false) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.dataset.revealState = "visible";
      observer.unobserve(element);
      if (instant || media.matches || document.visibilityState !== "visible")
        return;
      const delay = Math.min(Number(element.dataset.revealDelay) || 0, 240);
      const animation = element.animate(
        [
          { opacity: 0, transform: "translate3d(0,30px,0) scale(.985)" },
          { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
        ],
        { duration: 620, delay, easing: "cubic-bezier(.22,1,.36,1)" },
      );
      animations.set(element, animation);
      animation.finished.then(() => animations.delete(element)).catch(() => {});
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      },
      { threshold: 0.06, rootMargin: "0px 0px -20px 0px" },
    );
    const observe = (element: HTMLElement) => {
      if (seen.has(element)) return;
      if (element.dataset.reveal === "card" && element.parentElement)
        element.dataset.revealDelay = String(
          (Array.from(element.parentElement.children).indexOf(element) % 3) *
            70,
        );
      const box = element.getBoundingClientRect();
      if (media.matches || box.bottom <= 0) {
        reveal(element, true);
        return;
      }
      if (box.top >= window.innerHeight)
        element.dataset.revealState = "waiting";
      observer.observe(element);
    };
    const scan = (root: Element | Document) => {
      if (root instanceof HTMLElement && root.matches("[data-reveal]"))
        observe(root);
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(observe);
    };
    const updateScroll = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0})`;
      document
        .querySelectorAll<HTMLElement>("[data-parallax]")
        .forEach((element) => {
          if (media.matches) {
            element.style.removeProperty("transform");
            return;
          }
          const box = element.parentElement?.getBoundingClientRect();
          if (box && box.bottom > 0 && box.top < window.innerHeight)
            element.style.transform = `translate3d(0,${Math.max(-24, Math.min(24, (box.top + box.height / 2 - window.innerHeight / 2) * -0.05))}px,0)`;
        });
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(updateScroll);
    };
    const focus = (event: FocusEvent) => {
      const element = (event.target as Element)?.closest<HTMLElement>(
        "[data-reveal]",
      );
      if (element) {
        reveal(element, true);
        animations.get(element)?.cancel();
        animations.delete(element);
      }
    };
    const preference = () => {
      if (media.matches) {
        document
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((element) => reveal(element, true));
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      } else scan(document);
      updateScroll();
    };
    document.documentElement.dataset.motionEnabled = "true";
    scan(document);
    updateScroll();
    const mutation = new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        }),
      ),
    );
    mutation.observe(document.getElementById("contenido") || document.body, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll, { passive: true });
    document.addEventListener("focusin", focus);
    media.addEventListener("change", preference);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      animations.forEach((animation) => animation.cancel());
      document
        .querySelectorAll<HTMLElement>('[data-reveal-state="waiting"]')
        .forEach((element) => {
          element.dataset.revealState = "visible";
        });
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      document.removeEventListener("focusin", focus);
      media.removeEventListener("change", preference);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={progress} />
    </div>
  );
}
