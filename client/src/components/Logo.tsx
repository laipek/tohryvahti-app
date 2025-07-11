interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield background */}
      <path
        d="M50 5L15 25V45C15 65 30 82 50 95C70 82 85 65 85 45V25L50 5Z"
        fill="#2563eb"
        stroke="#1d4ed8"
        strokeWidth="2"
      />
      
      {/* Eye symbol in center */}
      <ellipse
        cx="50"
        cy="45"
        rx="18"
        ry="12"
        fill="white"
        stroke="#1d4ed8"
        strokeWidth="1.5"
      />
      
      {/* Pupil */}
      <circle
        cx="50"
        cy="45"
        r="6"
        fill="#1d4ed8"
      />
      
      {/* Highlight in eye */}
      <circle
        cx="52"
        cy="42"
        r="2"
        fill="white"
      />
      
      {/* Spray can outline at bottom */}
      <rect
        x="42"
        y="65"
        width="6"
        height="12"
        rx="3"
        fill="white"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
      
      {/* Spray nozzle */}
      <rect
        x="44"
        y="62"
        width="2"
        height="3"
        fill="#1d4ed8"
      />
      
      {/* Cross/prohibition line */}
      <line
        x1="38"
        y1="58"
        x2="58"
        y2="78"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}