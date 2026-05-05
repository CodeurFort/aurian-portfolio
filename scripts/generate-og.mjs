import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#14161B"/>
      <stop offset="100%" stop-color="#07080A"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="220" cy="180" r="46" fill="#ECE6D6" opacity="0.85"/>
  <circle cx="980" cy="160" r="34" fill="#A8C4B0" opacity="0.85"/>
  <circle cx="180" cy="500" r="38" fill="#B89968" opacity="0.85"/>
  <circle cx="1020" cy="490" r="50" fill="#C8A99B" opacity="0.85"/>
  <circle cx="600" cy="540" r="28" fill="#8E8B83" opacity="0.85"/>
  <text x="600" y="320" text-anchor="middle"
        font-family="Georgia,serif" font-style="italic" font-size="160" fill="#ECE6D6">
    aurian<tspan fill="#A4F5C8">.</tspan>
  </text>
  <text x="600" y="380" text-anchor="middle"
        font-family="Georgia,serif" font-style="italic" font-size="28" fill="#6B6660">
    une nuit éditoriale, cinq planètes, des fils de menthe.
  </text>
</svg>`);

const png = await sharp(svg).png().toBuffer();
writeFileSync("public/og-image.png", png);
console.log("og-image.png written");
