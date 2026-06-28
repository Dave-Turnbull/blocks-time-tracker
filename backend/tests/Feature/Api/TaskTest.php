<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function test_user_can_list_their_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->count(3)->for($user)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(3);
    }

    public function test_tasks_are_returned_ordered_by_name(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create(['name' => 'Zebra task']);
        Task::factory()->for($user)->create(['name' => 'Alpha task']);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/tasks')->assertOk();

        $this->assertEquals('Alpha task', $response->json('0.name'));
        $this->assertEquals('Zebra task', $response->json('1.name'));
    }

    public function test_user_cannot_see_other_users_tasks(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Task::factory()->count(2)->for($other)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(0);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function test_user_can_create_a_task(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/tasks', [
            'name' => 'My Task',
            'description' => 'A description',
            'color' => '#ff0000',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'My Task')
            ->assertJsonPath('color', '#ff0000');

        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'name' => 'My Task',
        ]);
    }

    public function test_store_allows_null_description(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', [
            'name' => 'Task without description',
            'color' => '#00ff00',
        ])->assertStatus(201)->assertJsonPath('description', null);
    }

    public function test_store_requires_name(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', ['color' => '#ff0000'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_requires_color(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', ['name' => 'Task'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['color']);
    }

    public function test_store_rejects_invalid_color_format(): void
    {
        Sanctum::actingAs(User::factory()->create());

        foreach (['red', 'ff0000', '#ff00', '#gggggg'] as $bad) {
            $this->postJson('/api/tasks', ['name' => 'Task', 'color' => $bad])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['color']);
        }
    }

    public function test_store_requires_authentication(): void
    {
        $this->postJson('/api/tasks', ['name' => 'Task', 'color' => '#ff0000'])
            ->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function test_user_can_update_their_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['name' => 'Old name']);
        Sanctum::actingAs($user);

        $this->putJson("/api/tasks/{$task->id}", ['name' => 'New name'])
            ->assertOk()
            ->assertJsonPath('name', 'New name');

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'name' => 'New name']);
    }

    public function test_user_cannot_update_another_users_task(): void
    {
        $task = Task::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/tasks/{$task->id}", ['name' => 'Hijack'])
            ->assertForbidden();
    }

    public function test_update_rejects_invalid_color(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->putJson("/api/tasks/{$task->id}", ['color' => 'not-a-color'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['color']);
    }

    public function test_update_requires_authentication(): void
    {
        $task = Task::factory()->create();

        $this->putJson("/api/tasks/{$task->id}", ['name' => 'New'])->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------

    public function test_user_can_delete_their_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/tasks/{$task->id}")->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_user_cannot_delete_another_users_task(): void
    {
        $task = Task::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/tasks/{$task->id}")->assertForbidden();
    }

    public function test_destroy_requires_authentication(): void
    {
        $task = Task::factory()->create();

        $this->deleteJson("/api/tasks/{$task->id}")->assertUnauthorized();
    }
}
