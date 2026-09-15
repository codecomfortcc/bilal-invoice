import type { WindowControlIconProps } from "./types";

export function MinusIcon({
  size = 24,
  strokeWidth = 1.5,
  ...props
}: WindowControlIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
