"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const prevLayout = useRef(pathname);
  const prevEffect = useRef(pathname);
  const [show, setShow] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Before browser paints: instant snap to top + reset scroll-reveal state
  useLayoutEffect(() => {
    if (prevLayout.current === pathname) return;
    prevLayout.current = pathname;
    // 'instant' overrides css scroll-behavior: smooth
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelectorAll("[data-reveal]").forEach((el) =>
      el.classList.remove("revealed")
    );
  }, [pathname]);

  // After paint: complete progress bar animation
  useEffect(() => {
    if (prevEffect.current === pathname) return;
    prevEffect.current = pathname;

    clearAll();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setShow(false);
        timers.current.push(setTimeout(() => setWidth(0), 400));
      }, 250)
    );
  }, [pathname]);

  // Detect internal link clicks → start bar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return;
      const hrefPath = href.split("#")[0].split("?")[0];
      if (!hrefPath || hrefPath === window.location.pathname) return;

      clearAll();
      setShow(true);
      setWidth(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setWidth(75))
      );
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      clearAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthPage = ["/login", "/register", "/forgot-password", "/update-password"].includes(pathname);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: isAuthPage ? 0 : 73,
        left: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
        width: `${width}%`,
        background: "var(--primary)",
        boxShadow: "0 0 4px var(--primary)",
        borderRadius: "0 2px 2px 0",
        opacity: show ? 1 : 0,
        transition: show
          ? width >= 100
            ? "width 0.2s ease"
            : "width 1.6s cubic-bezier(0.05,0.5,0.5,1), opacity 0.15s ease"
          : "opacity 0.35s ease",
      }}
    />
  );
}
