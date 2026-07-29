import { type ReactNode } from "react";

export function PageHeader({
  module,
  title,
  description,
  actions,
}: {
  module: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {module}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>;
}
