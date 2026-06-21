"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BimCirculationPath,
  BimPoint2D,
  BimRoomCostCell,
  BimRoomInfo,
} from "@/types/bim";
import { costHeatColor, impactHeatColor } from "@/lib/bim/spatial-cost";
import { cn } from "@/lib/utils";

export type FloorPlanOverlayMode = "none" | "circulation" | "cost" | "impact";

interface FloorPlanOverlayViewerProps {
  previewUrl?: string | null;
  rooms: BimRoomInfo[];
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  paths?: BimCirculationPath[];
  activePathId?: string | null;
  roomCosts?: BimRoomCostCell[];
  mode?: FloorPlanOverlayMode;
  label?: string;
  className?: string;
}

function pointsToPath(points: BimPoint2D[]) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function polygonToPath(polygon: BimPoint2D[]) {
  if (polygon.length < 3) return "";
  return `${pointsToPath(polygon)} Z`;
}

function roomFill(
  room: BimRoomInfo,
  mode: FloorPlanOverlayMode,
  roomCosts: BimRoomCostCell[]
) {
  if (mode === "cost") {
    const cell = roomCosts.find((item) => item.roomId === room.id);
    return cell ? costHeatColor(cell.intensity) : "rgba(148,163,184,0.15)";
  }
  if (mode === "impact") {
    const cell = roomCosts.find((item) => item.roomId === room.id);
    return cell ? impactHeatColor(cell.strategyImpact ?? cell.intensity) : "rgba(148,163,184,0.15)";
  }
  return "rgba(148,163,184,0.12)";
}

export function FloorPlanOverlayViewer({
  previewUrl,
  rooms,
  bounds,
  paths = [],
  activePathId,
  roomCosts = [],
  mode = "none",
  label,
  className,
}: FloorPlanOverlayViewerProps) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setSvgMarkup(null);
      return;
    }

    let cancelled = false;
    fetch(previewUrl)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setSvgMarkup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  const viewBox = useMemo(() => {
    if (bounds) {
      const padding = 40;
      const width = bounds.maxX - bounds.minX || 1;
      const height = bounds.maxY - bounds.minY || 1;
      return {
        minX: bounds.minX - padding,
        minY: -(bounds.maxY + padding),
        width: width + padding * 2,
        height: height + padding * 2,
      };
    }

    const match = svgMarkup?.match(/viewBox="([^"]+)"/);
    if (!match) return null;
    const [minX, minY, width, height] = match[1].split(/\s+/).map(Number);
    return { minX, minY, width, height };
  }, [bounds, svgMarkup]);

  const activePath =
    paths.find((path) => path.id === activePathId) ?? paths[0] ?? null;

  if (!previewUrl || !viewBox) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20 text-xs text-muted-foreground",
          className
        )}
      >
        {label ? `${label} — no 2D preview available` : "No floor plan preview available"}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md border bg-[#11151b]", className)}>
      {label && (
        <div className="absolute left-3 top-3 z-10 rounded bg-background/90 px-2 py-1 text-[10px] font-medium shadow-sm">
          {label}
        </div>
      )}
      <svg
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        className="h-full min-h-[320px] w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform="scale(1,-1)">
          {svgMarkup && (
            <g
              dangerouslySetInnerHTML={{
                __html: svgMarkup
                  .replace(/<\?xml[^>]*\?>/, "")
                  .replace(/<svg[^>]*>/, "")
                  .replace(/<\/svg>/, ""),
              }}
            />
          )}

          {mode !== "none" &&
            rooms.map((room) =>
              room.polygon ? (
                <path
                  key={`fill-${room.id}`}
                  d={polygonToPath(room.polygon)}
                  fill={roomFill(room, mode, roomCosts)}
                  stroke="rgba(51,65,85,0.35)"
                  strokeWidth={0.4}
                />
              ) : null
            )}

          {mode === "circulation" && activePath && (
            <>
              <path
                d={pointsToPath(activePath.points)}
                fill="none"
                stroke="#2563eb"
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
              {activePath.points.map((point, index) => (
                <circle
                  key={`${activePath.id}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={index === 0 || index === activePath.points.length - 1 ? 1.8 : 1.1}
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
