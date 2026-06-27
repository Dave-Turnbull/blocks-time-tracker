import { useContext } from "react";
import { ToolbarContext } from "../contexts/ToolbarContext";

export const Toolbar = () => {
  const {
    inputValue,
    setInputValue,
    minuteinput,
    setMinuteInput,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickedColor,
    setPickedColor,
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

  return (
    <menu
      className={
        "relative flex flex-row flex-wrap gap-x-6 gap-y-2 items-center px-6 py-3 z-[100] m-0 " +
        "bg-white border-t border-slate-200 " +
        "dark:bg-slate-800 dark:border-slate-700"
      }
    >
      <div className="flex items-center gap-2">
        <span className={labelClass}>Color</span>
        <input
          type="color"
          value={pickedColor}
          onChange={(e) => setPickedColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
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
    </menu>
  );
};
