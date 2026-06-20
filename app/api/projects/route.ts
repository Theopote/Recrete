import { NextResponse } from "next/server";
import { createProject, getProjects } from "@/lib/db/repository";
import { createProjectSchema } from "@/lib/validators/project";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    status: searchParams.get("status") ?? undefined,
    riskLevel: searchParams.get("riskLevel") ?? undefined,
    buildingType: searchParams.get("buildingType") ?? undefined,
    targetFunction: searchParams.get("targetFunction") ?? undefined,
  };
  const projects = await getProjects(filters);
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.parse(body);
    const project = await createProject(parsed);
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
