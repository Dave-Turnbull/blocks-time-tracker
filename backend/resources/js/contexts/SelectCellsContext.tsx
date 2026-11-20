import { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { ToolbarContext } from './ToolbarContext';
import timesToCells, { CellObject } from '../utils/timesToCells';
import { addDays, listDates, extendDateWindow, DateWindow } from '../utils/utils';
import api from '../lib/api';

// Days are fetched in chunks of CHUNK_DAYS; at most MAX_LOADED_DAYS stay in the
// DOM — extending past that slides the window instead of growing it.
export const CHUNK_DAYS = 10;
export const MAX_LOADED_DAYS = 30;
// Days rendered above the go-to date, so there is content to scroll up into.
const DAYS_BEFORE_FOCUS = CHUNK_DAYS;

interface SelectedCellsType {
  day: string | null;
  StartCell: number | null;
  EndCell: number | null;
}

export interface TimeEntry {
  id?: number;
  startTime: number;
  endTime: number;
  taskID: string;
}

export interface PendingSelection {
  day: string;
  startTime: number;
  endTime: number;
}

interface SelectCellsContextType {
  selectedCells: SelectedCellsType;
  cellsData: Record<string, CellObject[]>;
  hoveredTimeBlockId: number | null;
  sidebarHoveredBlockId: number | null;
  setSidebarHoveredBlockId: (id: number | null) => void;
  currentTimeData: Record<string, TimeEntry[]>;
  refreshTimeBlocks: () => void;
  extendWindow: (direction: 'past' | 'future') => void;
  pendingSelection: PendingSelection | null;
  submitTimeBlock: (taskId: string) => Promise<void>;
  clearPendingSelection: () => void;
}

export const SelectedCellsContext = createContext<SelectCellsContextType>({
  selectedCells: { day: null, StartCell: null, EndCell: null },
  cellsData: {},
  hoveredTimeBlockId: null,
  sidebarHoveredBlockId: null,
  setSidebarHoveredBlockId: () => {},
  currentTimeData: {},
  refreshTimeBlocks: () => {},
  extendWindow: () => {},
  pendingSelection: null,
  submitTimeBlock: async () => {},
  clearPendingSelection: () => {},
});

export const SelectedCellsProvider = ({ children }: { children: React.ReactNode }) => {
  const { minuteinput, goToTarget, selectedTaskId, updateTaskMru, eraseTool } = useContext(ToolbarContext);
  const [selectedCells, setSelectedCells] = useState<SelectedCellsType>({
    day: null,
    StartCell: null,
    EndCell: null,
  });
  const [targetTime, setTargetTime] = useState<string | null>(null);
  const [hoveredTimeBlockId, setHoveredTimeBlockId] = useState<number | null>(null);
  const [sidebarHoveredBlockId, setSidebarHoveredBlockId] = useState<number | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

  const [dateWindow, setDateWindow] = useState<DateWindow>(() => ({
    start: addDays(goToTarget.date, -DAYS_BEFORE_FOCUS),
    end: addDays(goToTarget.date, MAX_LOADED_DAYS - DAYS_BEFORE_FOCUS - 1),
  }));

  // Fetched day data, keyed by date. Kept beyond the rendered window so
  // scrolling back over recently-unloaded days doesn't refetch them.
  const [loadedDays, setLoadedDays] = useState<Record<string, TimeEntry[]>>({});
  // Mirror of loadedDays keys so the fetch effect doesn't depend on (and
  // retrigger from) the loadedDays state it writes to.
  const loadedKeysRef = useRef<Set<string>>(new Set());

  const applyFetchedRange = useCallback((start: string, end: string, data: Record<string, TimeEntry[]>) => {
    const dates = listDates(start, end);
    setLoadedDays((prev) => {
      const next = { ...prev };
      for (const key of dates) {
        next[key] = data[key] ?? [];
        loadedKeysRef.current.add(key);
      }
      return next;
    });
  }, []);

  // Re-centre the window whenever the toolbar's "Go to" fires.
  const lastGoToNonce = useRef(goToTarget.nonce);
  useEffect(() => {
    if (goToTarget.nonce === lastGoToNonce.current) return;
    lastGoToNonce.current = goToTarget.nonce;
    setDateWindow({
      start: addDays(goToTarget.date, -DAYS_BEFORE_FOCUS),
      end: addDays(goToTarget.date, MAX_LOADED_DAYS - DAYS_BEFORE_FOCUS - 1),
    });
  }, [goToTarget]);

  // Fetch whichever days in the window haven't been loaded yet, as one
  // contiguous range (re-fetching already-loaded days in between is harmless).
  useEffect(() => {
    const missing = listDates(dateWindow.start, dateWindow.end)
      .filter((key) => !loadedKeysRef.current.has(key));
    if (missing.length === 0) return;
    const start = missing[0];
    const end = missing[missing.length - 1];
    api.get('/time-blocks', { params: { start, end } })
      .then(({ data }) => applyFetchedRange(start, end, data));
  }, [dateWindow, applyFetchedRange]);

  const fetchTimeBlocks = useCallback(() => {
    return api.get('/time-blocks', { params: { start: dateWindow.start, end: dateWindow.end } })
      .then(({ data }) => applyFetchedRange(dateWindow.start, dateWindow.end, data));
  }, [dateWindow, applyFetchedRange]);

  const extendWindow = useCallback((direction: 'past' | 'future') => {
    setDateWindow((prev) => extendDateWindow(prev, direction, CHUNK_DAYS, MAX_LOADED_DAYS));
  }, []);

  // Days without data yet render as empty grids of the same height, so rows
  // appear instantly and fill in when the fetch lands — no layout shift.
  const { cellsData, currentTimeData } = useMemo(() => {
    const cellObjectData: Record<string, CellObject[]> = {};
    const rawData: Record<string, TimeEntry[]> = {};
    for (const key of listDates(dateWindow.start, dateWindow.end)) {
      rawData[key] = loadedDays[key] ?? [];
      cellObjectData[key] = timesToCells(rawData[key], minuteinput);
    }
    return { cellsData: cellObjectData, currentTimeData: rawData };
  }, [dateWindow, loadedDays, minuteinput]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetDay = target.getAttribute('data-day');
      const targetCellIndex = target.getAttribute('data-cell-index');
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
        const targetDay = target.getAttribute('data-day');
        const targetCellIndex = target.getAttribute('data-cell-index');
        const mouseRolloutCheck = [
          'timeLabel', 'cell-container', 'cell-group-container', 'cell-group', 'innercontainer',
        ];
        if (targetDay && targetCellIndex && targetDay === selectedCells.day) {
          setSelectedCells((prev) => ({ ...prev, EndCell: Number(targetCellIndex) }));
        } else if (!mouseRolloutCheck.some((cls) => target.classList.contains(cls))) {
          setSelectedCells({ day: null, StartCell: null, EndCell: null });
        }
      } else {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target) return;
        const targetDay = target.getAttribute('data-day');
        const targetCellIndex = target.getAttribute('data-cell-index');
        if (targetDay && targetCellIndex) {
          const cellObj = cellsData[targetDay]?.[Number(targetCellIndex)];
          const id = cellObj?.tasks?.[0]?.id;
          if (id !== undefined) {
            setHoveredTimeBlockId(id);
          }
        } else {
          setHoveredTimeBlockId(null);
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
        const sel: PendingSelection = {
          day: selectedCells.day,
          startTime: startIndex * minuteinput,
          endTime: endIndex * minuteinput,
        };
        if (eraseTool) {
          api.post('/time-blocks/erase', {
            date: sel.day,
            start_time: sel.startTime,
            end_time: sel.endTime,
          }).then(() => fetchTimeBlocks()).then(() => {
            setSelectedCells({ day: null, StartCell: null, EndCell: null });
          });
          // Selection is cleared in the .then() above so the erase visual
          // persists until the refreshed data lands, avoiding a flicker.
          return;
        } else if (selectedTaskId) {
          api.post('/time-blocks', {
            task_id: Number(selectedTaskId),
            date: sel.day,
            start_time: sel.startTime,
            end_time: sel.endTime,
          }).then(() => {
            updateTaskMru(selectedTaskId);
            fetchTimeBlocks();
          });
        } else {
          setPendingSelection(sel);
        }
      }
      setSelectedCells({ day: null, StartCell: null, EndCell: null });
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  const submitTimeBlock = async (taskId: string) => {
    if (!pendingSelection) return;
    await api.post('/time-blocks', {
      task_id: Number(taskId),
      date: pendingSelection.day,
      start_time: pendingSelection.startTime,
      end_time: pendingSelection.endTime,
    });
    updateTaskMru(taskId);
    setPendingSelection(null);
    fetchTimeBlocks();
  };

  const clearPendingSelection = () => setPendingSelection(null);

  return (
    <SelectedCellsContext.Provider
      value={{ selectedCells, cellsData, hoveredTimeBlockId, sidebarHoveredBlockId, setSidebarHoveredBlockId, currentTimeData, refreshTimeBlocks: fetchTimeBlocks, extendWindow, pendingSelection, submitTimeBlock, clearPendingSelection }}
    >
      {children}
    </SelectedCellsContext.Provider>
  );
};
