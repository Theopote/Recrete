import "server-only";

import { unlink } from "fs/promises";
import path from "path";

function isLocalUploadUrl(fileUrl: string): boolean {
  return fileUrl.startsWith("/uploads/");
}

function localPathFromUrl(fileUrl: string): string {
  const relative = fileUrl.replace(/^\/uploads\//, "");
  return path.join(process.cwd(), "public", "uploads", relative);
}

async function deleteFromS3(fileUrl: string): Promise<boolean> {
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY_ID;
  const secret = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKey || !secret) return false;

  const publicPrefix =
    process.env.S3_PUBLIC_URL_PREFIX ??
    (process.env.S3_ENDPOINT && bucket
      ? `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.amazonaws.com`);

  if (!fileUrl.startsWith(publicPrefix)) return false;

  const key = fileUrl.slice(publicPrefix.replace(/\/$/, "").length + 1);
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: accessKey, secretAccessKey: secret },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}

/** Best-effort delete of stored upload bytes (local or S3). Never throws. */
export async function deleteUploadedFile(fileUrl: string | null | undefined): Promise<boolean> {
  if (!fileUrl?.trim()) return false;

  try {
    if (isLocalUploadUrl(fileUrl)) {
      await unlink(localPathFromUrl(fileUrl));
      return true;
    }

    if (process.env.STORAGE_PROVIDER === "s3") {
      return await deleteFromS3(fileUrl);
    }
  } catch {
    return false;
  }

  return false;
}
