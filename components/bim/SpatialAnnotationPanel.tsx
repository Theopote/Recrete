"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BimAnnotationCategory, BimRoomInfo, BimSpatialAnnotation } from "@/types/bim";
import { MapPin, Plus, Tag } from "lucide-react";

const CATEGORY_LABELS: Record<BimAnnotationCategory, string> = {
  structure: "结构",
  heritage: "文保",
  mep: "机电",
  program: "功能",
  fire_safety: "消防",
  note: "备注",
};

const CATEGORY_COLORS: Record<BimAnnotationCategory, string> = {
  structure: "bg-blue-500/15 text-blue-400",
  heritage: "bg-amber-500/15 text-amber-400",
  mep: "bg-purple-500/15 text-purple-400",
  program: "bg-emerald-500/15 text-emerald-400",
  fire_safety: "bg-red-500/15 text-red-400",
  note: "bg-muted text-muted-foreground",
};

interface SpatialAnnotationPanelProps {
  projectId: string;
  modelId: string;
  rooms: BimRoomInfo[];
  selectedRoomId?: string | null;
  onRoomSelect?: (roomId: string) => void;
}

export function SpatialAnnotationPanel({
  projectId,
  modelId,
  rooms,
  selectedRoomId,
  onRoomSelect,
}: SpatialAnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<BimSpatialAnnotation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<BimAnnotationCategory>("note");

  const loadAnnotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/bim-models/${modelId}/annotations`);
      if (res.ok) {
        const data = await res.json();
        setAnnotations(
          (data.annotations as BimSpatialAnnotation[]).map((a) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          }))
        );
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  if (!loaded && !loading) {
    void loadAnnotations();
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const roomAnnotations = selectedRoomId
    ? annotations.filter((a) => a.roomId === selectedRoomId)
    : annotations;

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/bim-models/${modelId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoomId ?? null,
        roomLabel: selectedRoom?.label ?? null,
        category,
        title,
        content,
        position: selectedRoom?.centroid ?? null,
      }),
    });
    if (res.ok) {
      setTitle("");
      setContent("");
      setShowForm(false);
      await loadAnnotations();
    }
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-copper" />
          <span className="font-medium">空间标注</span>
          <Badge variant="outline">{annotations.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {selectedRoom && (
        <p className="text-muted-foreground">
          选中房间：<span className="text-foreground font-medium">{selectedRoom.label}</span>
          <span className="ml-1">· 点击平面图切换房间</span>
        </p>
      )}

      {showForm && (
        <div className="rounded-md border p-3 space-y-2">
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5"
            value={category}
            onChange={(e) => setCategory(e.target.value as BimAnnotationCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标注标题"
            className="w-full rounded-md border bg-background px-2 py-1.5"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="专业批注内容（结构/文保/机电/功能…）"
            rows={3}
            className="w-full rounded-md border bg-background px-2 py-1.5 resize-none"
          />
          <Button size="sm" onClick={handleCreate} disabled={!title.trim() || !content.trim()}>
            保存标注
          </Button>
        </div>
      )}

      {loading && <p className="text-muted-foreground">Loading annotations…</p>}

      <div className="max-h-[280px] overflow-y-auto space-y-2">
        {roomAnnotations.length === 0 && loaded && (
          <p className="text-muted-foreground">暂无标注。在平面图上点击房间后添加专业批注。</p>
        )}
        {roomAnnotations.map((ann) => (
          <button
            key={ann.id}
            type="button"
            className="w-full rounded-md border p-2 text-left hover:bg-muted/40 transition-colors"
            onClick={() => ann.roomId && onRoomSelect?.(ann.roomId)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Badge className={CATEGORY_COLORS[ann.category]}>{CATEGORY_LABELS[ann.category]}</Badge>
              <span className="font-medium truncate">{ann.title}</span>
            </div>
            <p className="text-muted-foreground line-clamp-2">{ann.content}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {ann.authorName}
              {ann.roomLabel && ` · ${ann.roomLabel}`}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {rooms.slice(0, 6).map((room) => {
          const count = annotations.filter((a) => a.roomId === room.id).length;
          if (count === 0) return null;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onRoomSelect?.(room.id)}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] border ${
                selectedRoomId === room.id ? "border-copper bg-copper/10" : "hover:bg-muted/40"
              }`}
            >
              <MapPin className="h-2.5 w-2.5" />
              {room.label.split("/")[0]?.trim()} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
