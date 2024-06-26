import { useState, useEffect, useContext } from "react";
import { ActiveCellsContext } from "../contexts/SelectCellsContext.tsx"; // Import the context
import { Cell } from "./Cell/Cell.tsx";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime.tsx";
import { ToolbarContext } from "../contexts/ToolbarContext.tsx";
import styled from "styled-components";
import { readableDate } from "../utils/utils.ts";

const SingleDay = ({ dayToRender, singleDayData }) => {
  const { activeCells } = useContext(ActiveCellsContext);
  const { minuteinput } = useContext(ToolbarContext);

  const cellsInGroup = cellGroupTotalTime[minuteinput] / minuteinput;

  //ensures that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

  return (
    <SingleDayWrapper key={dayToRender} className="innercontainer" draggable="false">
      <h2 draggable="false">{readableDate(dayToRender)}</h2>
      <CellContainer id="cell-container" className="cell-container" draggable="false">
        {[...Array(Math.ceil(singleDayData.length / cellsInGroup))].map(
          (_, groupIndex) => {
            const start = groupIndex * cellsInGroup;
            const end = start + cellsInGroup;
            const groupOfCells = singleDayData.slice(start, end);

            // Generate the time label for this group
            const totalMinutes = groupIndex * cellGroupTotalTime[minuteinput];
            const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
            const minutes = String(totalMinutes % 60).padStart(2, "0");
            const timeLabel = `${hours}:${minutes}`;

            return (
              <CellGroupContainer key={groupIndex} className="cell-group-container">
                <CellGroup className="cell-group">
                  {groupOfCells.map((cell, index) => {
                    const cellIndex = index + start;
                    const isSelected =
                      activeCells &&
                      dayToRender === activeCells.day &&
                      cellIndex >= startIndex &&
                      cellIndex <= endIndex;
                    const groupPosition = index === 0 ? 'start' : index === cellsInGroup -1 ? 'end' : 'middle'
                    return (
                      <Cell
                        cellIndex={cellIndex}
                        cell={cell}
                        dayToRender={dayToRender}
                        selected={isSelected}
                        groupPosition={groupPosition}
                      />
                    );
                  })}
                </CellGroup>
                <TimeLabel className="timeLabel">{timeLabel}</TimeLabel>
              </CellGroupContainer>
            );
          }
        )}
      </CellContainer>
    </SingleDayWrapper>
  );
};

const SingleDayWrapper = styled.div`
  max-width: 1200px;
`

const CellContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const CellGroupContainer = styled.div`
  margin: 1px;
`

const CellGroup = styled.div`
  display: flex;
  flex-wrap: nowrap;
  border: 3px;
  padding: 1px 2px;
  margin: 0 -2px;
  border-style: solid;
  border-color: #cf2e27;
  position: relative;
  border-radius: 12px;
`

const TimeLabel = styled.p`
  font-size: 0.9rem;
  font-weight: 700;
  color: #00000073;
  margin: 0;
  padding: 0;
  margin-left: 5px;
`

export default SingleDay;
