import { render, screen, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { RenderDateRange } from '../../components/RenderDateRange';
import { SelectedCellsContext } from '../../contexts/SelectCellsContext';
import { ToolbarContext } from '../../contexts/ToolbarContext';

// jsdom stubs
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const tasks = {
  '1': { id: 1, name: 'Design', description: null, color: '#3b82f6' },
};

const timeData = {
  '2026-06-28': [{ id: 1, startTime: 540, endTime: 600, taskID: '1' }],
};

function makeContextValue(cellsData: Record<string, unknown[]>) {
  return {
    selectedCells: { day: null, StartCell: null, EndCell: null },
    cellsData,
    hoveredTimeBlockId: null,
    sidebarHoveredBlockId: null,
    setSidebarHoveredBlockId: vi.fn(),
    currentTimeData: timeData,
    refreshTimeBlocks: vi.fn(),
    pendingSelection: null,
    submitTimeBlock: vi.fn(),
    clearPendingSelection: vi.fn(),
  } as any;
}

function renderRange(cellsData: Record<string, unknown[]>) {
  return render(
    <ToolbarContext.Provider value={{ tasks, minuteinput: 15 } as any}>
      <SelectedCellsContext.Provider value={makeContextValue(cellsData)}>
        <RenderDateRange />
      </SelectedCellsContext.Provider>
    </ToolbarContext.Provider>
  );
}

// The TaskList heading shows the date in YYYY-MM-DD format.
// SingleDay headings show the human-readable date ("Sunday 28th June 2026"),
// so querying for the ISO format is unique to the TaskList sidebar.
const taskListHeading = (date: string) => screen.getByText(date);

describe('RenderDateRange', () => {
  it('shows the first day of cellsData in the sidebar heading', () => {
    renderRange({ '2026-06-28': [] });
    expect(taskListHeading('2026-06-28')).toBeInTheDocument();
  });

  it('updates the sidebar heading when cellsData loads after an initially empty render', () => {
    // This test specifically catches the bug where useEffect([]) fired before
    // the API response arrived, leaving currentFocusedDay as undefined forever.
    const { rerender } = renderRange({});

    // Initially empty: no date set, sidebar shows fallback text
    expect(screen.queryByText('2026-06-28')).not.toBeInTheDocument();

    // cellsData arrives from the API
    act(() => {
      rerender(
        <ToolbarContext.Provider value={{ tasks, minuteinput: 15 } as any}>
          <SelectedCellsContext.Provider value={makeContextValue({ '2026-06-28': [] })}>
            <RenderDateRange />
          </SelectedCellsContext.Provider>
        </ToolbarContext.Provider>
      );
    });

    expect(taskListHeading('2026-06-28')).toBeInTheDocument();
  });

  it('resets the sidebar to the first available day when the date range changes', () => {
    const { rerender } = renderRange({ '2026-06-28': [], '2026-06-29': [] });
    expect(taskListHeading('2026-06-28')).toBeInTheDocument();

    act(() => {
      rerender(
        <ToolbarContext.Provider value={{ tasks, minuteinput: 15 } as any}>
          <SelectedCellsContext.Provider value={makeContextValue({ '2026-07-01': [], '2026-07-02': [] })}>
            <RenderDateRange />
          </SelectedCellsContext.Provider>
        </ToolbarContext.Provider>
      );
    });

    expect(taskListHeading('2026-07-01')).toBeInTheDocument();
    expect(screen.queryByText('2026-06-28')).not.toBeInTheDocument();
  });
});
