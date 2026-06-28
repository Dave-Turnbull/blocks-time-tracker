<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeBlock;
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

        $block = $request->user()->timeBlocks()->create($data);
        $block->load('task:id,name,description,color');

        return response()->json([
            'id' => $block->id,
            'startTime' => $block->start_time,
            'endTime' => $block->end_time,
            'taskID' => (string) $block->task_id,
            'task' => $block->task,
        ], 201);
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
}
