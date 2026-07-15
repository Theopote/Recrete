import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface SavedUpload {
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  name: string;
  type: string;
}

function getStorageProvider(): "local" | "s3" {
  if (
    process.env.STORAGE_PROVIDER === "s3" &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  ) {
    return "s3";
  }
  return "local";
}

async function saveToLocal(projectId: string, file: File): Promise<SavedUpload> {
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

async function saveToS3(projectId: string, file: File): Promise<SavedUpload> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${projectId}/${safeName}`;

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const publicPrefix =
    process.env.S3_PUBLIC_URL_PREFIX ??
    (process.env.S3_ENDPOINT && process.env.S3_BUCKET
      ? `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${process.env.S3_BUCKET}`
      : `https://${process.env.S3_BUCKET}.s3.amazonaws.com`);

  return {
    fileUrl: `${publicPrefix.replace(/\/$/, "")}/${key}`,
    fileSize: buffer.length,
    mimeType: file.type || "application/octet-stream",
    name: file.name,
    type: file.name.split(".").pop() ?? "file",
  };
}

export async function saveUploadedFile(
  projectId: string,
  file: File
): Promise<SavedUpload> {
  return getStorageProvider() === "s3"
    ? saveToS3(projectId, file)
    : saveToLocal(projectId, file);
}

export function getStorageProviderName(): "local" | "s3" {
  return getStorageProvider();
}
