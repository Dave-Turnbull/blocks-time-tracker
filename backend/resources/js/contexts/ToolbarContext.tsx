import { createContext, useEffect, useState } from 'react';
import api from '../lib/api';

export interface Task {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export type TaskRecord = Record<string, Task>;

interface ToolbarContextType {
  inputValue: number;
  setInputValue: React.Dispatch<React.SetStateAction<number>>;
  minuteinput: number;
  setMinuteInput: React.Dispatch<React.SetStateAction<number>>;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  pickedColor: string;
  setPickedColor: React.Dispatch<React.SetStateAction<string>>;
  eraseTool: boolean;
  setEraseTool: React.Dispatch<React.SetStateAction<boolean>>;
  tasks: TaskRecord;
  setTasks: React.Dispatch<React.SetStateAction<TaskRecord>>;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const ToolbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [inputValue, setInputValue] = useState(15);
  const [minuteinput, setMinuteInput] = useState(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [pickedColor, setPickedColor] = useState('#000000');
  const [eraseTool, setEraseTool] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord>({});

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

  return (
    <ToolbarContext.Provider
      value={{
        inputValue, setInputValue,
        minuteinput, setMinuteInput,
        startDate, setStartDate,
        endDate, setEndDate,
        pickedColor, setPickedColor,
        eraseTool, setEraseTool,
        tasks, setTasks,
        isDark, toggleTheme,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
};
