interface MaixinLogoProps {
  width?: number;
  className?: string;
}

export function MaixinLogo({ width = 220, className }: MaixinLogoProps) {
  const height = Math.round(width * (172 / 440));
  return (
    <img
      src="/logo.png"
      width={width}
      height={height}
      alt="Maixin Chinese logo"
      className={className}
      style={className ? undefined : { width, height }}
    />
  );
}
