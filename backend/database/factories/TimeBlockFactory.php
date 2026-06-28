<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeBlockFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->numberBetween(0, 1380);
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory(),
            'date' => fake()->date(),
            'start_time' => $start,
            'end_time' => $start + fake()->numberBetween(15, 60),
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn () => [
            'user_id' => $user->id,
            'task_id' => Task::factory()->for($user),
        ]);
    }
}
