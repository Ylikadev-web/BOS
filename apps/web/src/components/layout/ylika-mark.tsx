import { cn } from "@/lib/utils";

/** Geometric mark inspired by YLIKA brand (teal + orange fold). */
export function YlikaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M4 6.5L14 16L4 25.5V6.5Z"
        fill="url(#ylika-teal)"
      />
      <path
        d="M14 16L28 6.5V14.5L20.5 19.5L28 25.5V28L14 16Z"
        fill="url(#ylika-warm)"
      />
      <defs>
        <linearGradient id="ylika-teal" x1="4" y1="6" x2="14" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="ylika-warm" x1="14" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
