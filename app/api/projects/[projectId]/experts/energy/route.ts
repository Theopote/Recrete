import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getAIPlatform } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const body = await request.json().catch(() => ({}));
  const platform = getAIPlatform();

  const analysis = platform.energy.analyzeEnergyPerformance(project, {
    annualEnergyKwh: body.annualEnergyKwh,
    windowUValue: body.windowUValue,
    wallInsulated: body.wallInsulated,
    hvacSystemType: body.hvacSystemType,
    hvacAgeYears: body.hvacAgeYears,
    electricityPricePerKwh: body.electricityPricePerKwh,
  });

  const diagnosisItems = await platform.energy.generateEnergyDiagnosis(project, {
    annualEnergyKwh: body.annualEnergyKwh,
    windowUValue: body.windowUValue,
    wallInsulated: body.wallInsulated,
    hvacAgeYears: body.hvacAgeYears,
  });

  return NextResponse.json({ analysis, diagnosisItems });
}
