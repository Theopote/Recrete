"use client";

import { cn } from "@/lib/utils";
import type { StrategyTierProfile } from "@/types/strategy-profile";
import { INTERVENTION_LABELS } from "@/lib/ai/strategy-drawing-linker";
import { useLocale } from "@/lib/i18n/use-locale";
import { MapPin, Layers } from "lucide-react";

interface StrategyTierProfilePanelProps {
  profile: StrategyTierProfile;
  className?: string;
}

export function StrategyTierProfilePanel({
  profile,
  className,
}: StrategyTierProfilePanelProps) {
  const { t } = useLocale();

  return (
    <div className={cn("rounded-md border bg-muted/20 p-3 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("Tier profile", "档位方案结构")} · {t(profile.tierLabel.en, profile.tierLabel.zh)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <ProfileField
          label={t("Intervention depth", "介入深度")}
          value={profile.interventionDepth}
        />
        <ProfileField
          label={t("Phasing", "分期策略")}
          value={profile.phasedDelivery ?? "—"}
        />
        <ProfileField
          label={t("Preservation", "保留策略")}
          value={profile.preservationPosture}
          className="col-span-2"
        />
      </div>

      {profile.spatialLinks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {t("Drawing-linked rooms", "图纸关联房间")}
          </p>
          <ul className="space-y-1">
            {profile.spatialLinks.map((link) => (
              <li
                key={link.nodeId}
                className="rounded border bg-background/70 px-2 py-1.5 text-[10px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{link.roomLabel}</span>
                  <span className="shrink-0 rounded bg-sage/10 px-1.5 py-0.5 text-sage">
                    {t(
                      INTERVENTION_LABELS[link.intervention].en,
                      INTERVENTION_LABELS[link.intervention].zh
                    )}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {link.areaM2 != null ? `${link.areaM2} m² · ` : ""}
                  {link.rationale}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.diagnosisResponses.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">
            {t("Diagnosis responses", "诊断回应")}
          </p>
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            {profile.diagnosisResponses.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-xs leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}
