import { useContext, useRef, useEffect, useState } from "react";
import SingleDay from "./SingleDay";
import { SelectedCellsContext } from "../contexts/SelectCellsContext";
import TaskList from "./TaskList";
import { ToolbarContext } from "../contexts/ToolbarContext";
import { readableTime } from "../utils/utils";

export const RenderDateRange = () => {
  const { cellsData, selectedCells } = useContext(SelectedCellsContext);
  const { minuteinput } = useContext(ToolbarContext);
  const [currentFocusedDay, setCurrentFocusedDay] = useState("");
  const [hoveredTime, setHoveredTime] = useState<{ start: number; end: number } | null>(null);
  const cellsWrapperRef = useRef<HTMLDivElement>(null);
  const dayComponentRefArray = useRef<(HTMLDivElement | null)[]>([]);

  function handleCellMouseOver(e: React.MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest("[data-time]");
    if (el instanceof HTMLElement && el.dataset.time) {
      const start = parseInt(el.dataset.time);
      setHoveredTime({ start, end: start + minuteinput });
    }
  }

  function handleCellMouseLeave() {
    setHoveredTime(null);
  }

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
        onMouseOver={handleCellMouseOver}
        onMouseLeave={handleCellMouseLeave}
      >
        <div className="sticky top-0 z-50 h-0 flex justify-end pointer-events-none">
          {hoveredTime && (
            <div className="bg-surface border border-line rounded-lg px-3 py-1.5 text-sm font-medium text-fg-secondary shadow-panel">
              {readableTime(hoveredTime.start)} – {readableTime(hoveredTime.end)}
            </div>
          )}
        </div>
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
      <div className="flex-1 bg-surface border-l border-line overflow-auto">
        <TaskList singleDayDataOnScroll={currentFocusedDay} />
      </div>
    </div>
  );
};
