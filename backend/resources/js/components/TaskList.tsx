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
    <div className="p-4">
      <h2 className="text-base font-semibold mb-3 pb-2 border-b text-fg-secondary border-line">
        {singleDayDataOnScroll || 'Time blocks'}
      </h2>

      {sorted.length === 0 ? (
        <p className="text-xs text-fg-subtle">No time blocks for this day.</p>
      ) : (
        <ul className="list-none p-0 m-0 space-y-1.5">
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
                className={
                  'text-sm rounded px-3 py-2 border transition-colors ' +
                  (isHovered
                    ? 'bg-[var(--color-surface-active)] border-accent-line'
                    : 'bg-surface-hover border-line')
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: task.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium m-0 text-fg truncate">{task.name}</p>
                    {task.description && (
                      <p className="text-xs m-0 mt-0.5 text-fg-muted truncate">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs m-0 mt-0.5 text-fg-muted">
                      {readableTime(block.startTime)} – {readableTime(block.endTime)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
