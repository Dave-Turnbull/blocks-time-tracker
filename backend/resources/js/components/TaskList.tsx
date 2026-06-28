import { useContext } from 'react';
import { SelectedCellsContext } from '../contexts/SelectCellsContext';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { readableTime } from '../utils/utils';

interface TaskListProps {
  singleDayDataOnScroll: string;
}

const TaskList = ({ singleDayDataOnScroll }: TaskListProps) => {
  const { mouseOverTasks, currentTimeData } = useContext(SelectedCellsContext);
  const { tasks } = useContext(ToolbarContext);

  const dayTasks = singleDayDataOnScroll ? currentTimeData[singleDayDataOnScroll] : null;

  const itemClass =
    'text-sm rounded px-3 py-2 border ' +
    'bg-slate-50 border-slate-200 ' +
    'dark:bg-slate-700 dark:border-slate-600';

  const titleClass = 'font-medium m-0 text-slate-700 dark:text-slate-100';
  const timeClass = 'text-xs m-0 mt-0.5 text-slate-500 dark:text-slate-400';
  const sectionLabelClass =
    'text-xs font-medium uppercase tracking-wide mb-2 text-slate-400 dark:text-slate-500';

  return (
    <div className="p-4">
      <h2 className="text-base font-semibold mb-3 pb-2 border-b text-slate-700 border-slate-200 dark:text-slate-200 dark:border-slate-700">
        {singleDayDataOnScroll || 'Tasks'}
      </h2>

      {mouseOverTasks.tasks && mouseOverTasks.tasks.length > 0 && (
        <div className="mb-4">
          <p className={sectionLabelClass}>Hovered cell</p>
          <ul className="tasks list-none p-0 m-0 space-y-1">
            {mouseOverTasks.tasks.map((mouseOverTask) => {
              const task = tasks[mouseOverTask.taskID];
              if (!task) return null;
              const startTime = mouseOverTasks.startTime + mouseOverTask.startTime;
              const endTime = mouseOverTasks.startTime + mouseOverTask.endTime;
              return (
                <li
                  key={`${mouseOverTask.taskID}-${mouseOverTask.startTime}`}
                  className={itemClass}
                >
                  <p className={titleClass}>{task.name}</p>
                  <p className={timeClass}>
                    {readableTime(startTime)} – {readableTime(endTime)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {dayTasks && dayTasks.length > 0 && (
        <div>
          <p className={sectionLabelClass}>Day tasks</p>
          <ul className="list-none p-0 m-0 space-y-1">
            {dayTasks.map((time) => {
              const task = tasks[time.taskID];
              if (!task) return null;
              return (
                <li
                  key={`${time.taskID}-${time.startTime}`}
                  className={itemClass}
                >
                  <p className={titleClass}>{task.name}</p>
                  <p className={timeClass}>
                    {readableTime(time.startTime)} – {readableTime(time.endTime)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskList;
