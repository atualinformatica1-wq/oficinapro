import { cn } from "@/lib/utils";
import type { LabelMap } from "@/lib/format";

interface StatusBadgeProps {
  map: LabelMap;
  value?: string | null;
  className?: string;
}

export function StatusBadge({ map, value, className }: StatusBadgeProps) {
  const info = value ? map[value] : undefined;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        info?.className ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {info?.label ?? value ?? "—"}
    </span>
  );
}
