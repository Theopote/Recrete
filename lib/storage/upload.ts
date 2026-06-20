import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function saveUploadedFile(projectId: string, file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "public", "uploads", projectId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), buffer);
  return {
    fileUrl: `/uploads/${projectId}/${safeName}`,
    fileSize: buffer.length,
    mimeType: file.type || "application/octet-stream",
    name: file.name,
    type: file.name.split(".").pop() ?? "file",
  };
}

export function isPdf(mimeType: string, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}
