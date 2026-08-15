"use client";

import { useCallback, useEffect, useState } from "react";

const CLOSE_MS = 200;

// Popups that previously appeared instantly and vanished instantly on close
// (only the "rise" mount animation covered opening). This gives both a
// closing transition too: `mounted` keeps the portal in the DOM for CLOSE_MS
// after close is requested so the exit transition (driven by `visible`) has
// time to actually play before unmounting.
export function usePopupTransition() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const openPopup = useCallback(() => {
    setMounted(true);
    // Double rAF: guarantees the browser has painted the "closed" starting
    // style at least once before switching to "open", so the transition
    // actually animates instead of snapping straight to the end state.
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const closePopup = useCallback(() => {
    setVisible(false);
    setTimeout(() => setMounted(false), CLOSE_MS);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closePopup(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closePopup]);

  return { mounted, visible, openPopup, closePopup };
}
