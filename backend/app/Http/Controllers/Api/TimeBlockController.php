<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeBlock;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeBlockController extends Controller
{
    /**
     * Return all time blocks with task data for the given date range,
     * grouped by date in the format the frontend expects.
     *
     * GET /api/time-blocks?start=YYYY-MM-DD&end=YYYY-MM-DD
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after_or_equal:start'],
        ]);

        $blocks = $request->user()
            ->timeBlocks()
            ->with('task:id,name,description,color')
            ->whereBetween('date', [$request->start, $request->end])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        // Group by date, shape to match frontend TimeEntry structure
        $grouped = $blocks->groupBy(fn ($b) => $b->date->toDateString())
            ->map(fn ($dayBlocks) => $dayBlocks->map(fn ($b) => [
                'id' => $b->id,
                'startTime' => $b->start_time,
                'endTime' => $b->end_time,
                'taskID' => (string) $b->task_id,
                'task' => $b->task,
            ])->values());

        return response()->json($grouped);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'integer', 'min:0', 'max:1439'],
            'end_time' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $this->resolveOverlaps($user, $data['date'], $data['start_time'], $data['end_time']);

        $block = $user->timeBlocks()->create($data);
        $block->load('task:id,name,description,color');

        return response()->json([
            'id' => $block->id,
            'startTime' => $block->start_time,
            'endTime' => $block->end_time,
            'taskID' => (string) $block->task_id,
            'task' => $block->task,
        ], 201);
    }

    /**
     * Erase all time blocks (or portions thereof) within a given time range
     * for the authenticated user, without creating a new block.
     */
    public function erase(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'start_time' => ['required', 'integer', 'min:0', 'max:1439'],
            'end_time' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $this->resolveOverlaps($user, $request->date, $request->start_time, $request->end_time);

        return response()->json(null, 204);
    }

    public function update(Request $request, TimeBlock $timeBlock): JsonResponse
    {
        $this->authorize('update', $timeBlock);

        $data = $request->validate([
            'task_id' => ['sometimes', 'integer', 'exists:tasks,id'],
            'date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'integer', 'min:0', 'max:1439'],
            'end_time' => ['sometimes', 'integer', 'min:1', 'max:1440'],
        ]);

        $timeBlock->update($data);
        $timeBlock->load('task:id,name,description,color');

        return response()->json([
            'id' => $timeBlock->id,
            'startTime' => $timeBlock->start_time,
            'endTime' => $timeBlock->end_time,
            'taskID' => (string) $timeBlock->task_id,
            'task' => $timeBlock->task,
        ]);
    }

    public function destroy(TimeBlock $timeBlock): JsonResponse
    {
        $this->authorize('delete', $timeBlock);
        $timeBlock->delete();

        return response()->json(null, 204);
    }

    /**
     * Trim or delete existing time blocks that overlap [startTime, endTime).
     * Blocks use half-open intervals so adjacent blocks share boundary values
     * with no gap (e.g. [0,60) and [60,120) are contiguous, not overlapping).
     *   - Fully encompassed blocks are deleted.
     *   - Blocks that extend beyond the range on one side are trimmed to the boundary.
     *   - Blocks that fully contain the range are split into two fragments at
     *     the boundary (left end_time = startTime, right start_time = endTime).
     */
    private function resolveOverlaps(User $user, string $date, int $startTime, int $endTime): void
    {
        $overlapping = $user->timeBlocks()
            ->where('date', $date)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->get();

        foreach ($overlapping as $block) {
            $blockStart = $block->start_time;
            $blockEnd   = $block->end_time;

            // Fully encompassed: delete.
            if ($blockStart >= $startTime && $blockEnd <= $endTime) {
                $block->delete();
                continue;
            }

            // Existing block fully contains the new range: split into two fragments.
            if ($blockStart < $startTime && $blockEnd > $endTime) {
                $user->timeBlocks()->create([
                    'task_id'    => $block->task_id,
                    'date'       => $block->date->toDateString(),
                    'start_time' => $endTime,
                    'end_time'   => $blockEnd,
                ]);
                $block->update(['end_time' => $startTime]);
                continue;
            }

            // Existing starts before new range, ends inside it: trim the right side.
            if ($blockStart < $startTime) {
                $block->update(['end_time' => $startTime]);
                continue;
            }

            // Existing starts inside new range, ends after it: trim the left side.
            $block->update(['start_time' => $endTime]);
        }
    }
}
