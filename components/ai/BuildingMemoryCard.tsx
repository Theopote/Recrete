import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { BuildingMemory } from "@/types/ai";
import { Brain, AlertTriangle, HelpCircle, Lightbulb } from "lucide-react";

interface BuildingMemoryCardProps {
  memory: BuildingMemory;
}

function MemoryList({
  title,
  titleZh,
  items,
  icon: Icon,
}: {
  title: string;
  titleZh?: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-copper" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          {titleZh && <span className="normal-case font-normal text-muted-foreground/70"> · {titleZh}</span>}
        </h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground/85 leading-relaxed pl-0.5">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BuildingMemoryCard({ memory }: BuildingMemoryCardProps) {
  return (
    <Card className="border-copper/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-copper" />
          <CardTitle className="text-sm">Building Memory · 建筑记忆</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{memory.summary}</p>
        <p className="text-[10px] font-mono text-muted-foreground/70">
          Last AI update: {formatDate(memory.lastUpdatedByAI)}
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <MemoryList title="Known Facts" titleZh="AI 已知" items={memory.knownFacts} icon={Brain} />
        <MemoryList title="Key Risks" titleZh="关键风险" items={memory.keyRisks} icon={AlertTriangle} />
        <MemoryList title="Missing Information" titleZh="AI 未知" items={memory.missingInformation} icon={HelpCircle} />
        <MemoryList title="Unresolved Questions" titleZh="待解问题" items={memory.unresolvedQuestions} icon={HelpCircle} />
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-sage" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Renovation Potential · 改造潜力
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-foreground/85">{memory.renovationPotential}</p>
        </div>
      </CardContent>
    </Card>
  );
}
