import type { WindowControlIconProps } from "./types";


export function DoubleRectangleIcon({
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
      {/* Rear window */}
      <path
        d="M8.5 4.75H16.25C18.46 4.75 20.25 6.54 20.25 8.75V15.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M16.25 4.75C18.46 4.75 20.25 6.54 20.25 8.75V15.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Front window */}
      <rect
        x="4.75"
        y="8.25"
        width="12.75"
        height="12"
        rx="2.25"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      {/* Small connection at upper-right, giving the same layered-window feel */}
      <path
        d="M8.5 4.75C6.43 4.75 4.75 6.43 4.75 8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
