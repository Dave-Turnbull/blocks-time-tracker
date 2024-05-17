import React, { useState, useEffect, useContext, useRef } from "react";
import { ActiveCellsContext } from "./mouseeventhandler.js"; // Import the context
import encodeCells from "./cellencoder";
import timesheetData from "../data/timesheet.json";

const Day = ({ dayToRender, pickedColor, taskTitle, minuteinput, eraseTool }) => {
  const { activeCells, activeTime } = useContext(ActiveCellsContext);
  const [FullData, setFullData] = useState(() => {
    const savedData = localStorage.getItem('timesheetData');
    return savedData ? JSON.parse(savedData) : timesheetData;
  });
  const [cellsData, setCellsData] = useState([]);
  //only allow cell intervals divisible by 1440 minutes (14 hours) and sort them by a larger interval
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

  //calculates how many cells should be in each cell group
  let sortingInterval = intervalObjects.current.find(
    (obj) => obj.interval == minuteinput
  ).sortingInterval;
  let cellsInGroup = sortingInterval / minuteinput;

  //Triggers encoding the cells when a day or interval is selected, or the full data changes
  useEffect(() => {
    let foundDay = FullData.find((day) => Object.keys(day)[0] === dayToRender);
    let timeData = foundDay ? Object.values(foundDay)[0] : [];
    setCellsData(encodeCells(timeData, minuteinput));
  }, [dayToRender, FullData, minuteinput]);

  //ensures that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

//goes through each day in activeTime, adds it to newData, then replaces FullData with newData
const updateData = (activeTime, FullData, taskTitle, pickedColor, eraseTool) => {
    console.log("full data: ", FullData);
    console.log("active data: ", activeTime);
    let newData = [...FullData];

    for (const day in activeTime) {
        const dayIndex = newData.findIndex(
            (dayData) => Object.keys(dayData)[0] === day
        );

        if (dayIndex !== -1) {
            let dayData = newData[dayIndex][day];

            activeTime[day].forEach(newBlock => {
                // Update color and title only if eraseTool is not active
                if (!eraseTool) {
                    newBlock.Color = pickedColor;
                    newBlock.Title = taskTitle;
                }

                dayData = dayData.reduce((updatedDayData, existingBlock) => {
                    if (newBlock.StartTime > existingBlock.EndTime || newBlock.EndTime < existingBlock.StartTime) {
                        updatedDayData.push(existingBlock); // No overlap
                    } else {
                        // Overlap handling
                        if (newBlock.StartTime > existingBlock.StartTime) {
                            updatedDayData.push({ ...existingBlock, EndTime: newBlock.StartTime });
                        }
                        if (newBlock.EndTime < existingBlock.EndTime) {
                            updatedDayData.push({ ...existingBlock, StartTime: newBlock.EndTime });
                        }
                    }
                    return updatedDayData;
                }, eraseTool ? [] : [newBlock]); // Start with new block if not erasing

                // Sort the day data based on StartTime
                dayData.sort((a, b) => a.StartTime - b.StartTime);
            });

            newData[dayIndex][day] = dayData;
        } else {
            if (!eraseTool) {
                const newDay = {
                    [day]: activeTime[day].map(timeBlock => ({
                        ...timeBlock,
                        Color: pickedColor,
                        Title: taskTitle,
                    })),
                };
                newData.push(newDay);
            }
            // If eraseTool is active, do not add a new day
        }
    }

    return newData;
};


  useEffect(() => {
    setFullData(updateData(activeTime, FullData, taskTitle, pickedColor, eraseTool));
  }, [activeTime]);

  useEffect(() => {
    localStorage.setItem('timesheetData', JSON.stringify(FullData));
  }, [FullData]);

  return (
    <div className="innercontainer" draggable="false">
      <h1 draggable="false">{dayToRender}</h1>
      <div id="cell-container" className="cell-container" draggable="false">
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
                            data-tasktitle={taskTitle}
                            style={{
                              zIndex: 100,
                              right: "0%",
                              left: "0%",
                              position: "absolute",
                              top: "0%",
                              bottom: "0%",
                              backgroundColor: eraseTool ? '#dedede' : pickedColor,
                            }}
                          />
                        )}
                        {cell.partialData && (
                          <div className="partialDataContainer">
                            {cell.partialData.map((part) => (
                              <div
                                key={part.key}
                                className={part.className}
                                style={part.style}
                              />
                            ))}
                          </div>
                        )}
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
