import { NextResponse } from "next/server";
import { requireSession, requireRoles } from "@/lib/auth/session";
import { listTrialFeedback, submitTrialFeedback } from "@/lib/trial/feedback-store";
import { trialFeedbackSchema } from "@/lib/validators/trial-feedback";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = trialFeedbackSchema.parse(body);
    const record = await submitTrialFeedback(auth.user!, parsed);
    return NextResponse.json({ feedback: record }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid feedback";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const auth = await requireRoles("admin", "project_manager");
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const organizationId = url.searchParams.get("organizationId") ?? undefined;
  const feedback = await listTrialFeedback({ organizationId, limit: 500 });

  if (format === "csv") {
    const header =
      "createdAt,userName,userEmail,kind,step,isBlocker,aiValueRating,pagePath,projectId,confusingText,notes";
    const rows = feedback.map((f) =>
      [
        f.createdAt.toISOString(),
        csvCell(f.userName),
        csvCell(f.userEmail),
        f.kind,
        f.step ?? "",
        f.isBlocker ? "yes" : "no",
        f.aiValueRating ?? "",
        csvCell(f.pagePath ?? ""),
        csvCell(f.projectId ?? ""),
        csvCell(f.confusingText ?? ""),
        csvCell(f.notes),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="trial-feedback.csv"',
      },
    });
  }

  return NextResponse.json({ feedback });
}

function csvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
