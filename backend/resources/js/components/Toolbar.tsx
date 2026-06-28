import { useContext, useState } from 'react';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { useAuth } from '../contexts/AuthContext';

const inputClass =
  "px-2 py-1 rounded text-sm focus:outline-none border " +
  "bg-slate-100 text-slate-700 border-slate-300 focus:border-slate-500 " +
  "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:focus:border-slate-400";

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";

const btnBase =
  "px-3 py-1 rounded text-sm font-medium transition-colors border " +
  "bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300 " +
  "dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100 dark:border-slate-500";

const TaskSelector = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, taskMruOrder } = useContext(ToolbarContext);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const sortedTasks = Object.values(tasks).sort((a, b) => {
    const aIdx = taskMruOrder.indexOf(String(a.id));
    const bIdx = taskMruOrder.indexOf(String(b.id));
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const filtered = search
    ? sortedTasks.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : sortedTasks;

  const selectedTask = selectedTaskId ? tasks[selectedTaskId] : null;

  const open = () => { setIsOpen(true); setSearch(''); };
  const close = () => setIsOpen(false);

  const selectTask = (id: string | null) => {
    setSelectedTaskId(id);
    close();
  };

  return (
    <div className="relative">
      {isOpen && (
        <div className="fixed inset-0 z-40" onMouseDown={close} />
      )}
      <button
        onClick={isOpen ? close : open}
        className={`${btnBase} flex items-center gap-2 min-w-[120px]`}
      >
        {selectedTask ? (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedTask.color }}
            />
            <span className="max-w-[100px] truncate">{selectedTask.name}</span>
          </>
        ) : (
          <span className="text-slate-400 dark:text-slate-400">No task</span>
        )}
        <span className="ml-auto opacity-50 text-xs">▾</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} w-full`}
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                onMouseDown={(e) => { e.stopPropagation(); selectTask(null); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  !selectedTaskId
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                No task (show picker)
              </button>
            </li>
            {filtered.map((task) => (
              <li key={task.id}>
                <button
                  onMouseDown={(e) => { e.stopPropagation(); selectTask(String(task.id)); }}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                    selectedTaskId === String(task.id)
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="truncate">{task.name}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                No tasks match
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Toolbar = () => {
  const { logout } = useAuth();

  const {
    inputValue,
    setInputValue,
    minuteinput,
    setMinuteInput,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    eraseTool,
    setEraseTool,
    isDark,
    toggleTheme,
  } = useContext(ToolbarContext);

  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(Number(event.target.value));
  };

  const handleIntervalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let roundedValue = inputValue;

    if (inputValue > 1440) {
      roundedValue = 1440;
    } else if (1440 % inputValue !== 0) {
      let lowerDivisor = inputValue;
      let upperDivisor = inputValue;

      while (1440 % --lowerDivisor !== 0) {}
      while (1440 % ++upperDivisor !== 0) {}

      roundedValue =
        inputValue - lowerDivisor < upperDivisor - inputValue
          ? lowerDivisor
          : upperDivisor;
    }
    setMinuteInput(roundedValue);
    setInputValue(roundedValue);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  return (
    <menu
      className={
        "relative flex flex-row flex-wrap gap-x-6 gap-y-2 items-center px-6 py-3 z-[100] m-0 " +
        "bg-white border-t border-slate-200 " +
        "dark:bg-slate-800 dark:border-slate-700"
      }
    >
      <div className="flex items-center gap-2">
        <span className={labelClass}>Task</span>
        <TaskSelector />
      </div>

      <div className="flex items-center gap-2">
        <span className={labelClass}>Cell size (min)</span>
        <form onSubmit={handleIntervalSubmit} className="flex items-center gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleIntervalChange}
            className={`${inputClass} w-16`}
          />
          <button type="submit" className={btnBase}>
            Set
          </button>
        </form>
      </div>

      <div className="flex items-center gap-4">
        <label className={`${labelClass} flex items-center gap-2`}>
          Start
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} flex items-center gap-2`}>
          End
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className={inputClass}
          />
        </label>
      </div>

      <button
        onClick={() => setEraseTool(!eraseTool)}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors border ${
          eraseTool
            ? "bg-red-100 hover:bg-red-200 text-red-700 border-red-300 dark:bg-red-900/50 dark:hover:bg-red-800/60 dark:text-red-300 dark:border-red-700"
            : btnBase
        }`}
      >
        {eraseTool ? "Erase: ON" : "Erase: OFF"}
      </button>

      <button
        onClick={toggleTheme}
        className={`${btnBase} ml-auto`}
        aria-label="Toggle theme"
      >
        {isDark ? "☀ Light" : "☾ Dark"}
      </button>

      <span className={`${labelClass} text-xs`}>
        {minuteinput} min/cell
      </span>

      <button
        onClick={logout}
        className={`${btnBase} text-xs`}
        aria-label="Log out"
      >
        Log out
      </button>
    </menu>
  );
};
