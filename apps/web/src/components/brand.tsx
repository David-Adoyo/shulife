/* Shulife logo lockups, sized to the slots they sit in. The wordmark SVG has a
 * 3240 × 820 viewBox (≈ 3.95 : 1), the mark 53 × 74. */

type Size = "sm" | "md" | "lg";

const wordmarkHeights: Record<Size, string> = {
  sm: "h-6", // 24 px: mobile header
  md: "h-7", // 28 px: desktop header (72 px bar)
  lg: "h-9", // 36 px: footer
};

export function Wordmark({ tone = "navy", size = "md", className = "" }: { tone?: "navy" | "cream"; size?: Size; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "navy" ? "/brand/shulife-wordmark.svg" : "/brand/shulife-wordmark-cream.svg"}
      alt="Shulife"
      width={395}
      height={100}
      className={`${wordmarkHeights[size]} w-auto ${className}`}
    />
  );
}

export function Mark({ tone = "navy", className = "h-10 w-auto" }: { tone?: "navy" | "cream"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "navy" ? "/brand/shulife-mark.svg" : "/brand/shulife-mark-cream.svg"}
      alt=""
      aria-hidden
      width={53}
      height={74}
      className={className}
    />
  );
}

/** The signal ripple: concentric rings that pulse out from a point. */
export function Ripple({ className = "", color = "border-gold-400" }: { className?: string; color?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {[0, 0.9, 1.8].map((d) => (
        <span
          key={d}
          className={`absolute inset-0 rounded-full border-2 ${color} animate-ripple`}
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}
