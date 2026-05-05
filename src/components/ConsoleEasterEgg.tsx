"use client";
import { useEffect } from "react";

const cppArt = `
// =====================================================
//   openclaw — agents inspired by Captain Claw '97
//   original c++ source: github.com/[À FOURNIR]
// =====================================================
//
//   #include <iostream>
//   int main() {
//       std::cout << "hello, recruiter." << std::endl;
//       return 0;
//   }
//
//   built with care by aurian.
//
`;

export function ConsoleEasterEgg() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line no-console
    console.log("%c" + cppArt, "color:#A4F5C8;font-family:monospace;font-size:11px;line-height:1.4;");
  }, []);
  return null;
}
