import { useContext, useState } from 'react';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { useAuth } from '../contexts/AuthContext';
import { Popover } from './Popover';

const inputClass =
  "h-8 px-2 rounded-control text-sm border bg-canvas text-fg " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fg";

const labelClass = "text-xs text-muted";

const btnBase =
  "h-8 px-3 rounded-control text-sm border bg-canvas hover:bg-hover text-fg transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fg";

const btnInverted =
  "h-8 px-3 rounded-control text-sm border border-fg bg-fg text-canvas transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-canvas";

// 8px padding around 8px-radius items keeps popover corners concentric with the 16px panel.
const popoverClass = "absolute bottom-full mb-2 bg-canvas rounded-panel border p-2 z-50";

const popoverItemClass = (active: boolean) =>
  "w-full text-left px-2 py-1 rounded-control text-sm flex items-center gap-2 transition-colors " +
  (active ? "bg-hover text-fg" : "text-fg hover:bg-hover");

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
    <Popover
      isOpen={isOpen}
      onClose={close}
      trigger={
        <button
          onClick={isOpen ? close : open}
          className={`${btnBase} flex items-center gap-2 min-w-[120px]`}
        >
          {selectedTask ? (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedTask.color }}
              />
              <span className="max-w-[100px] truncate">{selectedTask.name}</span>
            </>
          ) : (
            <span className="text-muted">No task</span>
          )}
          <span className="ml-auto text-muted text-xs">▾</span>
        </button>
      }
    >
      <div className={`${popoverClass} left-0 w-60 flex flex-col gap-1`}>
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full`}
          autoFocus
        />
        <ul className="max-h-52 overflow-y-auto list-none p-0 m-0">
          <li>
            <button
              onMouseDown={(e) => { e.stopPropagation(); selectTask(null); }}
              className={popoverItemClass(!selectedTaskId)}
            >
              <span className="text-muted">No task (show picker)</span>
            </button>
          </li>
          {filtered.map((task) => (
            <li key={task.id}>
              <button
                onMouseDown={(e) => { e.stopPropagation(); selectTask(String(task.id)); }}
                className={popoverItemClass(selectedTaskId === String(task.id))}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                />
                <span className="truncate">{task.name}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-2 py-1 text-sm text-muted">No tasks match</li>
          )}
        </ul>
      </div>
    </Popover>
  );
};

const AccountMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${btnBase} w-8 px-0 rounded-full font-medium`}
          aria-label="Account"
        >
          {initial}
        </button>
      }
    >
      <div className={`${popoverClass} right-0 w-48`}>
        {user && (
          <p className="px-2 py-1 m-0 text-sm text-muted truncate">{user.email}</p>
        )}
        <button
          onMouseDown={(e) => { e.stopPropagation(); logout(); }}
          className={popoverItemClass(false)}
        >
          Log out
        </button>
      </div>
    </Popover>
  );
};

export const Toolbar = () => {
  const {
    inputValue,
    setInputValue,
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
    <footer className="relative h-16 shrink-0 px-2 bg-canvas z-[100]">
      <div className="h-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={labelClass}>Task</span>
            <TaskSelector />
          </div>

          <form onSubmit={handleIntervalSubmit} className="flex items-center gap-2">
            <label htmlFor="cell-size" className={labelClass}>Cell size (min)</label>
            <input
              id="cell-size"
              type="number"
              value={inputValue}
              onChange={handleIntervalChange}
              className={`${inputClass} w-16`}
            />
            <button type="submit" className={btnBase}>
              Set
            </button>
          </form>

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

          <button
            onClick={() => setEraseTool(!eraseTool)}
            className={eraseTool ? btnInverted : btnBase}
            aria-pressed={eraseTool}
          >
            Erase
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={btnBase}
            aria-label="Toggle theme"
          >
            {isDark ? "☀ Light" : "☾ Dark"}
          </button>
          {/* Placeholder: task creation outside the picker modal is not built yet. */}
          <button type="button" className={btnInverted}>
            + New task
          </button>
          <AccountMenu />
        </div>
      </div>
    </footer>
  );
};
