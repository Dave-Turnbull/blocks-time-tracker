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
    extendWindow: vi.fn(),
    pendingSelection: null,
    submitTimeBlock: vi.fn(),
    clearPendingSelection: vi.fn(),
  } as any;
}

function renderRange(
  cellsData: Record<string, unknown[]>,
  goToTarget = { date: '2026-06-28', nonce: 0 },
) {
  return render(
    <ToolbarContext.Provider value={{ tasks, minuteinput: 15, goToTarget, zoom: 1 } as any}>
      <SelectedCellsContext.Provider value={makeContextValue(cellsData)}>
        <RenderDateRange />
      </SelectedCellsContext.Provider>
    </ToolbarContext.Provider>
  );
}

function rerenderRange(
  rerender: (ui: React.ReactElement) => void,
  cellsData: Record<string, unknown[]>,
  goToTarget = { date: '2026-06-28', nonce: 0 },
) {
  act(() => {
    rerender(
      <ToolbarContext.Provider value={{ tasks, minuteinput: 15, goToTarget, zoom: 1 } as any}>
        <SelectedCellsContext.Provider value={makeContextValue(cellsData)}>
          <RenderDateRange />
        </SelectedCellsContext.Provider>
      </ToolbarContext.Provider>
    );
  });
}

const sidebarDay = () => screen.getByRole('region', { name: 'Tasks' }).getAttribute('data-day');

describe('RenderDateRange', () => {
  it('shows the first day of cellsData in the sidebar heading', () => {
    renderRange({ '2026-06-28': [] });
    expect(sidebarDay()).toBe('2026-06-28');
  });

  it('updates the sidebar heading when cellsData loads after an initially empty render', () => {
    // This test specifically catches the bug where useEffect([]) fired before
    // the API response arrived, leaving currentFocusedDay as undefined forever.
    const { rerender } = renderRange({});

    expect(sidebarDay()).toBe('');

    // cellsData arrives from the API
    rerenderRange(rerender, { '2026-06-28': [] });

    expect(sidebarDay()).toBe('2026-06-28');
  });

  it('resets the sidebar to the first available day when the date window changes', () => {
    const { rerender } = renderRange({ '2026-06-28': [], '2026-06-29': [] });
    expect(sidebarDay()).toBe('2026-06-28');

    rerenderRange(rerender, { '2026-07-01': [], '2026-07-02': [] });

    expect(sidebarDay()).toBe('2026-07-01');
  });

  it('focuses the go-to date when a new go-to target fires', () => {
    const days = { '2026-06-28': [], '2026-06-29': [], '2026-06-30': [] };
    const { rerender } = renderRange(days);
    expect(sidebarDay()).toBe('2026-06-28');

    rerenderRange(rerender, days, { date: '2026-06-30', nonce: 1 });

    expect(sidebarDay()).toBe('2026-06-30');
  });

  it('does not re-focus the go-to date on unrelated re-renders with the same nonce', () => {
    const days = { '2026-06-28': [], '2026-06-29': [] };
    const { rerender } = renderRange(days);

    // Same nonce, new window that no longer contains the focused day: the
    // fallback (first available day) should win, not the stale go-to date.
    rerenderRange(rerender, { '2026-07-01': [], '2026-07-02': [] });

    expect(sidebarDay()).toBe('2026-07-01');
  });
});
