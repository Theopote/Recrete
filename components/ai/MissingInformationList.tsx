import type { BuildingMemory } from "@/types/ai";
import { AlertCircle } from "lucide-react";

interface MissingInformationListProps {
  items: string[];
  fromMemory?: BuildingMemory | null;
}

export function MissingInformationList({ items, fromMemory }: MissingInformationListProps) {
  const list = items.length > 0 ? items : fromMemory?.missingInformation ?? [];

  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <h4 className="text-xs font-semibold">Missing Information</h4>
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono">
          {list.length} items
        </span>
      </div>
      <ul className="space-y-2">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-foreground/85">
            <span className="font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
