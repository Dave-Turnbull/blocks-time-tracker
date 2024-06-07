import { useContext } from "react";
import { ToolbarContext } from "../../contexts/ToolbarContext";
import { ActiveCellsContext } from "../../contexts/SelectCellsContext";
import { SelectedCellOverlay } from "./components/SelectedCellOverlay";

export const Cell = ({ cellIndex, cell, dayToRender, selected }) => {
  const { pickedColor, eraseTool, tasks } = useContext(ToolbarContext);
  const { activeCells } = useContext(ActiveCellsContext);

  return (
    <div
      id={`cell-${cellIndex}`}
      draggable="false"
      key={cellIndex}
      className="cell"
      data-day={dayToRender}
      data-time={cell.time} //change
      data-cell-index={cellIndex}
    >
      {selected && !eraseTool && (
        <SelectedCellOverlay pickedColor={pickedColor} />
      )}
      {cell.length > 0 && !(selected && eraseTool) && (
        <div className="innerCellContainer">
          {cell.map((part) => (
            <div
              key={part.id}
              className={"innercell"}
              style={{
                ...part.style,
                backgroundColor: tasks[part.taskID].color,
              }}
              data-key={part.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
