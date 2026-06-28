import { memo, useContext } from "react";
import { ToolbarContext } from "../../contexts/ToolbarContext";
import { SelectedCellsContext } from "../../contexts/SelectCellsContext";
import { SelectedCellOverlay } from "./components/SelectedCellOverlay";
import { CellObject } from "../../utils/timesToCells";

type GroupPosition = "start" | "end" | "middle";

interface CellProps {
  cellIndex: number;
  cell: CellObject;
  dayToRender: string;
  selected: boolean;
  groupPosition: GroupPosition;
}

function getBorderRadius(groupPosition: GroupPosition): string {
  if (groupPosition === "start") return "10px 0 0 10px";
  if (groupPosition === "end") return "0 10px 10px 0";
  return "";
}

export const Cell = memo(({ cellIndex, cell, dayToRender, selected, groupPosition }: CellProps) => {
  const { eraseTool, tasks } = useContext(ToolbarContext);
  const { sidebarHoveredBlockId } = useContext(SelectedCellsContext);
  const borderRadius = getBorderRadius(groupPosition);
  const isSidebarHovered = sidebarHoveredBlockId !== null &&
    cell.tasks.some((t) => t.id === sidebarHoveredBlockId);

  return (
    <div
      id={`cell-${cellIndex}`}
      draggable={false}
      data-day={dayToRender}
      data-time={cell.startTime}
      data-cell-index={cellIndex}
      className="w-10 h-10 bg-[rgb(170,170,170)] m-[1px] relative"
      style={borderRadius ? { borderRadius } : undefined}
    >
      {selected && !eraseTool && (
        <SelectedCellOverlay groupPosition={groupPosition} />
      )}
      {isSidebarHovered && (
        <div
          className="absolute inset-0 z-[50] pointer-events-none bg-yellow-300/50"
          style={borderRadius ? { borderRadius } : undefined}
        />
      )}
      {cell.tasks.length > 0 && !(selected && eraseTool) && (
        <div
          className="absolute top-0 left-0 bottom-0 right-0 overflow-hidden pointer-events-none"
          style={borderRadius ? { borderRadius } : undefined}
        >
          {cell.tasks.map((task) => {
            const taskData = tasks[task.taskID];
            if (!taskData) return null;
            const cellProps = cell.getCellProps(task, taskData.color);
            return (
              <div
                {...cellProps}
                key={task.startTime}
                data-key={task.taskID}
                className="h-full absolute pointer-events-none"
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
