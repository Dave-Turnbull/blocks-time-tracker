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
    'w-full px-2 py-1 rounded border text-sm ' +
    'bg-slate-50 border-slate-300 text-slate-700 ' +
    'dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100';

  const btnPrimary =
    'flex-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50';

  const btnSecondary =
    'px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm ' +
    'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onMouseDown={handleClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-80 max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-slate-700 dark:text-slate-100 mb-1">Pick a task</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          {readableTime(pendingSelection.startTime)} – {readableTime(pendingSelection.endTime)}
          {' · '}{pendingSelection.day}
        </p>

        <div className="overflow-y-auto flex-1 min-h-0">
          {taskList.length > 0 ? (
            <ul className="space-y-1.5 mb-4" role="list">
              {taskList.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => handleSelectTask(String(task.id))}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-100 truncate">{task.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">No tasks yet. Create one below.</p>
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + New task
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
              <div>
                <label htmlFor="new-task-name" className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
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
                <label htmlFor="new-task-description" className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
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
                <label htmlFor="new-task-color" className="text-xs text-slate-500 dark:text-slate-400">
                  Color
                </label>
                <input
                  id="new-task-color"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
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
          className="mt-4 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
