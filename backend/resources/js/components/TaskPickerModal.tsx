import { useContext, useState } from 'react';
import { SelectedCellsContext } from '../contexts/SelectCellsContext';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { readableTime } from '../utils/utils';
import api from '../lib/api';

export const TaskPickerModal = () => {
  const { pendingSelection, submitTimeBlock, clearPendingSelection } = useContext(SelectedCellsContext);
  const { tasks, setTasks, taskMruOrder } = useContext(ToolbarContext);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingSelection) return null;

  const handleClose = () => {
    clearPendingSelection();
    setShowCreate(false);
  };

  const handleSelectTask = (taskId: string) => {
    submitTimeBlock(taskId);
    setShowCreate(false);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/tasks', {
        name: newName,
        color: newColor,
        description: newDescription || null,
      });
      setTasks((prev) => ({ ...prev, [String(data.id)]: data }));
      await submitTimeBlock(String(data.id));
      setNewName('');
      setNewDescription('');
      setNewColor('#3b82f6');
      setShowCreate(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const taskList = Object.values(tasks).sort((a, b) => {
    const aIdx = taskMruOrder.indexOf(String(a.id));
    const bIdx = taskMruOrder.indexOf(String(b.id));
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const inputClass =
    'w-full px-2 py-1 rounded-control border text-sm bg-canvas text-fg ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-fg';

  const btnPrimary =
    'flex-1 h-8 px-3 rounded-control border border-fg bg-fg text-canvas text-sm font-medium transition-colors disabled:opacity-50';

  const btnSecondary =
    'h-8 px-3 rounded-control border text-sm bg-canvas ' +
    'text-fg hover:bg-hover transition-colors';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onMouseDown={handleClose}
    >
      <div
        className="bg-canvas rounded-panel border p-4 w-80 max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl leading-none font-bold text-fg m-0 mb-1">Pick a task</h2>
        <p className="text-base text-fg/80 m-0 mb-4">
          {readableTime(pendingSelection.startTime)} – {readableTime(pendingSelection.endTime)}
          {' · '}{pendingSelection.day}
        </p>

        <div className="overflow-y-auto flex-1 min-h-0">
          {taskList.length > 0 ? (
            <ul className="list-none p-0 m-0 mb-4" role="list">
              {taskList.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => handleSelectTask(String(task.id))}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-control border border-transparent hover:bg-hover hover:border-muted text-left transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-sm text-fg truncate">{task.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-fg/80 m-0 mb-4">No tasks yet. Create one below.</p>
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-fg hover:underline"
            >
              + New task
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-3 border-t pt-3">
              <div>
                <label htmlFor="new-task-name" className="text-xs text-muted block mb-1">
                  Name
                </label>
                <input
                  id="new-task-name"
                  type="text"
                  placeholder="Task name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="new-task-description" className="text-xs text-muted block mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="new-task-description"
                  placeholder="Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="new-task-color" className="text-xs text-muted">
                  Color
                </label>
                <input
                  id="new-task-color"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded-control cursor-pointer border-0 bg-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                  {isSubmitting ? 'Adding…' : 'Create & add'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <button
          onClick={handleClose}
          className="mt-4 w-full text-sm text-muted hover:text-fg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
