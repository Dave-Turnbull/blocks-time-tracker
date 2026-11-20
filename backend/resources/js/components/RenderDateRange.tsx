import { useContext, useRef, useEffect, useLayoutEffect, useState } from "react";
import SingleDay from "./SingleDay";
import { SelectedCellsContext } from "../contexts/SelectCellsContext";
import TaskList from "./TaskList";
import { ToolbarContext } from "../contexts/ToolbarContext";
import { readableTime } from "../utils/utils";

// Distance from the top/bottom of the scroll content at which more days load.
const EDGE_TRIGGER_PX = 400;

export const RenderDateRange = () => {
  const { cellsData, selectedCells, extendWindow } = useContext(SelectedCellsContext);
  const { minuteinput, goToTarget } = useContext(ToolbarContext);
  const [currentFocusedDay, setCurrentFocusedDay] = useState("");
  const [hoveredTime, setHoveredTime] = useState<{ start: number; end: number } | null>(null);
  const cellsWrapperRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const dates = Object.keys(cellsData);
  const datesKey = dates.join(",");
  const datesRef = useRef(dates);
  datesRef.current = dates;

  // One extension at a time: set when extendWindow is called, cleared once the
  // new set of dates has rendered. Prevents a scroll-event burst near an edge
  // from sliding the window several chunks at once.
  const pendingExtend = useRef(false);
  // Viewport position of a surviving day, captured just before extending, so
  // the scroll offset can be corrected after the DOM grows/shrinks around it.
  const scrollAnchor = useRef<{ date: string; top: number } | null>(null);

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
  // reset it whenever the window changes and the current day falls out of it.
  useEffect(() => {
    const keys = Object.keys(cellsData);
    if (keys.length > 0 && !cellsData[currentFocusedDay]) {
      setCurrentFocusedDay(keys[0]);
    }
  }, [cellsData, currentFocusedDay]);

  useEffect(() => {
    const wrapper = cellsWrapperRef.current;
    if (!wrapper) return;

    function updateScrollPosition() {
      if (!wrapper) return;
      // The focused day is the last one starting above the focus line — not
      // strict containment, which finds nothing when the line falls in the
      // gap between days.
      const focusLine = wrapper.getBoundingClientRect().top + 20;
      let focusedDate: string | null = null;
      for (const date of datesRef.current) {
        const el = dayRefs.current[date];
        if (!el) continue;
        if (el.getBoundingClientRect().top >= focusLine) break;
        focusedDate = date;
      }
      if (focusedDate) {
        setCurrentFocusedDay(focusedDate);
      }

      if (pendingExtend.current) return;
      const { scrollTop, scrollHeight, clientHeight } = wrapper;
      const currentDates = datesRef.current;
      if (currentDates.length === 0) return;
      if (scrollTop < EDGE_TRIGGER_PX) {
        // Prepending leaves the current first day in place; anchor on it.
        const anchorDate = currentDates[0];
        const el = dayRefs.current[anchorDate];
        scrollAnchor.current = el
          ? { date: anchorDate, top: el.getBoundingClientRect().top }
          : null;
        pendingExtend.current = true;
        extendWindow("past");
      } else if (scrollHeight - scrollTop - clientHeight < EDGE_TRIGGER_PX) {
        // Appending may trim days off the top; anchor on the last day.
        const anchorDate = currentDates[currentDates.length - 1];
        const el = dayRefs.current[anchorDate];
        scrollAnchor.current = el
          ? { date: anchorDate, top: el.getBoundingClientRect().top }
          : null;
        pendingExtend.current = true;
        extendWindow("future");
      }
    }

    wrapper.addEventListener("scroll", updateScrollPosition, false);
    return () => {
      wrapper.removeEventListener("scroll", updateScrollPosition, false);
    };
  }, [extendWindow]);

  // After the window slides, shift scrollTop by however much the anchored
  // day moved, so the content under the viewport stays put.
  useLayoutEffect(() => {
    pendingExtend.current = false;
    const anchor = scrollAnchor.current;
    scrollAnchor.current = null;
    const wrapper = cellsWrapperRef.current;
    if (!anchor || !wrapper) return;
    const el = dayRefs.current[anchor.date];
    if (!el) return;
    wrapper.scrollTop += el.getBoundingClientRect().top - anchor.top;
  }, [datesKey]);

  // Scroll the go-to day (initially today) to the top of the viewport. Runs
  // once per nonce, waiting until the target day is actually rendered.
  const handledGoToNonce = useRef(-1);
  useLayoutEffect(() => {
    if (handledGoToNonce.current === goToTarget.nonce) return;
    const wrapper = cellsWrapperRef.current;
    const el = dayRefs.current[goToTarget.date];
    if (!wrapper || !el) return;
    handledGoToNonce.current = goToTarget.nonce;
    wrapper.scrollTop += el.getBoundingClientRect().top - wrapper.getBoundingClientRect().top - 16;
    setCurrentFocusedDay(goToTarget.date);
  }, [goToTarget, datesKey]);

  return (
    <div className="relative flex h-full gap-2">
      <div className="flex-1 min-w-0 border rounded-panel overflow-hidden">
        <div
          className="cell-render-container h-full overflow-auto p-4 [overflow-anchor:none] snap-y snap-mandatory scroll-pt-4"
          ref={cellsWrapperRef}
          onMouseOver={handleCellMouseOver}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="sticky top-0 z-50 h-0 flex justify-end pointer-events-none">
            {hoveredTime && (
              <div className="bg-canvas border rounded-control px-3 py-1 text-sm text-fg">
                {readableTime(hoveredTime.start)} – {readableTime(hoveredTime.end)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-8">
            {dates.map((key) => (
              <div
                key={key}
                data-date={key}
                className="snap-start"
                ref={(ref) => { dayRefs.current[key] = ref; }}
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
        </div>
      </div>
      <div className="w-[375px] shrink-0 border rounded-panel overflow-hidden">
        <div className="h-full overflow-auto">
          <TaskList singleDayDataOnScroll={currentFocusedDay} />
        </div>
      </div>
    </div>
  );
};
