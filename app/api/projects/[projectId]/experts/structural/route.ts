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

  const assessment = await platform.structural.assessStructuralSafety(project, {
    concreteStrength: body.concreteStrength,
    carbonationDepth: body.carbonationDepth,
    existingLoad: body.existingLoad,
    targetLoad: body.targetLoad,
  });

  const diagnosisItems = await platform.structural.generateStructuralDiagnosis(project);

  return NextResponse.json({
    assessment,
    diagnosisItems,
    strengtheningOptions: {
      insufficient_capacity: platform.structural.suggestStrengtheningMethods("insufficient_capacity"),
      corrosion: platform.structural.suggestStrengtheningMethods("corrosion"),
      seismic: platform.structural.suggestStrengtheningMethods("seismic"),
      crack: platform.structural.suggestStrengtheningMethods("crack"),
      masonry_seismic: platform.structural.suggestStrengtheningMethods("masonry_seismic"),
      settlement: platform.structural.suggestStrengtheningMethods("settlement"),
      joint_strengthening: platform.structural.suggestStrengtheningMethods("joint_strengthening"),
      precast_slab: platform.structural.suggestStrengtheningMethods("precast_slab"),
      timber_protection: platform.structural.suggestStrengtheningMethods("timber_protection"),
    },
  });
}
