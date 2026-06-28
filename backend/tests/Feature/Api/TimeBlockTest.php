<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Models\TimeBlock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimeBlockTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function test_returns_blocks_grouped_by_date(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 60,
        ]);
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 120,
            'end_time' => 180,
        ]);
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-02',
            'start_time' => 0,
            'end_time' => 60,
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-02')
            ->assertOk();

        $data = $response->json();
        $this->assertArrayHasKey('2024-08-01', $data);
        $this->assertArrayHasKey('2024-08-02', $data);
        $this->assertCount(2, $data['2024-08-01']);
        $this->assertCount(1, $data['2024-08-02']);
    }

    public function test_response_matches_frontend_shape(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-01')
            ->assertOk();

        $block = $response->json('2024-08-01.0');
        $this->assertArrayHasKey('id', $block);
        $this->assertArrayHasKey('startTime', $block);
        $this->assertArrayHasKey('endTime', $block);
        $this->assertArrayHasKey('taskID', $block);
        $this->assertArrayHasKey('task', $block);
        $this->assertEquals(60, $block['startTime']);
        $this->assertEquals(120, $block['endTime']);
        $this->assertIsString($block['taskID']);
        $this->assertEquals($task->id, $block['task']['id']);
    }

    public function test_filters_blocks_to_requested_date_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        TimeBlock::factory()->for($user)->for($task)->create(['date' => '2024-07-31']);
        TimeBlock::factory()->for($user)->for($task)->create(['date' => '2024-08-01']);
        TimeBlock::factory()->for($user)->for($task)->create(['date' => '2024-08-05']);
        Sanctum::actingAs($user);

        $data = $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-03')
            ->assertOk()
            ->json();

        $this->assertArrayNotHasKey('2024-07-31', $data);
        $this->assertArrayHasKey('2024-08-01', $data);
        $this->assertArrayNotHasKey('2024-08-05', $data);
    }

    public function test_does_not_return_other_users_blocks(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $otherTask = Task::factory()->for($other)->create();
        TimeBlock::factory()->for($other)->for($otherTask)->create(['date' => '2024-08-01']);
        Sanctum::actingAs($user);

        $data = $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-01')
            ->assertOk()
            ->json();

        $this->assertEmpty($data);
    }

    public function test_blocks_within_day_are_ordered_by_start_time(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        TimeBlock::factory()->for($user)->for($task)->create(['date' => '2024-08-01', 'start_time' => 120, 'end_time' => 180]);
        TimeBlock::factory()->for($user)->for($task)->create(['date' => '2024-08-01', 'start_time' => 0,   'end_time' => 60]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-01')->assertOk();

        $this->assertEquals(0,   $response->json('2024-08-01.0.startTime'));
        $this->assertEquals(120, $response->json('2024-08-01.1.startTime'));
    }

    public function test_index_requires_start_and_end_params(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/time-blocks')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start', 'end']);
    }

    public function test_end_must_not_be_before_start(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/time-blocks?start=2024-08-05&end=2024-08-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['end']);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/time-blocks?start=2024-08-01&end=2024-08-01')->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function test_user_can_create_a_time_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/time-blocks', [
            'task_id' => $task->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('startTime', 60)
            ->assertJsonPath('endTime', 120)
            ->assertJsonPath('taskID', (string) $task->id);

        $this->assertDatabaseHas('time_blocks', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ]);
    }

    public function test_store_requires_all_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/time-blocks', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['task_id', 'date', 'start_time', 'end_time']);
    }

    public function test_store_requires_task_to_exist(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/time-blocks', [
            'task_id' => 99999,
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 60,
        ])->assertUnprocessable()->assertJsonValidationErrors(['task_id']);
    }

    public function test_store_rejects_start_time_out_of_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $task->id,
            'date' => '2024-08-01',
            'start_time' => 1440,
            'end_time' => 1441,
        ])->assertUnprocessable()->assertJsonValidationErrors(['start_time']);
    }

    public function test_store_requires_authentication(): void
    {
        $this->postJson('/api/time-blocks', [])->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Store — overlap resolution
    // -------------------------------------------------------------------------

    public function test_store_deletes_fully_encompassed_existing_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $existing = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 30,
            'end_time' => 60,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ])->assertStatus(201);

        $this->assertDatabaseMissing('time_blocks', ['id' => $existing->id]);
        $this->assertDatabaseHas('time_blocks', [
            'user_id' => $user->id,
            'task_id' => $newTask->id,
            'start_time' => 0,
            'end_time' => 120,
        ]);
    }

    public function test_store_trims_block_that_starts_before_and_ends_inside_new_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $existing = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 90,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_blocks', [
            'id' => $existing->id,
            'start_time' => 0,
            'end_time' => 60,
        ]);
    }

    public function test_store_trims_block_that_starts_inside_and_ends_after_new_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $existing = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 180,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 30,
            'end_time' => 90,
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_blocks', [
            'id' => $existing->id,
            'start_time' => 90,
            'end_time' => 180,
        ]);
    }

    public function test_store_splits_block_that_fully_contains_new_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $existing = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 30,
            'end_time' => 60,
        ])->assertStatus(201);

        // Left fragment (original block updated)
        $this->assertDatabaseHas('time_blocks', [
            'id' => $existing->id,
            'task_id' => $task->id,
            'start_time' => 0,
            'end_time' => 30,
        ]);
        // Right fragment (new row with original task)
        $this->assertDatabaseHas('time_blocks', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ]);
        // New block
        $this->assertDatabaseHas('time_blocks', [
            'user_id' => $user->id,
            'task_id' => $newTask->id,
            'start_time' => 30,
            'end_time' => 60,
        ]);
        $this->assertDatabaseCount('time_blocks', 3);
    }

    public function test_store_resolves_multiple_overlapping_blocks(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        // block A: fully inside new range → deleted
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 60, 'end_time' => 90,
        ]);
        // block B: starts before, ends inside → trimmed
        $blockB = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 75,
        ]);
        // block C: starts inside, ends after → trimmed
        $blockC = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 90, 'end_time' => 180,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ])->assertStatus(201);

        $this->assertDatabaseCount('time_blocks', 3);
        $this->assertDatabaseHas('time_blocks', ['id' => $blockB->id, 'end_time' => 60]);
        $this->assertDatabaseHas('time_blocks', ['id' => $blockC->id, 'start_time' => 120]);
    }

    public function test_store_does_not_affect_non_overlapping_blocks(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $before = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 30,
        ]);
        $after = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 120, 'end_time' => 180,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 90,
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_blocks', ['id' => $before->id, 'start_time' => 0, 'end_time' => 30]);
        $this->assertDatabaseHas('time_blocks', ['id' => $after->id, 'start_time' => 120, 'end_time' => 180]);
    }

    public function test_store_does_not_affect_blocks_on_other_dates(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $newTask = Task::factory()->for($user)->create();
        $otherDay = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-02', 'start_time' => 0, 'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $newTask->id,
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_blocks', [
            'id' => $otherDay->id,
            'start_time' => 0,
            'end_time' => 120,
        ]);
    }

    public function test_store_does_not_affect_other_users_blocks(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $otherTask = Task::factory()->for($other)->create();
        $userTask = Task::factory()->for($user)->create();
        $otherBlock = TimeBlock::factory()->for($other)->for($otherTask)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks', [
            'task_id' => $userTask->id,
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_blocks', [
            'id' => $otherBlock->id,
            'start_time' => 0,
            'end_time' => 120,
        ]);
    }

    // -------------------------------------------------------------------------
    // Erase
    // -------------------------------------------------------------------------

    public function test_erase_requires_authentication(): void
    {
        $this->postJson('/api/time-blocks/erase', [])->assertUnauthorized();
    }

    public function test_erase_validates_required_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/time-blocks/erase', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date', 'start_time', 'end_time']);
    }

    public function test_erase_deletes_fully_encompassed_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 30, 'end_time' => 60,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ])->assertNoContent();

        $this->assertDatabaseMissing('time_blocks', ['id' => $block->id]);
    }

    public function test_erase_trims_block_overlapping_on_left(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 90,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ])->assertNoContent();

        $this->assertDatabaseHas('time_blocks', [
            'id' => $block->id, 'start_time' => 0, 'end_time' => 60,
        ]);
    }

    public function test_erase_trims_block_overlapping_on_right(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 60, 'end_time' => 180,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 30,
            'end_time' => 90,
        ])->assertNoContent();

        $this->assertDatabaseHas('time_blocks', [
            'id' => $block->id, 'start_time' => 90, 'end_time' => 180,
        ]);
    }

    public function test_erase_splits_block_that_contains_the_erase_range(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 30,
            'end_time' => 60,
        ])->assertNoContent();

        $this->assertDatabaseHas('time_blocks', [
            'id' => $block->id, 'start_time' => 0, 'end_time' => 30,
        ]);
        $this->assertDatabaseHas('time_blocks', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'start_time' => 60,
            'end_time' => 120,
        ]);
        $this->assertDatabaseCount('time_blocks', 2);
    }

    public function test_erase_does_not_affect_other_users_blocks(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $otherTask = Task::factory()->for($other)->create();
        $otherBlock = TimeBlock::factory()->for($other)->for($otherTask)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 120,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 0,
            'end_time' => 120,
        ])->assertNoContent();

        $this->assertDatabaseHas('time_blocks', ['id' => $otherBlock->id]);
    }

    public function test_erase_returns_no_content_when_nothing_overlaps(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        TimeBlock::factory()->for($user)->for($task)->create([
            'date' => '2024-08-01', 'start_time' => 0, 'end_time' => 30,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/time-blocks/erase', [
            'date' => '2024-08-01',
            'start_time' => 60,
            'end_time' => 120,
        ])->assertNoContent();
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function test_user_can_update_their_time_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create(['start_time' => 0, 'end_time' => 60]);
        Sanctum::actingAs($user);

        $this->putJson("/api/time-blocks/{$block->id}", ['start_time' => 30, 'end_time' => 90])
            ->assertOk()
            ->assertJsonPath('startTime', 30)
            ->assertJsonPath('endTime', 90);
    }

    public function test_user_cannot_update_another_users_time_block(): void
    {
        $block = TimeBlock::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/time-blocks/{$block->id}", ['start_time' => 0, 'end_time' => 60])
            ->assertForbidden();
    }

    public function test_update_requires_authentication(): void
    {
        $block = TimeBlock::factory()->create();

        $this->putJson("/api/time-blocks/{$block->id}", ['start_time' => 0])->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------

    public function test_user_can_delete_their_time_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = TimeBlock::factory()->for($user)->for($task)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/time-blocks/{$block->id}")->assertNoContent();

        $this->assertDatabaseMissing('time_blocks', ['id' => $block->id]);
    }

    public function test_user_cannot_delete_another_users_time_block(): void
    {
        $block = TimeBlock::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/time-blocks/{$block->id}")->assertForbidden();
    }

    public function test_destroy_requires_authentication(): void
    {
        $block = TimeBlock::factory()->create();

        $this->deleteJson("/api/time-blocks/{$block->id}")->assertUnauthorized();
    }
}
