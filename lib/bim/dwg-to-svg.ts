import type { DwgDatabase } from "@mlightcad/libredwg-web";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface DwgEntityBase {
  type: string;
  isVisible?: boolean;
  color?: number;
}

interface DwgLineEntity extends DwgEntityBase {
  type: "LINE";
  startPoint: Point3D;
  endPoint: Point3D;
}

interface DwgLWPolylineEntity extends DwgEntityBase {
  type: "LWPOLYLINE";
  flag: number;
  vertices: { x: number; y: number }[];
}

interface DwgCircleEntity extends DwgEntityBase {
  type: "CIRCLE";
  center: Point3D;
  radius: number;
}

interface DwgArcEntity extends DwgEntityBase {
  type: "ARC";
  center: Point3D;
  radius: number;
  startAngle: number;
  endAngle: number;
}

type DwgEntity =
  | DwgLineEntity
  | DwgLWPolylineEntity
  | DwgCircleEntity
  | DwgArcEntity
  | DwgEntityBase;

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const DEFAULT_BOUNDS: Bounds = { minX: -1, minY: -1, maxX: 1, maxY: 1 };

function expandBounds(bounds: Bounds, x: number, y: number) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function computeBounds(entities: DwgEntity[]): Bounds {
  const bounds = { ...DEFAULT_BOUNDS };
  let touched = false;

  for (const entity of entities) {
    if (entity.isVisible === false) continue;

    if (entity.type === "LINE") {
      const line = entity as DwgLineEntity;
      expandBounds(bounds, line.startPoint.x, line.startPoint.y);
      expandBounds(bounds, line.endPoint.x, line.endPoint.y);
      touched = true;
    } else if (entity.type === "LWPOLYLINE") {
      const poly = entity as DwgLWPolylineEntity;
      for (const v of poly.vertices ?? []) {
        expandBounds(bounds, v.x, v.y);
        touched = true;
      }
    } else if (entity.type === "CIRCLE") {
      const circle = entity as DwgCircleEntity;
      expandBounds(bounds, circle.center.x - circle.radius, circle.center.y - circle.radius);
      expandBounds(bounds, circle.center.x + circle.radius, circle.center.y + circle.radius);
      touched = true;
    } else if (entity.type === "ARC") {
      const arc = entity as DwgArcEntity;
      expandBounds(bounds, arc.center.x - arc.radius, arc.center.y - arc.radius);
      expandBounds(bounds, arc.center.x + arc.radius, arc.center.y + arc.radius);
      touched = true;
    }
  }

  return touched ? bounds : DEFAULT_BOUNDS;
}

function entityColor(entity: DwgEntity): string {
  if (entity.color !== undefined) {
    const b = entity.color & 0xff;
    const g = (entity.color >> 8) & 0xff;
    const r = (entity.color >> 16) & 0xff;
    return `rgb(${r},${g},${b})`;
  }
  return "#334155";
}

function arcPath(arc: DwgArcEntity): string {
  const { center, radius, startAngle, endAngle } = arc;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = center.x + radius * Math.cos(startRad);
  const y1 = center.y + radius * Math.sin(startRad);
  const x2 = center.x + radius * Math.cos(endRad);
  const y2 = center.y + radius * Math.sin(endRad);
  let delta = endAngle - startAngle;
  if (delta < 0) delta += 360;
  const largeArc = delta > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function entityToSvg(entity: DwgEntity): string | null {
  if (entity.isVisible === false) return null;
  const stroke = entityColor(entity);

  if (entity.type === "LINE") {
    const line = entity as DwgLineEntity;
    return `<line x1="${line.startPoint.x}" y1="${line.startPoint.y}" x2="${line.endPoint.x}" y2="${line.endPoint.y}" stroke="${stroke}" stroke-width="0.5" fill="none" />`;
  }

  if (entity.type === "LWPOLYLINE") {
    const poly = entity as DwgLWPolylineEntity;
    if (!poly.vertices?.length) return null;
    const points = poly.vertices.map((v) => `${v.x},${v.y}`).join(" ");
    const closed = (poly.flag & 1) === 1 ? " Z" : "";
    return `<polyline points="${points}${closed}" stroke="${stroke}" stroke-width="0.5" fill="none" />`;
  }

  if (entity.type === "CIRCLE") {
    const circle = entity as DwgCircleEntity;
    return `<circle cx="${circle.center.x}" cy="${circle.center.y}" r="${circle.radius}" stroke="${stroke}" stroke-width="0.5" fill="none" />`;
  }

  if (entity.type === "ARC") {
    return `<path d="${arcPath(entity as DwgArcEntity)}" stroke="${stroke}" stroke-width="0.5" fill="none" />`;
  }

  return null;
}

export function dwgDatabaseToSvg(db: DwgDatabase, padding = 40): { svg: string; bounds: Bounds } {
  const entities = (db.entities ?? []) as DwgEntity[];
  const bounds = computeBounds(entities);
  const width = bounds.maxX - bounds.minX || 1;
  const height = bounds.maxY - bounds.minY || 1;
  const viewW = width + padding * 2;
  const viewH = height + padding * 2;
  const viewBox = `${bounds.minX - padding} ${-(bounds.maxY + padding)} ${viewW} ${viewH}`;

  const shapes = entities
    .map(entityToSvg)
    .filter((s): s is string => Boolean(s))
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <g transform="scale(1,-1)">
    <rect x="${bounds.minX - padding}" y="${bounds.minY - padding}" width="${viewW}" height="${viewH}" fill="#f8fafc" />
    ${shapes}
  </g>
</svg>`;

  return { svg, bounds };
}
