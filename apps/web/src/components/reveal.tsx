import type { ElementType, ReactNode } from "react";

/** Plain wrapper. Content is shown as-is: no scroll-triggered animation. */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  return <Tag className={className}>{children}</Tag>;
}
