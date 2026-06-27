import { createContext, useState, useEffect, useContext } from "react";
import { ToolbarContext } from "./ToolbarContext";
import timesToCells, { CellObject } from "../utils/timesToCells";
import timesheetData from "../test/timesheet.json";

interface SelectedCellsType {
  day: string | null;
  StartCell: number | null;
  EndCell: number | null;
}

interface TimeEntry {
  startTime: number;
  endTime: number;
  taskID: string;
}

interface SelectCellsContextType {
  selectedCells: SelectedCellsType;
  cellsData: Record<string, CellObject[]>;
  mouseOverTasks: CellObject;
  currentTimeData: Record<string, TimeEntry[]>;
}

const emptyCellObject = new CellObject(0, 0);

export const SelectedCellsContext = createContext<SelectCellsContextType>({
  selectedCells: { day: null, StartCell: null, EndCell: null },
  cellsData: {},
  mouseOverTasks: emptyCellObject,
  currentTimeData: {},
});

export const SelectedCellsProvider = ({ children }: { children: React.ReactNode }) => {
  const { minuteinput, startDate, endDate } = useContext(ToolbarContext);
  const [selectedCells, setSelectedCells] = useState<SelectedCellsType>({
    day: null,
    StartCell: null,
    EndCell: null,
  });
  const [_dataToInput, setDataToInput] = useState<object | null>(null);
  const [targetTime, setTargetTime] = useState<string | null>(null);

  const [FullRawData] = useState<Record<string, TimeEntry[]>>(() => {
    const savedData = localStorage.getItem("timesheetData");
    return savedData ? JSON.parse(savedData) : timesheetData;
  });
  const [currentTimeData, setCurrentTimeData] = useState<Record<string, TimeEntry[]>>({});
  const [mouseOverTasks, setMouseOverTasks] = useState<CellObject>(emptyCellObject);
  const [cellsData, setCellsData] = useState<Record<string, CellObject[]>>({});

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const cellObjectData: Record<string, CellObject[]> = {};
    const rawData: Record<string, TimeEntry[]> = {};
    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      const dayString = day.toISOString().substring(0, 10);
      rawData[dayString] = FullRawData[dayString];
      cellObjectData[dayString] = timesToCells(FullRawData[dayString], minuteinput);
    }
    setCurrentTimeData(rawData);
    setCellsData(cellObjectData);
  }, [startDate, endDate, FullRawData, minuteinput]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetDay = target.getAttribute("data-day");
      const targetCellIndex = target.getAttribute("data-cell-index");
      if (targetDay && targetCellIndex) {
        e.preventDefault();
        setSelectedCells({
          day: targetDay,
          StartCell: Number(targetCellIndex),
          EndCell: Number(targetCellIndex),
        });
      } else {
        setSelectedCells({ day: null, StartCell: null, EndCell: null });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target) return;
        const targetDay = target.getAttribute("data-day");
        const targetCellIndex = target.getAttribute("data-cell-index");
        const mouseRolloutCheck = [
          "timeLabel",
          "cell-container",
          "cell-group-container",
          "cell-group",
          "innercontainer",
        ];
        if (targetDay && targetCellIndex && targetDay === selectedCells.day) {
          setSelectedCells((prevState) => ({
            ...prevState,
            EndCell: Number(targetCellIndex),
          }));
        } else if (!mouseRolloutCheck.some((cls) => target.classList.contains(cls))) {
          setSelectedCells({ day: null, StartCell: null, EndCell: null });
        }
      } else {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target) return;
        const targetDay = target.getAttribute("data-day");
        const targetCellIndex = target.getAttribute("data-cell-index");
        if (targetDay && targetCellIndex) {
          setMouseOverTasks(cellsData[targetDay][Number(targetCellIndex)]);
        }
      }

      const eventTarget = e.target as HTMLElement;
      if (/^cell-\d+$/.test(eventTarget.id)) {
        if (eventTarget.dataset.time !== targetTime) {
          setTargetTime(eventTarget.dataset.time ?? null);
        }
      } else {
        setTargetTime(null);
      }
    };

    const handleMouseUp = () => {
      if (selectedCells.day && selectedCells.StartCell !== null && selectedCells.EndCell !== null) {
        const startIndex = Math.min(selectedCells.StartCell, selectedCells.EndCell);
        const endIndex = Math.max(selectedCells.StartCell, selectedCells.EndCell) + 1;
        const newDataToInput = {
          [selectedCells.day]: [
            {
              startTime: startIndex * minuteinput,
              endTime: endIndex * minuteinput,
              Color: null,
            },
          ],
        };
        setDataToInput(newDataToInput);
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
    <SelectedCellsContext.Provider value={{ selectedCells, cellsData, mouseOverTasks, currentTimeData }}>
      {children}
    </SelectedCellsContext.Provider>
  );
};
