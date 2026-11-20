export type GroupPosition = "start" | "end" | "middle" | "single";

export function groupRadiusClass(groupPosition: GroupPosition): string {
  if (groupPosition === "start") return "rounded-l-cell";
  if (groupPosition === "end") return "rounded-r-cell";
  if (groupPosition === "single") return "rounded-cell";
  return "";
}
