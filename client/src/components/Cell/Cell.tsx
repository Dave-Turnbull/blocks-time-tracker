import { memo } from "react";
import { useContext } from "react";
import { ToolbarContext } from "../../contexts/ToolbarContext";
import { SelectedCellOverlay } from "./components/SelectedCellOverlay";
import styled from "styled-components";

export const Cell = memo(({ cellIndex, cell, dayToRender, selected, groupPosition = null }) => {
  const { pickedColor, eraseTool, tasks } = useContext(ToolbarContext);
  return (
    <CellContainer
      id={`cell-${cellIndex}`}
      draggable="false"
      key={cellIndex}
      data-day={dayToRender}
      data-time={cell.startTime}
      data-cell-index={cellIndex}
      groupPosition={groupPosition}
    >
      {selected && !eraseTool && (
        <SelectedCellOverlay pickedColor={pickedColor} groupPosition={groupPosition}/>
      )}
      {cell.tasks.length > 0 && !(selected && eraseTool) && (
        <InnerCellContainer groupPosition={groupPosition}>
          {cell.tasks.map((task) => {
            const cellProps = cell.getCellProps(task, tasks[task.taskID].color)
            return (
              <InnerCell
                {...cellProps}
                data-key={task.id}
              />
            )
          })}
        </InnerCellContainer>
      )}
    </CellContainer>
  );
});

const CellContainer = styled.div<{groupPosition: string}>`
  width: 40px;
  height: 40px;
  background-color: rgb(170, 170, 170);
  margin: 1px;
  position: relative;
  border-radius: ${props => {
    if (props.groupPosition === 'start') {
      return `10px 0 0 10px;`
    }
    if (props.groupPosition === 'end') {
      return `0 10px 10px 0;`
    }
  }}
`

const InnerCellContainer = styled.div<{groupPosition: string}>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: ${props => {
    if (props.groupPosition === 'start') {
      return `10px 0 0 10px;`
    }
    if (props.groupPosition === 'end') {
      return `0 10px 10px 0;`
    }
  }}
`

const InnerCell = styled.div`
  height: 100%;
  position: absolute;
  pointer-events: none;
`