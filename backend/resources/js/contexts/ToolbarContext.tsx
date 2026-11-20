import { createContext, useEffect, useState } from 'react';
import api from '../lib/api';

export interface Task {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export type TaskRecord = Record<string, Task>;

// nonce lets "Go to" re-trigger a scroll even when the date is unchanged.
export interface GoToTarget {
  date: string;
  nonce: number;
}

// Zoom sets the grid's minimum day-scale; the fill algorithm scales up from it.
export const ZOOM_STEP = 0.25;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;

interface ToolbarContextType {
  inputValue: number;
  setInputValue: React.Dispatch<React.SetStateAction<number>>;
  minuteinput: number;
  setMinuteInput: React.Dispatch<React.SetStateAction<number>>;
  goToTarget: GoToTarget;
  goToDate: (date: string) => void;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  eraseTool: boolean;
  setEraseTool: React.Dispatch<React.SetStateAction<boolean>>;
  tasks: TaskRecord;
  setTasks: React.Dispatch<React.SetStateAction<TaskRecord>>;
  isDark: boolean;
  toggleTheme: () => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  taskMruOrder: string[];
  updateTaskMru: (taskId: string) => void;
}

export const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const ToolbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [inputValue, setInputValue] = useState(15);
  const [minuteinput, setMinuteInput] = useState(15);
  const [goToTarget, setGoToTarget] = useState<GoToTarget>({
    date: new Date().toISOString().substring(0, 10),
    nonce: 0,
  });
  const [eraseTool, setEraseTool] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskMruOrder, setTaskMruOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('task_mru_order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    api.get('/tasks').then(({ data }) => {
      const record: TaskRecord = {};
      for (const task of data) {
        record[String(task.id)] = task;
      }
      setTasks(record);
    });
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const goToDate = (date: string) => {
    setGoToTarget((prev) => ({ date, nonce: prev.nonce + 1 }));
  };

  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
  const zoomOut = () => setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));

  const updateTaskMru = (taskId: string) => {
    setTaskMruOrder((prev) => {
      const next = [taskId, ...prev.filter((id) => id !== taskId)];
      localStorage.setItem('task_mru_order', JSON.stringify(next));
      return next;
    });
  };

  return (
    <ToolbarContext.Provider
      value={{
        inputValue, setInputValue,
        minuteinput, setMinuteInput,
        goToTarget, goToDate,
        zoom, zoomIn, zoomOut,
        eraseTool, setEraseTool,
        tasks, setTasks,
        isDark, toggleTheme,
        selectedTaskId, setSelectedTaskId,
        taskMruOrder, updateTaskMru,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
};
