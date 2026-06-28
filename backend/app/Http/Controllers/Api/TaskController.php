<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = $request->user()->tasks()->orderBy('name')->get();

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $task = $request->user()->tasks()->create($data);

        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        $task->delete();

        return response()->json(null, 204);
    }
}
