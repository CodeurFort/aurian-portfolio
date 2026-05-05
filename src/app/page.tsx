"use client";

import dynamic from "next/dynamic";
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg";

const PortfolioUniverse = dynamic(
  () => import("@/components/3d/PortfolioUniverse").then((m) => m.PortfolioUniverse),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 grid place-items-center">
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">
          chargement de l&apos;univers…
        </p>
      </div>
    ),
  },
);

export default function Home() {
  return (
    <>
      <PortfolioUniverse />
      <ConsoleEasterEgg />
    </>
  );
}
