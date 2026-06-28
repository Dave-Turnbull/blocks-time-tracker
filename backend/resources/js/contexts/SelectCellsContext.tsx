import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ToolbarContext } from './ToolbarContext';
import timesToCells, { CellObject } from '../utils/timesToCells';
import api from '../lib/api';

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
  pendingSelection: null,
  submitTimeBlock: async () => {},
  clearPendingSelection: () => {},
});

export const SelectedCellsProvider = ({ children }: { children: React.ReactNode }) => {
  const { minuteinput, startDate, endDate, selectedTaskId, updateTaskMru } = useContext(ToolbarContext);
  const [selectedCells, setSelectedCells] = useState<SelectedCellsType>({
    day: null,
    StartCell: null,
    EndCell: null,
  });
  const [targetTime, setTargetTime] = useState<string | null>(null);
  const [currentTimeData, setCurrentTimeData] = useState<Record<string, TimeEntry[]>>({});
  const [hoveredTimeBlockId, setHoveredTimeBlockId] = useState<number | null>(null);
  const [sidebarHoveredBlockId, setSidebarHoveredBlockId] = useState<number | null>(null);
  const [cellsData, setCellsData] = useState<Record<string, CellObject[]>>({});
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

  const fetchTimeBlocks = useCallback(() => {
    api.get('/time-blocks', { params: { start: startDate, end: endDate } })
      .then(({ data }) => {
        const cellObjectData: Record<string, CellObject[]> = {};
        const rawData: Record<string, TimeEntry[]> = {};

        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const key = day.toISOString().substring(0, 10);
          rawData[key] = data[key] ?? [];
          cellObjectData[key] = timesToCells(rawData[key], minuteinput);
        }

        setCurrentTimeData(rawData);
        setCellsData(cellObjectData);
      });
  }, [startDate, endDate, minuteinput]);

  useEffect(() => {
    fetchTimeBlocks();
  }, [fetchTimeBlocks]);

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
        if (selectedTaskId) {
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
      value={{ selectedCells, cellsData, hoveredTimeBlockId, sidebarHoveredBlockId, setSidebarHoveredBlockId, currentTimeData, refreshTimeBlocks: fetchTimeBlocks, pendingSelection, submitTimeBlock, clearPendingSelection }}
    >
      {children}
    </SelectedCellsContext.Provider>
  );
};
