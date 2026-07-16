import { AppShell } from "@/components/app/AppShell";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/50 ${className ?? ""}`} />;
}

export default function ProjectDetailLoading() {
  return (
    <AppShell>
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="space-y-2">
          <Pulse className="h-4 w-48" />
          <Pulse className="h-3 w-32" />
        </div>
        <Pulse className="h-8 w-24" />
      </header>

      <div className="flex flex-1 overflow-hidden" aria-busy="true" aria-label="Loading project">
        <aside className="hidden w-52 shrink-0 border-r p-3 md:block">
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <Pulse key={index} className="h-8 w-full" />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <Pulse className="h-5 w-16" />
            <Pulse className="h-4 w-40" />
          </div>

          <div className="space-y-6">
            <Pulse className="h-10 w-full max-w-xl" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Pulse key={index} className="h-28" />
              ))}
            </div>
            <Pulse className="h-48 w-full" />
            <Pulse className="h-32 w-full" />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
