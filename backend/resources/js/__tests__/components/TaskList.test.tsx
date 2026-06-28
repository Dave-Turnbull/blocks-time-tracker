import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import TaskList from '../../components/TaskList';
import { SelectedCellsContext } from '../../contexts/SelectCellsContext';
import { ToolbarContext } from '../../contexts/ToolbarContext';

// jsdom does not implement scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockTasks = {
  '1': { id: 1, name: 'Design', description: 'UI work', color: '#3b82f6' },
  '2': { id: 2, name: 'Development', description: null, color: '#ef4444' },
};

const mockTimeData = {
  '2026-06-28': [
    { id: 10, startTime: 540, endTime: 600, taskID: '1' },
    { id: 11, startTime: 660, endTime: 720, taskID: '2' },
  ],
  '2026-06-29': [],
};

function renderTaskList(
  singleDayDataOnScroll: string,
  hoveredTimeBlockId: number | null = null,
  {
    setSidebarHoveredBlockId = vi.fn(),
    currentTimeData = mockTimeData,
    tasks = mockTasks,
  }: {
    setSidebarHoveredBlockId?: ReturnType<typeof vi.fn>;
    currentTimeData?: typeof mockTimeData;
    tasks?: typeof mockTasks;
  } = {}
) {
  return {
    setSidebarHoveredBlockId,
    ...render(
      <ToolbarContext.Provider value={{ tasks } as any}>
        <SelectedCellsContext.Provider
          value={{
            hoveredTimeBlockId,
            sidebarHoveredBlockId: null,
            setSidebarHoveredBlockId,
            currentTimeData,
            selectedCells: { day: null, StartCell: null, EndCell: null },
            cellsData: {},
            pendingSelection: null,
            submitTimeBlock: vi.fn(),
            clearPendingSelection: vi.fn(),
            refreshTimeBlocks: vi.fn(),
          } as any}
        >
          <TaskList singleDayDataOnScroll={singleDayDataOnScroll} />
        </SelectedCellsContext.Provider>
      </ToolbarContext.Provider>
    ),
  };
}

describe('TaskList', () => {
  it('shows "No time blocks" when the day has no blocks', () => {
    renderTaskList('2026-06-29');
    expect(screen.getByText('No time blocks for this day.')).toBeInTheDocument();
  });

  it('shows "No time blocks" when singleDayDataOnScroll is empty string', () => {
    renderTaskList('');
    expect(screen.getByText('No time blocks for this day.')).toBeInTheDocument();
  });

  it('renders all time blocks for the given day', () => {
    renderTaskList('2026-06-28');
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('renders task description when present', () => {
    renderTaskList('2026-06-28');
    expect(screen.getByText('UI work')).toBeInTheDocument();
  });

  it('renders start and end times for each block', () => {
    renderTaskList('2026-06-28');
    // block 10: 540–600 min = 09:00–10:00
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.getAllByText(/10:00/).length).toBeGreaterThan(0);
  });

  it('renders blocks in chronological order', () => {
    renderTaskList('2026-06-28');
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Design');
    expect(items[1]).toHaveTextContent('Development');
  });

  it('applies highlight class when hoveredTimeBlockId matches a block id', () => {
    renderTaskList('2026-06-28', 10);
    const items = screen.getAllByRole('listitem');
    expect(items[0].className).toMatch(/surface-active/);
    expect(items[1].className).not.toMatch(/surface-active/);
  });

  it('does not apply highlight when hoveredTimeBlockId is null', () => {
    renderTaskList('2026-06-28', null);
    screen.getAllByRole('listitem').forEach((item) => {
      expect(item.className).not.toMatch(/surface-active/);
    });
  });

  it('calls setSidebarHoveredBlockId with the block id on mouse enter', () => {
    const setSidebarHoveredBlockId = vi.fn();
    renderTaskList('2026-06-28', null, { setSidebarHoveredBlockId });
    fireEvent.mouseEnter(screen.getAllByRole('listitem')[0]);
    expect(setSidebarHoveredBlockId).toHaveBeenCalledWith(10);
  });

  it('calls setSidebarHoveredBlockId with null on mouse leave', () => {
    const setSidebarHoveredBlockId = vi.fn();
    renderTaskList('2026-06-28', null, { setSidebarHoveredBlockId });
    fireEvent.mouseLeave(screen.getAllByRole('listitem')[0]);
    expect(setSidebarHoveredBlockId).toHaveBeenCalledWith(null);
  });

  it('shows the day as the heading', () => {
    renderTaskList('2026-06-28');
    expect(screen.getByRole('heading')).toHaveTextContent('2026-06-28');
  });
});
