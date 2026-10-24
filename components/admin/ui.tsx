import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-paper p-5", className)}>{children}</div>;
}

const statusTone: Record<OrderStatus, string> = {
  pending: "bg-cream text-cocoa",
  paid: "bg-caramel/20 text-cocoa",
  preparing: "bg-[#e7d9f0] text-[#4b2a63]",
  out_for_delivery: "bg-[#d7e6f2] text-[#1f4466]",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusTone[status])}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "good" }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs",
        tone === "warn" ? "bg-caramel/20 text-cocoa" : tone === "good" ? "bg-success/15 text-success" : "bg-cream text-muted",
      )}
    >
      {children}
    </span>
  );
}
