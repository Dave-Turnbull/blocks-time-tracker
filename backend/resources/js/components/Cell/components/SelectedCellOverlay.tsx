type GroupPosition = "start" | "end" | "middle";

interface SelectedCellOverlayProps {
  groupPosition: GroupPosition;
}

function getBorderRadius(groupPosition: GroupPosition): string {
  if (groupPosition === "start") return "10px 0 0 10px";
  if (groupPosition === "end") return "0 10px 10px 0";
  return "0";
}

export const SelectedCellOverlay = ({ groupPosition }: SelectedCellOverlayProps) => {
  return (
    <div
      className="overlay pointer-events-none z-[100] absolute inset-0 bg-blue-500/60"
      draggable={false}
      style={{
        borderRadius: getBorderRadius(groupPosition),
        animation: "overlayPulse 0.2s ease-in-out",
      }}
    />
  );
};
