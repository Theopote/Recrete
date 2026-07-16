"use client";

import { useMemo } from "react";
import { FloorPlanOverlayViewer } from "@/components/bim/FloorPlanOverlayViewer";
import type {
  BimCirculationPath,
  BimRoomCostCell,
  BimRoomInfo,
  BimSpatialAnalytics,
  BimSpatialAnnotation,
} from "@/types/bim";
import { costHeatColor, impactHeatColor } from "@/lib/bim/spatial-cost";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

interface SchematicRoomPlanProps {
  rooms: BimRoomInfo[];
  paths?: BimCirculationPath[];
  activePathId?: string | null;
  roomCosts?: BimRoomCostCell[];
  mode?: "none" | "circulation" | "cost" | "impact";
  label?: string;
  className?: string;
  selectedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  annotations?: BimSpatialAnnotation[];
  layoutAssignments?: Record<string, number>;
}

function roomRadius(area: number) {
  return Math.max(Math.sqrt(area) * 0.45, 0.8);
}

function roomFill(
  room: BimRoomInfo,
  mode: SchematicRoomPlanProps["mode"],
  roomCosts: BimRoomCostCell[]
) {
  if (mode === "cost") {
    const cell = roomCosts.find((item) => item.roomId === room.id);
    return cell ? costHeatColor(cell.intensity) : "rgba(148,163,184,0.18)";
  }
  if (mode === "impact") {
    const cell = roomCosts.find((item) => item.roomId === room.id);
    return cell ? impactHeatColor(cell.strategyImpact ?? cell.intensity) : "rgba(148,163,184,0.18)";
  }
  return "rgba(148,163,184,0.15)";
}

export function SchematicRoomPlan({
  rooms,
  paths = [],
  activePathId,
  roomCosts = [],
  mode = "none",
  label,
  className,
  selectedRoomId,
  onRoomClick,
  annotations = [],
  layoutAssignments = {},
}: SchematicRoomPlanProps) {
  const locatedRooms = rooms.filter((room) => room.centroid);
  const activePath =
    paths.find((path) => path.id === activePathId) ?? paths[0] ?? null;

  const viewBox = useMemo(() => {
    if (locatedRooms.length === 0) return "0 0 100 100";
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const room of locatedRooms) {
      const radius = roomRadius(room.area);
      minX = Math.min(minX, room.centroid!.x - radius);
      minY = Math.min(minY, room.centroid!.y - radius);
      maxX = Math.max(maxX, room.centroid!.x + radius);
      maxY = Math.max(maxY, room.centroid!.y + radius);
    }

    const padding = 4;
    return `${minX - padding} ${-(maxY + padding)} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [locatedRooms]);

  if (locatedRooms.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20 text-xs text-muted-foreground",
          className
        )}
      >
        No room geometry available for schematic plan
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md border bg-slate-50", className)}>
      {label && (
        <div className="absolute left-3 top-3 z-10 rounded bg-background/90 px-2 py-1 text-[10px] font-medium shadow-sm">
          {label}
        </div>
      )}
      <svg viewBox={viewBox} className="h-full min-h-[320px] w-full" preserveAspectRatio="xMidYMid meet">
        <g transform="scale(1,-1)">
          {locatedRooms.map((room) => (
            <g
              key={room.id}
              style={{ cursor: onRoomClick ? "pointer" : undefined }}
              onClick={() => onRoomClick?.(room.id)}
            >
              {room.polygon ? (
                <path
                  d={`${room.polygon.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`}
                  fill={
                    selectedRoomId === room.id
                      ? "rgba(205,127,50,0.35)"
                      : roomFill(room, mode, roomCosts)
                  }
                  stroke={selectedRoomId === room.id ? "#cd7f32" : "#64748b"}
                  strokeWidth={selectedRoomId === room.id ? 0.8 : 0.35}
                />
              ) : (
                <circle
                  cx={room.centroid!.x}
                  cy={room.centroid!.y}
                  r={roomRadius(room.area)}
                  fill={
                    selectedRoomId === room.id
                      ? "rgba(205,127,50,0.35)"
                      : roomFill(room, mode, roomCosts)
                  }
                  stroke={selectedRoomId === room.id ? "#cd7f32" : "#64748b"}
                  strokeWidth={selectedRoomId === room.id ? 0.8 : 0.35}
                />
              )}
              {layoutAssignments[room.id] != null && room.centroid && (
                <text
                  x={room.centroid.x}
                  y={room.centroid.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={2}
                  fill="#1e293b"
                  fontWeight="bold"
                >
                  {layoutAssignments[room.id]}
                </text>
              )}
            </g>
          ))}

          {annotations.map((ann) => {
            const room = locatedRooms.find((r) => r.id === ann.roomId);
            const pos = ann.position ?? room?.centroid;
            if (!pos) return null;
            return (
              <g key={ann.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r={1.2} fill="#cd7f32" stroke="#fff" strokeWidth={0.3} />
                <circle r={0.4} fill="#fff" />
              </g>
            );
          })}

          {mode === "circulation" && activePath && (
            <>
              <polyline
                points={activePath.points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="#2563eb"
                strokeWidth={0.8}
                strokeDasharray="2 1"
              />
              {activePath.points.map((point, index) => (
                <circle
                  key={`${activePath.id}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={index === 0 || index === activePath.points.length - 1 ? 1.2 : 0.7}
                  fill={index === 0 ? "#16a34a" : index === activePath.points.length - 1 ? "#dc2626" : "#2563eb"}
                />
              ))}
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

export function SpatialPlanViewer(props: {
  previewUrl?: string | null;
  rooms: BimRoomInfo[];
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  analytics?: BimSpatialAnalytics | null;
  mode?: "none" | "circulation" | "cost" | "impact";
  activePathId?: string | null;
  label?: string;
  className?: string;
  selectedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  annotations?: BimSpatialAnnotation[];
  layoutAssignments?: Record<string, number>;
}) {
  const {
    previewUrl, rooms, bounds, analytics, mode, activePathId, label, className,
    selectedRoomId, onRoomClick, annotations, layoutAssignments,
  } = props;

  if (previewUrl) {
    return (
      <FloorPlanOverlayViewer
        previewUrl={previewUrl}
        rooms={rooms}
        bounds={bounds}
        paths={analytics?.circulation.paths}
        activePathId={activePathId}
        roomCosts={analytics?.roomCosts}
        mode={mode}
        label={label}
        className={className}
        selectedRoomId={selectedRoomId}
        onRoomClick={onRoomClick}
        annotations={annotations}
        layoutAssignments={layoutAssignments}
      />
    );
  }

  return (
    <SchematicRoomPlan
      rooms={rooms}
      paths={analytics?.circulation.paths}
      activePathId={activePathId}
      roomCosts={analytics?.roomCosts}
      mode={mode}
      label={label ?? "Schematic plan (IFC centroids)"}
      className={className}
      selectedRoomId={selectedRoomId}
      onRoomClick={onRoomClick}
      annotations={annotations}
      layoutAssignments={layoutAssignments}
    />
  );
}
