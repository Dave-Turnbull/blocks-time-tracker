import { useContext, useRef, useEffect, useLayoutEffect, useState } from "react";
import SingleDay from "./SingleDay";
import { SelectedCellsContext } from "../contexts/SelectCellsContext";
import TaskList from "./TaskList";
import { ToolbarContext } from "../contexts/ToolbarContext";
import { computeDayLayout } from "../utils/utils";
import { cellGroupTotalTime } from "../data/cellGroupTotalTime";

// Distance from the top/bottom of the scroll content at which more days load.
const EDGE_TRIGGER_PX = 400;

// Base (scale 1) grid dimensions. Every px size in the grid is written as
// calc(var(--day-scale) * Npx), so these must match the component classes.
const CELL_PX = 40;
const CELL_GAP_PX = 2;
const GROUP_PAD_PX = 2;
const GROUP_BORDER_PX = 1;
const COLUMN_GAP_PX = 4;

const SIDEBAR_DEFAULT_PX = 375;
const SIDEBAR_MIN_PX = 240;
const SIDEBAR_MAX_PX = 700;

export const RenderDateRange = () => {
  const { cellsData, selectedCells, extendWindow } = useContext(SelectedCellsContext);
  const { minuteinput, goToTarget, zoom } = useContext(ToolbarContext);
  const [currentFocusedDay, setCurrentFocusedDay] = useState("");
  const [hoveredTime, setHoveredTime] = useState<{ day: string; start: number; end: number } | null>(null);
  const cellsWrapperRef = useRef<HTMLDivElement>(null);
  const daysWrapperRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // rowBase is the unscaled width of one full row (n groups + gaps); the cell
  // containers set their width from it so wrapping is decided by this state,
  // never by the parent's live width mid-resize.
  const [dayLayout, setDayLayout] = useState({ scale: 1, rowBase: 100000 });

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
    if (el instanceof HTMLElement && el.dataset.time && el.dataset.day) {
      const start = parseInt(el.dataset.time);
      setHoveredTime({ day: el.dataset.day, start, end: start + minuteinput });
    } else {
      setHoveredTime(null);
    }
  }

  function handleCellMouseLeave() {
    setHoveredTime(null);
  }

  // Scale the cell groups so a whole number of them fills the row exactly,
  // recomputed when the container resizes or the cell size changes.
  useEffect(() => {
    const el = daysWrapperRef.current;
    if (!el) return;
    const groupMinutes = (cellGroupTotalTime as Record<number, number>)[minuteinput];
    const cellsInGroup = groupMinutes / minuteinput;
    const groupWidth =
      cellsInGroup * CELL_PX +
      (cellsInGroup - 1) * CELL_GAP_PX +
      2 * (GROUP_PAD_PX + GROUP_BORDER_PX);
    const maxGroups = Math.ceil(1440 / groupMinutes);
    const update = (width: number) => {
      // -1px of slack: the solved scale fills the width exactly in real
      // numbers, so without it float/subpixel rounding can poke past the
      // container at exact-fit widths.
      const { scale, groupsPerRow } = computeDayLayout(width - 1, groupWidth, COLUMN_GAP_PX, zoom, maxGroups);
      setDayLayout({ scale, rowBase: groupsPerRow * groupWidth + (groupsPerRow - 1) * COLUMN_GAP_PX });
    };
    // getBoundingClientRect, not clientWidth: clientWidth rounds to an
    // integer, which overshoots fractional widths (browser zoom / display
    // scaling) and wraps the last group.
    update(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentBoxSize?.[0];
      update(box ? box.inlineSize : el.getBoundingClientRect().width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [minuteinput, zoom]);

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

  // Sidebar is resizable by dragging the divider; width persists locally.
  const layoutRef = useRef<HTMLDivElement>(null);
  const draggingSidebar = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem('sidebar_width'));
    return saved >= SIDEBAR_MIN_PX && saved <= SIDEBAR_MAX_PX ? saved : SIDEBAR_DEFAULT_PX;
  });

  function startSidebarDrag(e: React.MouseEvent) {
    e.preventDefault();
    draggingSidebar.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingSidebar.current || !layoutRef.current) return;
      const right = layoutRef.current.getBoundingClientRect().right;
      setSidebarWidth(Math.min(SIDEBAR_MAX_PX, Math.max(SIDEBAR_MIN_PX, right - e.clientX - 4)));
    };
    const handleUp = () => {
      if (!draggingSidebar.current) return;
      draggingSidebar.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth((width) => {
        localStorage.setItem("sidebar_width", String(Math.round(width)));
        return width;
      });
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

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
    <div className="relative flex h-full" ref={layoutRef}>
      <div className="flex-1 min-w-0 border rounded-panel overflow-hidden">
        <div
          className="cell-render-container h-full overflow-auto p-4 [overflow-anchor:none] snap-y snap-mandatory scroll-pt-4"
          ref={cellsWrapperRef}
          onMouseOver={handleCellMouseOver}
          onMouseLeave={handleCellMouseLeave}
        >
          <div
            className="flex flex-col gap-8"
            ref={daysWrapperRef}
            style={{ '--day-scale': dayLayout.scale, '--day-row-base': dayLayout.rowBase } as React.CSSProperties}
          >
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
                  hoveredTime={hoveredTime?.day === key ? hoveredTime : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Divider doubles as the sidebar resize handle; w-2 keeps the old 8px panel gap. */}
      <div
        onMouseDown={startSidebarDrag}
        className="w-2 shrink-0 cursor-col-resize group/divider flex items-center justify-center"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize tasks panel"
      >
        <div className="w-[2px] h-16 rounded-full bg-muted opacity-0 group-hover/divider:opacity-100 transition-opacity" />
      </div>
      <div style={{ width: sidebarWidth }} className="shrink-0 border rounded-panel overflow-hidden">
        <div className="h-full overflow-auto">
          <TaskList singleDayDataOnScroll={currentFocusedDay} />
        </div>
      </div>
    </div>
  );
};
