import type { ProjectCostRecord } from "@/types/cost";

declare global {
  // eslint-disable-next-line no-var
  var __recreteProjectCostRecords: ProjectCostRecord[] | undefined;
}

function getStore(): ProjectCostRecord[] {
  if (!globalThis.__recreteProjectCostRecords) {
    globalThis.__recreteProjectCostRecords = [];
  }
  return globalThis.__recreteProjectCostRecords;
}

export function listAllCostRecords(): ProjectCostRecord[] {
  return [...getStore()].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

export function listCostRecordsByProject(projectId: string): ProjectCostRecord[] {
  return listAllCostRecords().filter((r) => r.projectId === projectId);
}

export function getCostRecordById(id: string): ProjectCostRecord | undefined {
  return getStore().find((r) => r.id === id);
}

export function createCostRecord(
  input: Omit<ProjectCostRecord, "id" | "recordedAt" | "createdAt">
): ProjectCostRecord {
  const now = new Date();
  const record: ProjectCostRecord = {
    ...input,
    id: `pcr-${Date.now()}`,
    recordedAt: now,
    createdAt: now,
  };
  getStore().unshift(record);
  return record;
}

export function updateCostRecord(
  id: string,
  input: Partial<Omit<ProjectCostRecord, "id" | "projectId" | "createdAt">>
): ProjectCostRecord | null {
  const store = getStore();
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;
  store[index] = { ...store[index], ...input, recordedAt: new Date() };
  return store[index];
}

export function deleteCostRecord(id: string): boolean {
  const store = getStore();
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return false;
  store.splice(index, 1);
  return true;
}

export function hydrateCostRecordStore(records: ProjectCostRecord[]): void {
  globalThis.__recreteProjectCostRecords = structuredClone(records);
}

export function resetCostRecords(): void {
  globalThis.__recreteProjectCostRecords = [];
}
