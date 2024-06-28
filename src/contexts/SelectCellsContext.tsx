import { createContext, useState, useEffect, useContext } from "react";
import { ToolbarContext } from "./ToolbarContext";
import timesToCells from "../utils/timesToCells";
import timesheetData from "../test/timesheet.json";

interface activeCellsType {
  day: null | string;
  StartCell: null | number;
  EndCell: null | number;
}

interface selectCellsContextType {
  activeCells: activeCellsType;
  cellsData: Object;
  mouseOverTasks: Array<any>
  setMouseOverTasks?: React.Dispatch<React.SetStateAction<Array<any>>>;
  currentTimeData: Object;
}

export const ActiveCellsContext = createContext<selectCellsContextType | null>(
  null
);

export const ActiveCellsProvider = ({ children }) => {
  const { minuteinput, startDate, endDate } = useContext(ToolbarContext);
  const [activeCells, setActiveCells] = useState({
    day: null,
    StartCell: null,
    EndCell: null,
  });
  const [dataToInput, setDataToInput] = useState(null);
  const [targetTime, setTargetTime] = useState(0);

  const [FullRawData, setFullRawData] = useState(() => {
    const savedData = localStorage.getItem("timesheetData");
    return savedData ? JSON.parse(savedData) : timesheetData;
  });
  const [currentTimeData, setCurrentTimeData] = useState({})
  const [mouseOverTasks, setMouseOverTasks] = useState([])
  const [cellsData, setCellsData] = useState({});

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const cellObjectData = {}
    const rawData = {}
    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      const dayString = day.toISOString().substring(0, 10)
      rawData[dayString] = FullRawData[dayString]
      cellObjectData[dayString] = timesToCells(FullRawData[dayString], minuteinput)
    }
    setCurrentTimeData(rawData)
    setCellsData(cellObjectData)
  }, [startDate, endDate, FullRawData, minuteinput])

  //trigger the functions when the mouse events are started
  useEffect(() => {
    const handleMouseDown = (e) => {
      const targetDay = e.target.getAttribute("data-day");
      const targetCellIndex = e.target.getAttribute("data-cell-index");
      if (targetDay && targetCellIndex) {
        e.preventDefault();
        setActiveCells({
          day: targetDay,
          StartCell: targetCellIndex,
          EndCell: targetCellIndex,
        });
      } else {
        setActiveCells({
          day: null,
          StartCell: null,
          EndCell: null,
        });
      }
    };

    const handleMouseMove = (e) => {
      if (e.buttons === 1 && e) {
        // Get the element currently under the mouse pointer
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const targetDay = target.getAttribute("data-day");
        const targetCellIndex = target.getAttribute("data-cell-index");
        const mouseRolloutCheck = [
          "timeLabel",
          "cell-container",
          "cell-group-container",
          "cell-group",
          "innercontainer",
        ];
        if (targetDay && targetCellIndex && targetDay === activeCells.day) {
          setActiveCells((prevState) => ({
            ...prevState,
            EndCell: targetCellIndex,
          }));
        } else if (
          !mouseRolloutCheck.some((className) =>
            target.classList.contains(className)
          )
        ) {
          setActiveCells({
            day: null,
            StartCell: null,
            EndCell: null,
          });
        }
      } else {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const targetDay = target.getAttribute("data-day");
        const targetCellIndex = target.getAttribute("data-cell-index");
        if (targetDay && targetCellIndex) {
          setMouseOverTasks(cellsData[targetDay][targetCellIndex])
        }
      }
      if (/^cell-\d+$/.test(e.target.id)) {
        if (e.target.dataset.time !== targetTime) {
          // Log the data-time attribute
          setTargetTime(e.target.dataset.time);
        }
      } else {
        setTargetTime(null);
      }
    };

    const handleMouseUp = () => {
      if (activeCells.day && activeCells.StartCell && activeCells.EndCell) {
        //reset the active cells
        const startIndex = activeCells
          ? Math.min(activeCells.StartCell, activeCells.EndCell)
          : null;
        const endIndex =
          (activeCells
            ? Math.max(activeCells.StartCell, activeCells.EndCell)
            : null) + 1;
        //add the inputed time to the active time array
        const newdataToInput = {
          [activeCells.day]: [
            {
              startTime: startIndex * minuteinput,
              endTime: endIndex * minuteinput,
              Color: null,
            },
          ],
        };
        setDataToInput(newdataToInput);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <ActiveCellsContext.Provider value={{ activeCells, cellsData, mouseOverTasks, currentTimeData }}>
      {children}
    </ActiveCellsContext.Provider>
  );
};
