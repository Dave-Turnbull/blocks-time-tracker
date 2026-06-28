import { memo } from "react";
import { Cell } from "./Cell/Cell.tsx";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime.tsx";
import { readableDate, readableTime } from "../utils/utils.ts";
import { CellObject } from "../utils/timesToCells.tsx";

interface SingleDayProps {
  dayToRender: string;
  singleDayData: CellObject[];
  selectedCells?: {
    day: string | null;
    StartCell: number | null;
    EndCell: number | null;
  };
  minuteinput: number;
}

const SingleDay = memo(({ dayToRender, singleDayData, selectedCells, minuteinput }: SingleDayProps) => {
  const cellsInGroup = cellGroupTotalTime[minuteinput] / minuteinput;

  const startIndex = selectedCells
    ? Math.min(selectedCells.StartCell ?? 0, selectedCells.EndCell ?? 0)
    : null;
  const endIndex = selectedCells
    ? Math.max(selectedCells.StartCell ?? 0, selectedCells.EndCell ?? 0)
    : null;

  return (
    <div key={dayToRender} className="innercontainer max-w-[1200px]" draggable={false}>
      <h2 className="text-lg font-semibold text-fg-secondary mt-4 mb-2 select-none" draggable={false}>
        {readableDate(dayToRender)}
      </h2>
      <div id="cell-container" className="cell-container flex flex-wrap" draggable={false}>
        {[...Array(Math.ceil(singleDayData.length / cellsInGroup))].map((_, groupIndex) => {
          const start = groupIndex * cellsInGroup;
          const end = start + cellsInGroup;
          const groupOfCells = singleDayData.slice(start, end);
          const totalMinutes = groupIndex * cellGroupTotalTime[minuteinput];

          return (
            <div key={groupIndex} className="cell-group-container m-[1px]">
              <div className="cell-group flex flex-nowrap border-[3px] px-[2px] py-[1px] -mx-[2px] border-solid border-task-group relative rounded-xl">
                {groupOfCells.map((cell, index) => {
                  const cellIndex = index + start;
                  const isSelected =
                    selectedCells &&
                    dayToRender === selectedCells.day &&
                    startIndex !== null &&
                    endIndex !== null &&
                    cellIndex >= startIndex &&
                    cellIndex <= endIndex;
                  const groupPosition =
                    index === 0 ? "start" : index === cellsInGroup - 1 ? "end" : "middle";
                  return (
                    <Cell
                      key={cellIndex}
                      cellIndex={cellIndex}
                      cell={cell}
                      dayToRender={dayToRender}
                      selected={!!isSelected}
                      groupPosition={groupPosition}
                    />
                  );
                })}
              </div>
              <p className="timeLabel text-xs font-bold text-[var(--color-cell-label)] m-0 p-0 ml-[5px]">
                {readableTime(totalMinutes)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default SingleDay;
