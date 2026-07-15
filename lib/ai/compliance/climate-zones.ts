export type ClimateZone =
  | "severe_cold"
  | "cold"
  | "hot_summer_cold_winter"
  | "hot_summer_warm_winter"
  | "unknown";

const CITY_ZONE: Record<string, ClimateZone> = {
  北京: "cold",
  beijing: "cold",
  西安: "cold",
  "xi'an": "cold",
  xian: "cold",
  兰州: "severe_cold",
  银川: "severe_cold",
  哈尔滨: "severe_cold",
  上海: "hot_summer_cold_winter",
  shanghai: "hot_summer_cold_winter",
  南京: "hot_summer_cold_winter",
  杭州: "hot_summer_cold_winter",
  广州: "hot_summer_warm_winter",
  guangzhou: "hot_summer_warm_winter",
  深圳: "hot_summer_warm_winter",
  shenzhen: "hot_summer_warm_winter",
  成都: "hot_summer_cold_winter",
  chengdu: "hot_summer_cold_winter",
};

export function resolveClimateZone(location: string): ClimateZone {
  const lower = location.toLowerCase();
  for (const [key, zone] of Object.entries(CITY_ZONE)) {
    if (location.includes(key) || lower.includes(key.toLowerCase())) {
      return zone;
    }
  }
  return "hot_summer_cold_winter";
}

export function maxWindowUValue(zone: ClimateZone): number {
  switch (zone) {
    case "severe_cold":
      return 2.0;
    case "cold":
      return 2.2;
    case "hot_summer_cold_winter":
      return 2.5;
    case "hot_summer_warm_winter":
      return 3.0;
    default:
      return 2.5;
  }
}

export function minCeilingHeight(targetFunction: string): number {
  const lower = targetFunction.toLowerCase();
  if (targetFunction.includes("教室") || lower.includes("classroom")) return 3.1;
  if (targetFunction.includes("展") || lower.includes("exhibition") || lower.includes("gallery")) {
    return 3.0;
  }
  return 2.8;
}
