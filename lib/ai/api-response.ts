import "server-only";

import { NextResponse } from "next/server";
import { AIServiceError, aiErrorToJson } from "@/lib/ai/errors";

export function aiErrorResponse(error: unknown): NextResponse {
  const body = aiErrorToJson(error);
  const status =
    error instanceof AIServiceError ? error.statusCode : 503;
  return NextResponse.json(body, { status });
}
