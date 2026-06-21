import { Progress } from "@/components/ui/progress";

interface DataCompletenessScoreProps {
  score: number;
}

export function DataCompletenessScore({ score }: DataCompletenessScoreProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Data Completeness</span>
        <span className="font-mono font-semibold">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}
