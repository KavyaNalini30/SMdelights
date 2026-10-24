import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-[1.75rem] border border-line bg-paper p-6 shadow-soft sm:p-8">
          <h1 className="text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={kind === "error" ? "rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" : "rounded-xl bg-success/10 px-4 py-3 text-sm text-success"}
    >
      {children}
    </p>
  );
}
