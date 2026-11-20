import { memo } from "react";
import { Cell } from "./Cell/Cell.tsx";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime.tsx";
import { readableDateParts, readableTime } from "../utils/utils.ts";
import { CellObject } from "../utils/timesToCells.tsx";
import { GroupPosition } from "./Cell/groupRadius.ts";

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

  const { weekday, day, suffix, month, year } = readableDateParts(dayToRender);

  return (
    <div key={dayToRender} className="innercontainer" draggable={false}>
      <h2 className="flex items-baseline gap-2 text-5xl leading-none m-0 mb-3 select-none" draggable={false}>
        <span className="font-bold text-fg">{weekday}</span>
        <span className="font-normal text-fg">
          {day}
          <sup>{suffix}</sup>
        </span>
        <span className="font-normal text-muted">{month} {year}</span>
      </h2>
      {/* The time labels hang ~8px below each group's border; pb and gap-y leave room for that. */}
      <div id="cell-container" className="cell-container flex flex-wrap gap-x-1 gap-y-3 pb-2" draggable={false}>
        {[...Array(Math.ceil(singleDayData.length / cellsInGroup))].map((_, groupIndex) => {
          const start = groupIndex * cellsInGroup;
          const end = start + cellsInGroup;
          const groupOfCells = singleDayData.slice(start, end);
          const totalMinutes = groupIndex * cellGroupTotalTime[minuteinput];

          return (
            <div key={groupIndex} className="cell-group-container relative border border-outline rounded-group p-[2px] mb-1">
              {/* Overlaps the bottom border by 3px with the canvas behind it, cutting a notch in the line.
                  left-[10px] starts the notch where the 11px corner curve ends. */}
              <span className="timeLabel absolute top-[calc(100%-3px)] left-[10px] px-1 bg-canvas text-sm leading-none text-outline select-none pointer-events-none">
                {readableTime(totalMinutes)}
              </span>
              <div className="cell-group flex flex-nowrap gap-[2px] relative">
                {groupOfCells.map((cell, index) => {
                  const cellIndex = index + start;
                  const isSelected =
                    selectedCells &&
                    dayToRender === selectedCells.day &&
                    startIndex !== null &&
                    endIndex !== null &&
                    cellIndex >= startIndex &&
                    cellIndex <= endIndex;
                  const groupPosition: GroupPosition =
                    cellsInGroup === 1 ? "single"
                    : index === 0 ? "start"
                    : index === cellsInGroup - 1 ? "end"
                    : "middle";
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
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default SingleDay;
