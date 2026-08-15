"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Portals that render their own layout (sidebar-based) instead of the
// fixed 73px SiteHeader — the bar should hug the very top there.
const NO_FIXED_HEADER_PREFIXES = ["/partner", "/admin"];

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKey = `${pathname}?${searchParams.toString()}`;

  const prevLayout = useRef(currentKey);
  const prevEffect = useRef(currentKey);
  const [show, setShow] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Before browser paints: instant snap to top + reset scroll-reveal state
  useLayoutEffect(() => {
    if (prevLayout.current === currentKey) return;
    prevLayout.current = currentKey;
    // 'instant' overrides css scroll-behavior: smooth
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelectorAll("[data-reveal]").forEach((el) =>
      el.classList.remove("revealed")
    );
  }, [currentKey]);

  // After paint: complete progress bar animation
  useEffect(() => {
    if (prevEffect.current === currentKey) return;
    prevEffect.current = currentKey;

    clearAll();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setShow(false);
        timers.current.push(setTimeout(() => setWidth(0), 400));
      }, 250)
    );
  }, [currentKey]);

  // Detect internal link clicks → start bar. Compares the full path+query
  // (not just pathname) so query-only navigations — e.g. switching tabs via
  // /partner?tab=... links, where the pathname never changes — still show it.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return;
      const hrefKey = href.split("#")[0];
      const current = window.location.pathname + window.location.search;
      if (!hrefKey || hrefKey === current) return;

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
  const noFixedHeader = isAuthPage || NO_FIXED_HEADER_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: noFixedHeader ? 0 : 73,
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
