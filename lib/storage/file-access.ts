import "server-only";

import { readFile } from "fs/promises";
import path from "path";

export async function readUploadBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch file: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  const relative = fileUrl.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  return readFile(filePath);
}

export async function readUploadAsDataUrl(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const buffer = await readUploadBuffer(fileUrl);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
