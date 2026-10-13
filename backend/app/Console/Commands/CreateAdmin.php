<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateAdmin extends Command
{
    protected $signature   = 'admin:create {--email= : Admin email} {--name= : Admin name} {--super : Create as super_admin}';
    protected $description = 'Create or promote a user to admin';

    public function handle(): int
    {
        $email = $this->option('email') ?? $this->ask('Email');
        $role  = $this->option('super') ? 'super_admin' : 'admin';

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->update(['admin_role' => $role]);
            $this->info("User {$user->email} promoted to {$role}.");
            return 0;
        }

        $name     = $this->option('name') ?? $this->ask('Name');
        $password = $this->secret('Password (leave blank to auto-generate)') ?: Str::random(16);

        $user = User::create([
            'name'          => $name,
            'email'         => $email,
            'password'      => Hash::make($password),
            'admin_role'    => $role,
            'referral_code' => strtoupper(Str::random(8)),
            'wallet_balance'=> 0,
        ]);

        $this->info("Admin created: {$user->email} ({$role})");
        if (!$this->option('email')) {
            $this->line("Password: {$password}");
        }

        return 0;
    }
}
