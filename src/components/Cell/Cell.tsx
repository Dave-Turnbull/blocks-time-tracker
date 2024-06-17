import { useContext } from "react";
import { ToolbarContext } from "../../contexts/ToolbarContext";
import { SelectedCellOverlay } from "./components/SelectedCellOverlay";

export const Cell = ({ cellIndex, cell, dayToRender, selected }) => {
  const { pickedColor, eraseTool, tasks } = useContext(ToolbarContext);
  console.log(cell)
  return (
    <div
      id={`cell-${cellIndex}`}
      draggable="false"
      key={cellIndex}
      className="cell"
      data-day={dayToRender}
      data-time={cell.startTime} //change
      data-cell-index={cellIndex}
    >
      {selected && !eraseTool && (
        <SelectedCellOverlay pickedColor={pickedColor} />
      )}
      {cell.tasks.length > 0 && !(selected && eraseTool) && (
        <div className="innerCellContainer">
          {cell.tasks.map((task) => (
            <div
              className={"innercell"}
              {...cell.getCellProps(tasks[task.taskID].color)}
              data-key={task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
