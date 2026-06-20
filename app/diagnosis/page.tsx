import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { GlobalDiagnosisList } from "@/components/diagnosis/GlobalDiagnosisList";
import { getAllDiagnosis } from "@/lib/db/repository";

export default async function GlobalDiagnosisPage() {
  const items = await getAllDiagnosis();

  return (
    <AppShell>
      <TopBar title="Diagnosis" subtitle={`${items.length} items across all projects`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Building Diagnosis"
            description="Cross-project view of all identified building issues and condition findings"
          />
          <GlobalDiagnosisList items={items} />
        </div>
      </main>
    </AppShell>
  );
}
