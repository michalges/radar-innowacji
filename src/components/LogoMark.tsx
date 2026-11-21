export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <ellipse cx="32" cy="56" rx="16" ry="4" className="fill-primary-soft" />
      <path d="M32 54 C22 42 16 34 16 25 A16 16 0 0 1 48 25 C48 34 42 42 32 54 Z" className="fill-primary" />
      <circle cx="32" cy="25" r="6" className="fill-white" />
      <g fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary opacity-50">
        <path d="M52 12 A12 12 0 0 1 56 22" />
        <path d="M12 12 A12 12 0 0 0 8 22" />
      </g>
    </svg>
  );
}
