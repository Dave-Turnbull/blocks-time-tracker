import React, { useState, useEffect, useContext, useRef } from "react";
import { ActiveCellsContext } from "./mouseeventhandler.js"; // Import the context
import encodeCells from "./cellencoder";
import timesheetData from "../data/timesheet.json";

const Day = ({ dayToRender, pickedColor, taskTitle, minuteinput }) => {
  const { activeCells, activeTime } = useContext(ActiveCellsContext);
  const [FullData, setFullData] = useState(timesheetData);
  const [cellsData, setCellsData] = useState([]);
  const intervalObjects = useRef([
    { interval: 1, sortingInterval: 5 },
    { interval: 2, sortingInterval: 10 },
    { interval: 3, sortingInterval: 15 },
    { interval: 4, sortingInterval: 20 },
    { interval: 5, sortingInterval: 30 },
    { interval: 6, sortingInterval: 30 },
    { interval: 8, sortingInterval: 80 },
    { interval: 9, sortingInterval: 45 },
    { interval: 10, sortingInterval: 60 },
    { interval: 12, sortingInterval: 60 },
    { interval: 15, sortingInterval: 60 },
    { interval: 16, sortingInterval: 80 },
    { interval: 18, sortingInterval: 90 },
    { interval: 20, sortingInterval: 60 },
    { interval: 24, sortingInterval: 120 },
    { interval: 30, sortingInterval: 60 },
    { interval: 32, sortingInterval: 160 },
    { interval: 36, sortingInterval: 180 },
    { interval: 40, sortingInterval: 360 },
    { interval: 45, sortingInterval: 360 },
    { interval: 48, sortingInterval: 240 },
    { interval: 60, sortingInterval: 360 },
    { interval: 72, sortingInterval: 360 },
    { interval: 80, sortingInterval: 240 },
    { interval: 90, sortingInterval: 360 },
    { interval: 96, sortingInterval: 480 },
    { interval: 120, sortingInterval: 480 },
    { interval: 144, sortingInterval: 720 },
    { interval: 160, sortingInterval: 320 },
    { interval: 180, sortingInterval: 720 },
    { interval: 240, sortingInterval: 720 },
    { interval: 288, sortingInterval: 1440 },
    { interval: 360, sortingInterval: 720 },
    { interval: 480, sortingInterval: 1440 },
    { interval: 720, sortingInterval: 1440 },
    { interval: 1440, sortingInterval: 1440 },
  ]);

  let sortingInterval = intervalObjects.current.find(
    (obj) => obj.interval == minuteinput
  ).sortingInterval;
  let cellsInGroup = sortingInterval / minuteinput;

  useEffect(() => {
    let foundDay = FullData.find((day) => Object.keys(day)[0] === dayToRender);
    let timeData = foundDay ? Object.values(foundDay)[0] : [];
    setCellsData(encodeCells(timeData, minuteinput));
  }, [dayToRender, FullData, minuteinput]);

  useEffect(() => {
    console.log("Active time: ", activeTime);
  }, [activeTime]);

  //ensure that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

  const updateData = (activeTime, FullData, taskTitle, pickedColor) => {
    // Create a copy of FullData to mutate
    let newData = [...FullData];

    // Iterate over each day in activeTime
    for (const day in activeTime) {
      // Find index of day in newData
      const dayIndex = newData.findIndex(
        (dayData) => Object.keys(dayData)[0] === day
      );

      // If the day already exists in the data
      if (dayIndex !== -1) {
        // Update the day data with activeTime for the day
        // Also, update the color of the new time block with pickedColor
        newData[dayIndex][day] = [
          ...newData[dayIndex][day],
          ...activeTime[day].map((timeBlock) => ({
            ...timeBlock,
            Color: pickedColor,
            Title: taskTitle,
          })),
        ];
      } else {
        // If the day doesn't exist in the data, create a new day object
        // Also, update the color of the new time block with pickedColor
        const newDay = {
          [day]: activeTime[day].map((timeBlock) => ({
            ...timeBlock,
            Color: pickedColor,
            Title: taskTitle,
          })),
        };
        // Add the new day to the data
        newData.push(newDay);
      }
    }

    return newData;
  };

  useEffect(() => {
    setFullData(updateData(activeTime, FullData, taskTitle, pickedColor));
  }, [activeTime]);

  useEffect(() => {
    console.log("full data update: ", FullData);
  }, [FullData]);

  return (
    <div className="innercontainer" draggable="false">
      <h1 draggable="false">{dayToRender}</h1>
      <div className="cell-container" draggable="false">
        {[...Array(Math.ceil(cellsData.length / cellsInGroup))].map(
          (_, groupIndex) => {
            const start = groupIndex * cellsInGroup;
            const end = start + cellsInGroup;
            const groupOfCells = cellsData.slice(start, end);

            // Generate the time label for this group
            const totalMinutes = groupIndex * sortingInterval;
            const hours = String(Math.floor(totalMinutes / 60)).padStart(
              2,
              "0"
            );
            const minutes = String(totalMinutes % 60).padStart(2, "0");
            const timeLabel = `${hours}:${minutes}`;

            return (
              <div key={groupIndex} className="groupContainer">
                <div className="cellsGroup">
                  {groupOfCells.map((cell, index) => (
                    <div
                      id={`cell-${index + start}`}
                      draggable="false"
                      key={index + start}
                      className={cell.className}
                      style={cell.style}
                      data-day={dayToRender}
                      data-time={cell.time}
                      data-cell-index={index + start}
                    >
                      {activeCells &&
                        dayToRender === activeCells.day &&
                        index + start >= startIndex &&
                        index + start <= endIndex && (
                          <div
                            className="overlay"
                            draggable="false"
                            data-taskTitle={taskTitle}
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
                <div className="timeLabel">{timeLabel}</div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default React.memo(Day);
