import { describe, it, expect } from 'vitest';
import timesToCells, { CellObject } from '../../utils/timesToCells';

describe('timesToCells', () => {
    describe('cell array structure', () => {
        it('returns the correct number of cells for a given timePerCell', () => {
            expect(timesToCells([], 15)).toHaveLength(96);   // 1440 / 15
            expect(timesToCells([], 30)).toHaveLength(48);   // 1440 / 30
            expect(timesToCells([], 60)).toHaveLength(24);   // 1440 / 60
        });

        it('each cell starts at the right time offset', () => {
            const cells = timesToCells([], 30);
            expect(cells[0].startTime).toBe(0);
            expect(cells[1].startTime).toBe(30);
            expect(cells[2].startTime).toBe(60);
            expect(cells[47].startTime).toBe(1410);
        });

        it('returns CellObject instances', () => {
            const cells = timesToCells([], 15);
            expect(cells[0]).toBeInstanceOf(CellObject);
        });

        it('all cells have empty task arrays when given no events', () => {
            const cells = timesToCells([], 15);
            cells.forEach(cell => expect(cell.tasks).toHaveLength(0));
        });

        it('handles undefined input the same as an empty array', () => {
            const cells = timesToCells(undefined, 15);
            expect(cells).toHaveLength(96);
            cells.forEach(cell => expect(cell.tasks).toHaveLength(0));
        });
    });

    describe('single-cell events', () => {
        it('places an event that fits exactly in one cell into only that cell', () => {
            // start=0, end=15 → only cell 0
            const cells = timesToCells([{ startTime: 0, endTime: 15, taskID: 'A' }], 15);

            expect(cells[0].tasks).toHaveLength(1);
            expect(cells[1].tasks).toHaveLength(0);
        });

        it('stores the local offsets within the cell, not the global times', () => {
            // event: global 15–30 → cell 1, local offsets 0–15
            const cells = timesToCells([{ startTime: 15, endTime: 30, taskID: 'A' }], 15);

            expect(cells[1].tasks[0].startTime).toBe(0);
            expect(cells[1].tasks[0].endTime).toBe(15);
        });

        it('preserves the taskID on the stored task', () => {
            const cells = timesToCells([{ startTime: 0, endTime: 15, taskID: 'task-42' }], 15);
            expect(cells[0].tasks[0].taskID).toBe('task-42');
        });
    });

    describe('multi-cell events', () => {
        it('spreads an event across every cell it spans', () => {
            // start=0, end=30 → cells 0 and 1 with 15-min cells
            const cells = timesToCells([{ startTime: 0, endTime: 30, taskID: 'A' }], 15);

            expect(cells[0].tasks).toHaveLength(1);
            expect(cells[1].tasks).toHaveLength(1);
            expect(cells[2].tasks).toHaveLength(0);
        });

        it('stores correct local offsets in every spanned cell', () => {
            // event 0–30, cell size 15
            // cell 0: local 0–15, cell 1: local 0–15
            const cells = timesToCells([{ startTime: 0, endTime: 30, taskID: 'A' }], 15);

            expect(cells[0].tasks[0]).toMatchObject({ startTime: 0, endTime: 15 });
            expect(cells[1].tasks[0]).toMatchObject({ startTime: 0, endTime: 15 });
        });

        it('handles a partial start: event begins mid-cell', () => {
            // event 5–25 with 15-min cells
            // cell 0 (0–15): local start = 5, local end = 15
            // cell 1 (15–30): local start = 0, local end = 10
            const cells = timesToCells([{ startTime: 5, endTime: 25, taskID: 'A' }], 15);

            expect(cells[0].tasks[0]).toMatchObject({ startTime: 5, endTime: 15 });
            expect(cells[1].tasks[0]).toMatchObject({ startTime: 0, endTime: 10 });
            expect(cells[2].tasks).toHaveLength(0);
        });

        it('handles a partial end: event finishes mid-cell', () => {
            // event 0–10 with 15-min cells — only cell 0, ends at 10
            const cells = timesToCells([{ startTime: 0, endTime: 10, taskID: 'A' }], 15);

            expect(cells[0].tasks[0]).toMatchObject({ startTime: 0, endTime: 10 });
            expect(cells[1].tasks).toHaveLength(0);
        });
    });

    describe('multiple events', () => {
        it('places two non-overlapping events in their respective cells', () => {
            const cells = timesToCells([
                { startTime: 0, endTime: 15, taskID: 'A' },
                { startTime: 30, endTime: 45, taskID: 'B' },
            ], 15);

            expect(cells[0].tasks[0].taskID).toBe('A');
            expect(cells[1].tasks).toHaveLength(0);
            expect(cells[2].tasks[0].taskID).toBe('B');
        });

        it('places two events overlapping the same cell into that cell', () => {
            // Both events cover cell 0 (0–15)
            const cells = timesToCells([
                { startTime: 0, endTime: 15, taskID: 'A' },
                { startTime: 0, endTime: 15, taskID: 'B' },
            ], 15);

            expect(cells[0].tasks).toHaveLength(2);
        });

        it('does not cross-contaminate cells with adjacent events', () => {
            const cells = timesToCells([
                { startTime: 0,  endTime: 15, taskID: 'A' },
                { startTime: 15, endTime: 30, taskID: 'B' },
            ], 15);

            expect(cells[0].tasks).toHaveLength(1);
            expect(cells[0].tasks[0].taskID).toBe('A');
            expect(cells[1].tasks).toHaveLength(1);
            expect(cells[1].tasks[0].taskID).toBe('B');
        });
    });
});
