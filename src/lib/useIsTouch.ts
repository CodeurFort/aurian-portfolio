"use client";

import { useEffect, useState } from "react";

/**
 * Detects coarse-pointer devices (phones, tablets) so the UI can swap
 * keyboard-centric hints for touch-centric ones. Reactive to media-query
 * changes (e.g. plugging/unplugging a mouse).
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}
