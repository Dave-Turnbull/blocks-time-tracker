import { useContext, useEffect, useRef } from 'react';
import { SelectedCellsContext } from '../contexts/SelectCellsContext';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { readableTime } from '../utils/utils';

interface TaskListProps {
  singleDayDataOnScroll: string;
}

const TaskList = ({ singleDayDataOnScroll }: TaskListProps) => {
  const { hoveredTimeBlockId, setSidebarHoveredBlockId, currentTimeData } = useContext(SelectedCellsContext);
  const { tasks } = useContext(ToolbarContext);

  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  const dayBlocks = currentTimeData[singleDayDataOnScroll] ?? [];
  const sorted = [...dayBlocks].sort((a, b) => a.startTime - b.startTime);

  useEffect(() => {
    if (hoveredTimeBlockId === null) return;
    const el = itemRefs.current.get(hoveredTimeBlockId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredTimeBlockId]);

  return (
    <section aria-label="Tasks" data-day={singleDayDataOnScroll} className="p-2">
      <h2 className="text-5xl leading-none font-bold text-fg m-0 mb-1 px-2">Tasks</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted m-0 px-2">No time blocks for this day.</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {sorted.map((block) => {
            const task = tasks[block.taskID];
            if (!task) return null;
            const isHovered = block.id !== undefined && block.id === hoveredTimeBlockId;
            return (
              <li
                key={`${block.id ?? block.startTime}-${block.taskID}`}
                ref={(el) => {
                  if (block.id !== undefined) {
                    if (el) itemRefs.current.set(block.id, el);
                    else itemRefs.current.delete(block.id);
                  }
                }}
                onMouseEnter={() => block.id !== undefined && setSidebarHoveredBlockId(block.id)}
                onMouseLeave={() => setSidebarHoveredBlockId(null)}
                // 3px/7px + the always-present 1px border = 4px/8px of visual padding
                className={
                  'text-sm rounded-control px-[7px] py-[3px] border ' +
                  (isHovered
                    ? 'bg-hover border-muted'
                    : 'border-transparent hover:bg-hover hover:border-muted')
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[5px]"
                    style={{ backgroundColor: task.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium m-0 text-fg truncate">{task.name}</p>
                    <p className="m-0 text-muted">
                      {readableTime(block.startTime)} – {readableTime(block.endTime)}
                    </p>
                    {task.description && (
                      <p className="m-0 text-muted truncate">{task.description}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default TaskList;
