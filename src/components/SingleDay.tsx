import { useState, useEffect, useContext } from "react";
import { ActiveCellsContext } from "../contexts/SelectCellsContext.tsx"; // Import the context
import timesToCells from "../utils/timesToCells.tsx";
import { Cell } from "./Cell/Cell.tsx";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime.tsx";
import { ToolbarContext } from "../contexts/ToolbarContext.tsx";

const SingleDay = ({ dayToRender, singleDayData }) => {
  const { activeCells } = useContext(ActiveCellsContext);
  const { minuteinput } = useContext(ToolbarContext);
  const [cellsData, setCellsData] = useState([]);

  const cellsInGroup = cellGroupTotalTime[minuteinput] / minuteinput;

  //Triggers encoding the cells when a day or interval is selected, or the full data changes
  useEffect(() => {
    setCellsData(timesToCells(singleDayData, minuteinput));
  }, [dayToRender, singleDayData, minuteinput]);

  //ensures that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

  return (
    <div key={dayToRender} className="innercontainer" draggable="false">
      <h1 draggable="false">{dayToRender}</h1>
      <div id="cell-container" className="cell-container" draggable="false">
        {[...Array(Math.ceil(cellsData.length / cellsInGroup))].map(
          (_, groupIndex) => {
            const start = groupIndex * cellsInGroup;
            const end = start + cellsInGroup;
            const groupOfCells = cellsData.slice(start, end);

            // Generate the time label for this group
            const totalMinutes = groupIndex * cellGroupTotalTime[minuteinput];
            const hours = String(Math.floor(totalMinutes / 60)).padStart(
              2,
              "0"
            );
            const minutes = String(totalMinutes % 60).padStart(2, "0");
            const timeLabel = `${hours}:${minutes}`;

            return (
              <div key={groupIndex} className="groupContainer">
                <div className="cellsGroup">
                  {groupOfCells.map((cell, index) => {
                    const cellIndex = index + start;
                    const isSelected =
                      activeCells &&
                      dayToRender === activeCells.day &&
                      cellIndex >= startIndex &&
                      cellIndex <= endIndex;
                    return (
                      <Cell
                        cellIndex={cellIndex}
                        cell={cell}
                        dayToRender={dayToRender}
                        selected={isSelected}
                      />
                    );
                  })}
                </div>
                <div className="timeLabel">{timeLabel}</div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default SingleDay;
