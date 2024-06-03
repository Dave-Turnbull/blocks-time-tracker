import { useState, useEffect, useContext } from "react";
import { ActiveCellsContext } from "../contexts/SelectCellsContext.tsx"; // Import the context
import encodeCells from "./cellencoder.tsx";
import timesheetData from "../test/timesheet.json";
import { Block } from "./Block.tsx";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime.tsx";
import { ToolbarContext } from "../contexts/ToolbarContext.tsx";

const SingleDay = ({ dayToRender }) => {
  const { activeCells, dataToInput } = useContext(ActiveCellsContext);
  const { pickedColor, taskTitle, minuteinput, eraseTool } =
    useContext(ToolbarContext);
  const [FullData, setFullData] = useState(() => {
    const savedData = localStorage.getItem("timesheetData");
    return savedData ? JSON.parse(savedData) : timesheetData;
  });
  const [cellsData, setCellsData] = useState([]);

  const cellsInGroup = cellGroupTotalTime[minuteinput] / minuteinput;

  //Triggers encoding the cells when a day or interval is selected, or the full data changes
  useEffect(() => {
    const foundDay = FullData.find(
      (day) => Object.keys(day)[0] === dayToRender
    );
    const timeData = foundDay ? Object.values(foundDay)[0] : [];
    setCellsData(encodeCells(timeData, minuteinput));
  }, [dayToRender, FullData, minuteinput]);

  //ensures that startIndex is the lowest number and endIndex is highest
  const startIndex = activeCells
    ? Math.min(activeCells.StartCell, activeCells.EndCell)
    : null;
  const endIndex = activeCells
    ? Math.max(activeCells.StartCell, activeCells.EndCell)
    : null;

  //goes through each day in dataToInput, adds it to newData, then replaces FullData with newData
  const updateData = (
    dataToInput,
    FullData,
    taskTitle,
    pickedColor,
    eraseTool
  ) => {
    console.log("full data: ", FullData);
    console.log("active data: ", dataToInput);
    const newData = [...FullData];

    for (const day in dataToInput) {
      const dayIndex = newData.findIndex(
        (dayData) => Object.keys(dayData)[0] === day
      );

      if (dayIndex !== -1) {
        let dayData = newData[dayIndex][day];

        dataToInput[day].forEach((newBlock) => {
          // Update color and title only if eraseTool is not active
          if (!eraseTool) {
            newBlock.Color = pickedColor;
            newBlock.Title = taskTitle;
          }

          dayData = dayData.reduce(
            (updatedDayData, existingBlock) => {
              if (
                newBlock.StartTime > existingBlock.EndTime ||
                newBlock.EndTime < existingBlock.StartTime
              ) {
                updatedDayData.push(existingBlock); // No overlap
              } else {
                // Overlap handling
                if (newBlock.StartTime > existingBlock.StartTime) {
                  updatedDayData.push({
                    ...existingBlock,
                    EndTime: newBlock.StartTime,
                  });
                }
                if (newBlock.EndTime < existingBlock.EndTime) {
                  updatedDayData.push({
                    ...existingBlock,
                    StartTime: newBlock.EndTime,
                  });
                }
              }
              return updatedDayData;
            },
            eraseTool ? [] : [newBlock]
          ); // Start with new block if not erasing

          // Sort the day data based on StartTime
          dayData.sort((a, b) => a.StartTime - b.StartTime);
        });

        newData[dayIndex][day] = dayData;
      } else {
        if (!eraseTool) {
          const newDay = {
            [day]: dataToInput[day].map((timeBlock) => ({
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
    console.log("data to input:", dataToInput);
    setFullData(
      updateData(dataToInput, FullData, taskTitle, pickedColor, eraseTool)
    );
  }, [dataToInput]);

  useEffect(() => {
    localStorage.setItem("timesheetData", JSON.stringify(FullData));
  }, [FullData]);

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
                  {groupOfCells.map((cell, index) => (
                    <Block
                      index={index}
                      start={start}
                      cell={cell}
                      dayToRender={dayToRender}
                      activeCells={activeCells}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      taskTitle={taskTitle}
                      eraseTool={eraseTool}
                      pickedColor={pickedColor}
                    />
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

export default SingleDay;
