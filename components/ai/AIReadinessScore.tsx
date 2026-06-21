import { ScoreRing } from "@/components/app/ScoreRing";

interface AIReadinessScoreProps {
  score: number;
  size?: number;
}

export function AIReadinessScore({ score, size = 64 }: AIReadinessScoreProps) {
  return <ScoreRing score={score} label="AI Ready" size={size} />;
}
