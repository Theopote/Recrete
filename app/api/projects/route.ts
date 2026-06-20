import { NextResponse } from "next/server";
import { createProject } from "@/lib/db/repository";
import { createProjectSchema } from "@/lib/validators/project";

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
