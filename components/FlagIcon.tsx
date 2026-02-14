// FlagIcon — visually matches TradingView's flag icon.
// Wide flag body with a V-notch cut into the right side, wider than tall.

export function FlagIcon({
  className,
  filled = false,
  size = 14,
}: {
  className?: string;
  filled?: boolean;
  size?: number;
}) {
  // viewBox 14×14. Flag body centred in the viewBox.
  // Left edge x=1.5, right extent x=13, notch tip at x=8.5, height y=2 to y=12.
  const flagPath = "M 1.5 2 L 13 2 L 8.5 7 L 13 12 L 1.5 12 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Flag body */}
      {filled ? (
        <path d={flagPath} fill="currentColor" />
      ) : (
        <path
          d={flagPath}
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  );
}
