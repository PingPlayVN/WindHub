export function TaiXiuDiceIcon({ size = 19, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Back angled die */}
      <path d="M13.5 3.5h5.2A1.8 1.8 0 0 1 20.5 5.3v5.2a1.8 1.8 0 0 1-1.8 1.8h-2.2" />
      <circle cx="17.2" cy="6.8" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="5.8" r="0.75" fill="currentColor" stroke="none" />
      {/* Front main die */}
      <rect x="3.5" y="8.5" width="12" height="12" rx="2.6" />
      <circle cx="6.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.2" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="14.5" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="6.8" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.2" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LiquidGlassIcon({ size = 18, active = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Back refracted glass layer */}
      <rect
        x="7.5"
        y="3.2"
        width="13.3"
        height="13.3"
        rx="3.6"
        opacity="0.55"
      />
      {/* Front optical glass surface */}
      <rect
        x="3.2"
        y="7.5"
        width="13.3"
        height="13.3"
        rx="3.6"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? '0.16' : '0'}
      />
      {/* Liquid refraction droplet / specular curve */}
      <path d="M9.85 11.1c-1.35 1.7-2.25 2.85-2.25 3.95a2.25 2.25 0 0 0 4.5 0c0-1.1-.9-2.25-2.25-3.95Z" />
      {/* Specular rim highlight */}
      <path d="M6.2 10.2h2.2" opacity="0.7" />
    </svg>
  );
}
