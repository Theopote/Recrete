import type { DrawingAssetRecord } from "@/types/drawing";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

/** Demo drawing assets for mock mode — linked to proj-demo documents */
export const mockDrawingAssets: DrawingAssetRecord[] = [
  {
    id: "drawing-demo-floor-1",
    documentId: "doc-1",
    projectId: "proj-demo",
    pageNumber: 1,
    drawingType: "floor_plan",
    scale: "1:100",
    modelName: "vision-mock",
    confidence: 0.85,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
    analysisResult: {
      drawingType: "floor_plan",
      scale: "1:100",
      orientation: "North up",
      rooms: [
        {
          id: "R101",
          label: "办公室 Office",
          area: 45.2,
          function: "office",
          dimensions: { width: 6.5, height: 7.0 },
          location: { x: 80, y: 120, width: 220, height: 260 },
        },
        {
          id: "R102",
          label: "会议室 Meeting Room",
          area: 32.8,
          function: "meeting",
          dimensions: { width: 5.2, height: 6.3 },
          location: { x: 320, y: 120, width: 200, height: 240 },
        },
        {
          id: "R103",
          label: "走廊 Corridor",
          area: 18.5,
          function: "circulation",
          location: { x: 300, y: 120, width: 24, height: 260 },
        },
      ],
      dimensions: [
        { value: 6.5, unit: "m", type: "length", location: { x: 80, y: 90, width: 220, height: 18 } },
        { value: 7.0, unit: "m", type: "width", location: { x: 55, y: 120, width: 18, height: 260 } },
      ],
      annotations: [
        {
          text: "混凝土框架结构 RC Frame",
          type: "specification",
          location: { x: 60, y: 40, width: 200, height: 28 },
        },
        {
          text: "主入口 Main Entry",
          type: "label",
          location: { x: 180, y: 400, width: 80, height: 24 },
        },
      ],
      structuralElements: [
        {
          type: "column",
          id: "C1",
          size: "500×500",
          material: "concrete",
          location: { x: 76, y: 116, width: 12, height: 12 },
        },
        {
          type: "column",
          id: "C2",
          size: "500×500",
          material: "concrete",
          location: { x: 288, y: 116, width: 12, height: 12 },
        },
        {
          type: "beam",
          id: "B1",
          size: "300×600",
          material: "concrete",
          location: { x: 80, y: 112, width: 220, height: 8 },
        },
      ],
      extractedText: ["平面图 Floor Plan", "比例 Scale 1:100", "1986 建成"],
      confidence: 0.85,
      summary:
        "1986 年钢筋混凝土框架办公建筑标准层平面图。识别 3 个主要空间分区、2 根框架柱及主梁位置。",
    },
  },
  {
    id: "drawing-demo-elev-1",
    documentId: "doc-1",
    projectId: "proj-demo",
    pageNumber: 2,
    drawingType: "elevation",
    scale: "1:100",
    modelName: "vision-mock",
    confidence: 0.78,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
    analysisResult: {
      drawingType: "elevation",
      scale: "1:100",
      orientation: "South elevation",
      rooms: [],
      dimensions: [
        { value: 24.6, unit: "m", type: "height", location: { x: 120, y: 60, width: 360, height: 20 } },
      ],
      annotations: [
        {
          text: "外立面瓷砖脱落 Spalling tiles",
          type: "note",
          location: { x: 280, y: 200, width: 100, height: 60 },
        },
        {
          text: "铝合金窗 2003 更换",
          type: "specification",
          location: { x: 160, y: 180, width: 80, height: 50 },
        },
      ],
      structuralElements: [
        {
          type: "slab",
          id: "S1",
          size: "120mm",
          material: "concrete",
          location: { x: 100, y: 140, width: 400, height: 6 },
        },
      ],
      extractedText: ["南立面 South Elevation", "檐口高度 24.6m"],
      confidence: 0.78,
      summary: "南向立面图。识别檐口高度 24.6m，南立面瓷砖局部空鼓脱落区域及 2003 年更换铝合金窗。",
    },
  },
  {
    id: "drawing-demo-struct-1",
    documentId: "doc-3",
    projectId: "proj-demo",
    pageNumber: 1,
    drawingType: "structural",
    scale: "1:50",
    modelName: "vision-mock",
    confidence: 0.82,
    createdAt: daysAgo(24),
    updatedAt: daysAgo(24),
    analysisResult: {
      drawingType: "structural",
      scale: "1:50",
      rooms: [],
      dimensions: [],
      annotations: [
        {
          text: "框架柱 C1–C12 需复核承载力",
          type: "note",
          location: { x: 40, y: 380, width: 240, height: 30 },
        },
      ],
      structuralElements: [
        {
          type: "column",
          id: "C1",
          size: "500×500 C30",
          material: "concrete",
          location: { x: 100, y: 100, width: 20, height: 20 },
        },
        {
          type: "column",
          id: "C2",
          size: "500×500 C30",
          material: "concrete",
          location: { x: 300, y: 100, width: 20, height: 20 },
        },
        {
          type: "wall",
          id: "W1",
          size: "200mm shear wall",
          material: "concrete",
          location: { x: 95, y: 95, width: 230, height: 10 },
        },
      ],
      extractedText: ["结构平面 Structural Plan", "C30 混凝土"],
      confidence: 0.82,
      summary: "结构平面布置图。识别框架柱、剪力墙位置；报告建议对 C1–C12 柱承载力进行复核。",
    },
  },
  {
    id: "drawing-demo-mep-1",
    documentId: "doc-4",
    projectId: "proj-demo",
    pageNumber: 1,
    drawingType: "mep",
    scale: "1:100",
    modelName: "vision-mock",
    confidence: 0.74,
    createdAt: daysAgo(33),
    updatedAt: daysAgo(33),
    analysisResult: {
      drawingType: "mep",
      scale: "1:100",
      rooms: [],
      dimensions: [],
      annotations: [
        {
          text: "空调机房 AC Plant Room",
          type: "label",
          location: { x: 360, y: 280, width: 120, height: 80 },
        },
        {
          text: "配电间 Electrical — 容量不足",
          type: "note",
          location: { x: 80, y: 300, width: 140, height: 50 },
        },
      ],
      structuralElements: [],
      extractedText: ["MEP As-Built", "VRF 系统 2003"],
      confidence: 0.74,
      summary: "机电综合平面图（2003 年改造部分）。识别空调机房、配电间；配电容量可能不满足现行负荷需求。",
    },
  },
];

export function mockDrawingAssetsByProject(projectId: string): DrawingAssetRecord[] {
  return mockDrawingAssets.filter((a) => a.projectId === projectId);
}
