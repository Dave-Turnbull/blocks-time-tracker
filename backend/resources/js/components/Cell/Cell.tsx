import { memo, useContext } from "react";
import { ToolbarContext } from "../../contexts/ToolbarContext";
import { SelectedCellsContext } from "../../contexts/SelectCellsContext";
import { SelectedCellOverlay } from "./components/SelectedCellOverlay";
import { CellObject } from "../../utils/timesToCells";
import { GroupPosition, groupRadiusClass } from "./groupRadius";

interface CellProps {
  cellIndex: number;
  cell: CellObject;
  dayToRender: string;
  selected: boolean;
  groupPosition: GroupPosition;
}

export const Cell = memo(({ cellIndex, cell, dayToRender, selected, groupPosition }: CellProps) => {
  const { eraseTool, tasks } = useContext(ToolbarContext);
  const { sidebarHoveredBlockId } = useContext(SelectedCellsContext);
  const radius = groupRadiusClass(groupPosition);
  const isSidebarHovered = sidebarHoveredBlockId !== null &&
    cell.tasks.some((t) => t.id === sidebarHoveredBlockId);

  return (
    <div
      id={`cell-${cellIndex}`}
      draggable={false}
      data-day={dayToRender}
      data-time={cell.startTime}
      data-cell-index={cellIndex}
      className={`w-[calc(var(--day-scale,1)*40px)] h-[calc(var(--day-scale,1)*40px)] bg-cell shadow-cell relative ${radius}`}
    >
      {selected && !eraseTool && (
        <SelectedCellOverlay groupPosition={groupPosition} />
      )}
      {isSidebarHovered && (
        <div
          className={`absolute inset-0 z-[50] pointer-events-none bg-fg/20 ${radius}`}
        />
      )}
      {cell.tasks.length > 0 && !(selected && eraseTool) && (
        <div
          className={`absolute inset-0 overflow-hidden pointer-events-none ${radius}`}
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
