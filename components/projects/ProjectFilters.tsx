"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import {
  projectStatusLabels,
  projectStatusLabelsZh,
  riskLevelLabels,
  riskLevelLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";

interface ProjectFiltersProps {
  buildingTypes: string[];
  targetFunctions: string[];
  currentFilters: {
    status?: string;
    riskLevel?: string;
    buildingType?: string;
    targetFunction?: string;
  };
}

export function ProjectFilters({
  buildingTypes,
  targetFunctions,
  currentFilters,
}: ProjectFiltersProps) {
  const router = useRouter();
  const { t, label } = useLocale();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    const filters = { ...currentFilters, [key]: value };
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
    });
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={currentFilters.status ?? "all"}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="w-40 h-8 text-xs"
      >
        <option value="all">{t("All Statuses", "全部状态")}</option>
        {Object.entries(projectStatusLabels).map(([key]) => (
          <option key={key} value={key}>
            {label(projectStatusLabels, projectStatusLabelsZh, key as keyof typeof projectStatusLabels)}
          </option>
        ))}
      </Select>

      <Select
        value={currentFilters.riskLevel ?? "all"}
        onChange={(e) => updateFilter("riskLevel", e.target.value)}
        className="w-40 h-8 text-xs"
      >
        <option value="all">{t("All Risk Levels", "全部风险等级")}</option>
        {Object.entries(riskLevelLabels).map(([key]) => (
          <option key={key} value={key}>
            {label(riskLevelLabels, riskLevelLabelsZh, key as keyof typeof riskLevelLabels)}
          </option>
        ))}
      </Select>

      <Select
        value={currentFilters.buildingType ?? "all"}
        onChange={(e) => updateFilter("buildingType", e.target.value)}
        className="w-48 h-8 text-xs"
      >
        <option value="all">{t("All Building Types", "全部建筑类型")}</option>
        {buildingTypes.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </Select>

      <Select
        value={currentFilters.targetFunction ?? "all"}
        onChange={(e) => updateFilter("targetFunction", e.target.value)}
        className="w-48 h-8 text-xs"
      >
        <option value="all">{t("All Target Functions", "全部目标功能")}</option>
        {targetFunctions.map((fn) => (
          <option key={fn} value={fn}>{fn}</option>
        ))}
      </Select>
    </div>
  );
}
