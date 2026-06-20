"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { projectStatusLabels, riskLevelLabels } from "@/lib/utils/labels";

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
        <option value="all">All Statuses</option>
        {Object.entries(projectStatusLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </Select>

      <Select
        value={currentFilters.riskLevel ?? "all"}
        onChange={(e) => updateFilter("riskLevel", e.target.value)}
        className="w-40 h-8 text-xs"
      >
        <option value="all">All Risk Levels</option>
        {Object.entries(riskLevelLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </Select>

      <Select
        value={currentFilters.buildingType ?? "all"}
        onChange={(e) => updateFilter("buildingType", e.target.value)}
        className="w-48 h-8 text-xs"
      >
        <option value="all">All Building Types</option>
        {buildingTypes.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </Select>

      <Select
        value={currentFilters.targetFunction ?? "all"}
        onChange={(e) => updateFilter("targetFunction", e.target.value)}
        className="w-48 h-8 text-xs"
      >
        <option value="all">All Target Functions</option>
        {targetFunctions.map((fn) => (
          <option key={fn} value={fn}>{fn}</option>
        ))}
      </Select>
    </div>
  );
}
