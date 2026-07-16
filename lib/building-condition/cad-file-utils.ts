export function isCadDrawingFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext === "dwg" || ext === "dxf";
}

export function shouldOpenBuildingCondition(fileName: string, category?: string): boolean {
  if (isCadDrawingFile(fileName)) return true;
  if (category === "old_drawings") return true;
  return false;
}
