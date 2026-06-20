import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatArea(sqm: number): string {
  return `${formatNumber(sqm)} sqm`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateProjectCode(location: string, year: number): string {
  const city = location.split(",")[0]?.trim().slice(0, 2).toUpperCase() ?? "XX";
  const yearSuffix = year.toString().slice(-2);
  const random = Math.floor(Math.random() * 900 + 100);
  return `RC-${city}-${yearSuffix}${random}`;
}

export function scoreColor(score: number): string {
  if (score >= 75) return "text-sage";
  if (score >= 50) return "text-copper";
  return "text-destructive";
}

export function scoreRingColor(score: number): string {
  if (score >= 75) return "stroke-sage";
  if (score >= 50) return "stroke-copper";
  return "stroke-destructive";
}

export function levelToPercent(level: string): number {
  const map: Record<string, number> = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
    urgent: 95,
    premium: 85,
  };
  return map[level] ?? 50;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
