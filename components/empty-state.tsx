import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
