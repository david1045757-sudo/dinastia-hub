import { cn } from "@/lib/utils";

type Tone = "online" | "offline" | "warning" | "neutral" | "sky";

const tones: Record<Tone, string> = {
  online: "text-success border-success/30 bg-success/10",
  offline: "text-destructive border-destructive/30 bg-destructive/10",
  warning: "text-warning border-warning/30 bg-warning/10",
  sky: "text-primary border-primary/30 bg-primary/10",
  neutral: "text-muted-foreground border-border bg-muted/40",
};

const dot: Record<Tone, string> = {
  online: "bg-success",
  offline: "bg-destructive",
  warning: "bg-warning",
  sky: "bg-primary",
  neutral: "bg-muted-foreground",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
  pulse,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone], pulse && "animate-pulse")} />
      {children}
    </span>
  );
}
