import React, { useState, useEffect, useContext } from "react";
import { ActiveCellsContext } from "./mouseeventhandler.js"; // Import the context

const Day = ({ dayToRender, FullData, encodeCells, pickedColor }) => {
  const activeCells = useContext(ActiveCellsContext);
  const [cellsData, setCellsData] = useState([]);

  useEffect(() => {
    let foundData = FullData.find((day) => day.date === dayToRender);
    let timeData = foundData ? foundData.intervals : [];
    setCellsData(encodeCells(timeData));
  }, [dayToRender, FullData]);

  useEffect(() => {
    console.log(cellsData);
  }, [cellsData]);

  //ensure that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

  return (
    <div className="innercontainer" draggable="false">
      <h1 draggable="false">{dayToRender}</h1>
      <div className="cell-container" draggable="false">
        {cellsData.map((cell, index) => (
          <div
            id={`cell-${index}`}
            draggable="false"
            key={index}
            className={cell.className}
            style={cell.style}
            data-day={dayToRender}
            data-cell-index={index}
          >
            {activeCells &&
              dayToRender === activeCells.day &&
              index >= startIndex &&
              index <= endIndex && (
                <div
                  className="overlay"
                  draggable="false"
                  style={{
                    zIndex: 100,
                    right: "0%",
                    left: "0%",
                    position: "absolute",
                    top: "0%",
                    bottom: "0%",
                    backgroundColor: pickedColor,
                  }}
                />
              )}
            {cell.partialData &&
              cell.partialData.map((part) => (
                <div
                  key={part.key}
                  className={part.className}
                  style={part.style}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Day;
