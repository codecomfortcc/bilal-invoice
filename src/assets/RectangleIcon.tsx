import type { WindowControlIconProps } from "./types";

export function RectangleIcon({
  size = 24,
  strokeWidth = 1.6,
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
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
