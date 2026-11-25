<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        return [
            'user_id'             => User::factory(),
            'business_name'       => $this->faker->company() . ' Digital',
            'bio'                 => $this->faker->paragraph(2),
            'status'              => 'approved',
            'commission_rate'     => 10,
            'approved_at'         => now(),
            'total_earnings_kobo' => 0,
            'total_orders'        => 0,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending', 'approved_at' => null]);
    }

    public function suspended(): static
    {
        return $this->state(['status' => 'suspended', 'approved_at' => null]);
    }
}
