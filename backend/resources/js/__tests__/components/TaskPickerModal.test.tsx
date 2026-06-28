import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskPickerModal } from '../../components/TaskPickerModal';
import { SelectedCellsContext } from '../../contexts/SelectCellsContext';
import { ToolbarContext } from '../../contexts/ToolbarContext';

vi.mock('../../lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { id: 3, name: 'New Task', description: null, color: '#3b82f6' } }),
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

const mockTasks = {
  '1': { id: 1, name: 'Design', description: null, color: '#3b82f6' },
  '2': { id: 2, name: 'Development', description: 'Coding work', color: '#ef4444' },
};

function renderModal(
  pendingSelection: { day: string; startTime: number; endTime: number } | null,
  {
    submitTimeBlock = vi.fn().mockResolvedValue(undefined),
    clearPendingSelection = vi.fn(),
    setTasks = vi.fn(),
    tasks = mockTasks,
  }: {
    submitTimeBlock?: ReturnType<typeof vi.fn>;
    clearPendingSelection?: ReturnType<typeof vi.fn>;
    setTasks?: ReturnType<typeof vi.fn>;
    tasks?: typeof mockTasks;
  } = {}
) {
  return {
    submitTimeBlock,
    clearPendingSelection,
    setTasks,
    ...render(
      <ToolbarContext.Provider
        value={{ tasks, setTasks, taskMruOrder: [] } as any}
      >
        <SelectedCellsContext.Provider
          value={{
            pendingSelection,
            submitTimeBlock,
            clearPendingSelection,
            selectedCells: { day: null, StartCell: null, EndCell: null },
            cellsData: {},
            hoveredTimeBlockId: null,
            sidebarHoveredBlockId: null,
            setSidebarHoveredBlockId: vi.fn(),
            currentTimeData: {},
            refreshTimeBlocks: vi.fn(),
          }}
        >
          <TaskPickerModal />
        </SelectedCellsContext.Provider>
      </ToolbarContext.Provider>
    ),
  };
}

describe('TaskPickerModal', () => {
  it('renders nothing when pendingSelection is null', () => {
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal when pendingSelection is set', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 });
    expect(screen.getByText('Pick a task')).toBeInTheDocument();
  });

  it('shows selected time range and date in the modal', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 });
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-28/)).toBeInTheDocument();
  });

  it('lists all available tasks', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 });
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('calls submitTimeBlock with the task id when a task is clicked', () => {
    const submitTimeBlock = vi.fn().mockResolvedValue(undefined);
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 }, { submitTimeBlock });
    fireEvent.click(screen.getByText('Design'));
    expect(submitTimeBlock).toHaveBeenCalledWith('1');
  });

  it('shows "no tasks" message when task list is empty', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 }, { tasks: {} as any });
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it('shows create form when "+ New task" is clicked', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 });
    fireEvent.click(screen.getByText('+ New task'));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
  });

  it('hides create form when Cancel is clicked within the form', () => {
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 });
    fireEvent.click(screen.getByText('+ New task'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('creates a new task and submits time block on form submit', async () => {
    const submitTimeBlock = vi.fn().mockResolvedValue(undefined);
    const setTasks = vi.fn();
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 }, { submitTimeBlock, setTasks });

    fireEvent.click(screen.getByText('+ New task'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My New Task' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create & add' }));

    await waitFor(() => {
      expect(submitTimeBlock).toHaveBeenCalledWith('3');
    });
    expect(setTasks).toHaveBeenCalled();
  });

  it('calls clearPendingSelection when Dismiss is clicked', () => {
    const clearPendingSelection = vi.fn();
    renderModal({ day: '2026-06-28', startTime: 540, endTime: 600 }, { clearPendingSelection });
    fireEvent.click(screen.getByText('Dismiss'));
    expect(clearPendingSelection).toHaveBeenCalled();
  });
});
