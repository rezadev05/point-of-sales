<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //Super Admin User
        $user = User::firstOrCreate([
            'name' => 'John Doe',
            'email' => 'johndoe@gmail.com',
            'password' => bcrypt('password'),
        ]);

        $role = Role::where('name', 'super-admin')->first();
        $permissions = Permission::all();
        $user->syncPermissions($permissions);
        $user->assignRole($role);

        // Cashier User
        $cashier = User::firstOrCreate([
            'name' => 'Cashier',
            'email' => 'cashier@gmail.com',
            'password' => bcrypt('password'),
        ]);
        $transactionsPermission = Permission::where('name', 'transactions-access')->first();
        $cashier->syncPermissions($transactionsPermission);
    }
}
