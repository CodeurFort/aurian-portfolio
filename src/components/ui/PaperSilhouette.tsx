export function PaperSilhouette() {
  return (
    <svg viewBox="0 0 200 320" width="180" height="288" aria-hidden>
      <defs>
        <filter id="silShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>
      <g filter="url(#silShadow)" fill="var(--color-paper-cream)">
        <circle cx="100" cy="60" r="32" />
        <path d="M62 110 q38 -22 76 0 q14 18 14 90 q-22 12 -90 12 q-14 -28 0 -102z" />
        <rect x="92" y="200" width="16" height="92" rx="6" />
        <rect x="92" y="200" width="16" height="92" rx="6" transform="translate(8 0)" />
      </g>
    </svg>
  );
}
