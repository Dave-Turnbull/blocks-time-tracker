import { GroupPosition, groupRadiusClass } from "../groupRadius";

interface SelectedCellOverlayProps {
  groupPosition: GroupPosition;
}

export const SelectedCellOverlay = ({ groupPosition }: SelectedCellOverlayProps) => {
  return (
    <div
      className={`overlay pointer-events-none z-[100] absolute inset-0 bg-fg/35 ${groupRadiusClass(groupPosition)}`}
      draggable={false}
      style={{ animation: "overlayPulse 0.2s ease-in-out" }}
    />
  );
};
