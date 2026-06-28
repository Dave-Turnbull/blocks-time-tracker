import { useContext, useRef, useEffect, useState } from "react";
import SingleDay from "./SingleDay";
import { SelectedCellsContext } from "../contexts/SelectCellsContext";
import TaskList from "./TaskList";
import { ToolbarContext } from "../contexts/ToolbarContext";

export const RenderDateRange = () => {
  const { cellsData, selectedCells } = useContext(SelectedCellsContext);
  const { minuteinput } = useContext(ToolbarContext);
  const [currentFocusedDay, setCurrentFocusedDay] = useState("");
  const cellsWrapperRef = useRef<HTMLDivElement>(null);
  const dayComponentRefArray = useRef<(HTMLDivElement | null)[]>([]);

  // Keep the focused day in sync with cellsData: set it on first load and
  // reset it whenever the date range changes and the current day falls out of range.
  useEffect(() => {
    const keys = Object.keys(cellsData);
    if (keys.length > 0 && !cellsData[currentFocusedDay]) {
      setCurrentFocusedDay(keys[0]);
    }
  }, [cellsData, currentFocusedDay]);

  useEffect(() => {
    function updateScrollPosition() {
      const focusedDay = dayComponentRefArray.current
        .filter((el): el is HTMLDivElement => el !== null)
        .find(
          (el) =>
            el.getBoundingClientRect().top < 20 &&
            el.getBoundingClientRect().top + el.getBoundingClientRect().height > 20
        );
      if (focusedDay) {
        setCurrentFocusedDay(focusedDay.dataset.date ?? "");
      }
    }

    const wrapper = cellsWrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener("scroll", updateScrollPosition, false);
    }
    return () => {
      if (wrapper) {
        wrapper.removeEventListener("scroll", updateScrollPosition, false);
      }
    };
  }, []);

  return (
    <div className="relative flex h-full overflow-hidden flex-1">
      <div
        className="cell-render-container h-full overflow-auto flex-[3] p-4"
        ref={cellsWrapperRef}
      >
        {Object.keys(cellsData).map((key, index) => (
          <div
            key={key}
            data-date={key}
            ref={(ref) => { dayComponentRefArray.current[index] = ref; }}
          >
            <SingleDay
              dayToRender={key}
              singleDayData={cellsData[key]}
              selectedCells={selectedCells.day === key ? selectedCells : undefined}
              minuteinput={minuteinput}
            />
          </div>
        ))}
      </div>
      <div className="flex-1 bg-white border-l border-slate-200 overflow-auto dark:bg-slate-800 dark:border-slate-700">
        <TaskList singleDayDataOnScroll={currentFocusedDay} />
      </div>
    </div>
  );
};
