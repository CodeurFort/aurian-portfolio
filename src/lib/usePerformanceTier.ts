"use client";

import { useState } from "react";

export type PerformanceTier = "high" | "low";

function detectTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const isLowCore = cores < 4;
  return isCoarsePointer || isLowCore ? "low" : "high";
}

/**
 * Detects the device performance tier.
 *
 * "low" when:
 *  - matchMedia indicates a touch / coarse pointer device (mobile-like), OR
 *  - navigator.hardwareConcurrency < 4
 *
 * Otherwise "high".
 */
export function usePerformanceTier(): PerformanceTier {
  const [tier] = useState<PerformanceTier>(detectTier);
  return tier;
}
