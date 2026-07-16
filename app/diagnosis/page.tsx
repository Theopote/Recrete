import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { GlobalDiagnosisList } from "@/components/diagnosis/GlobalDiagnosisList";
import { getAllDiagnosis } from "@/lib/db/repository";

export default async function GlobalDiagnosisPage() {
  const items = await getAllDiagnosis();

  return (
    <AppShell>
      <TopBar
        title="Diagnosis"
        titleZh="诊断"
        subtitle={`${items.length} items across all projects`}
        subtitleZh={`全项目共 ${items.length} 条诊断`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Building Diagnosis"
            titleZh="建筑诊断"
            description="Cross-project view of all identified building issues and condition findings"
            descriptionZh="跨项目查看所有已识别的建筑问题与现状发现"
          />
          <GlobalDiagnosisList items={items} />
        </div>
      </main>
    </AppShell>
  );
}
