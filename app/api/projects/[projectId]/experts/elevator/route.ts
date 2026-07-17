import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getAIPlatform } from "@/lib/ai";
import { listBimModels } from "@/lib/bim/bim-model-repository";
import type { BimRoomInfo } from "@/types/bim";
import {
  getElevatorFeasibilityResult,
  saveElevatorFeasibilityResult,
} from "@/lib/db/elevator-feasibility-store";
import { getProjectSiteMeasurementsWithFallback } from "@/lib/db/site-measurements-store";
import {
  getElevatorMockRooms,
  isElevatorBimMockScenario,
  ELEVATOR_BIM_MOCK_SCENARIO_META,
} from "@/lib/mock-data/elevator-bim-rooms";

function collectRoomsFromModels(models: Awaited<ReturnType<typeof listBimModels>>): BimRoomInfo[] {
  const rooms: BimRoomInfo[] = [];
  for (const model of models) {
    const modelRooms = model.metadata?.rooms ?? [];
    rooms.push(...modelRooms);
  }
  return rooms;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const result = await getElevatorFeasibilityResult(projectId);
  return NextResponse.json({
    result,
    availableMockScenarios: Object.values(ELEVATOR_BIM_MOCK_SCENARIO_META),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const body = await request.json().catch(() => ({}));
  const skipAi = body.skipAiRecommendation === true;

  const models = await listBimModels(projectId);
  let rooms = collectRoomsFromModels(models);
  let mockScenario: string | undefined;

  if (rooms.length === 0 && isElevatorBimMockScenario(body.mockScenario)) {
    mockScenario = body.mockScenario;
    rooms = getElevatorMockRooms(body.mockScenario);
  }

  const siteMeasurements = await getProjectSiteMeasurementsWithFallback(projectId);
  const existingLoad =
    body.existingLoad ??
    siteMeasurements.measurements.existingLoadKN ??
    undefined;

  const platform = getAIPlatform();
  const result = await platform.elevator.assessFeasibility(project, rooms, {
    existingLoad: existingLoad != null ? Number(existingLoad) : undefined,
    skipAiRecommendation: skipAi,
  });

  await saveElevatorFeasibilityResult(projectId, result);

  return NextResponse.json({
    result,
    candidateCount: rooms.length,
    mockScenario,
    availableMockScenarios: Object.values(ELEVATOR_BIM_MOCK_SCENARIO_META),
  });
}
