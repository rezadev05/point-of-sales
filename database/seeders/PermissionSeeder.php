<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void

    {

        // dashboard permissions
        Permission::firstOrCreate(['name' => 'dashboard-access']);

        // users permissions
        Permission::firstOrCreate(['name' => 'users-access']);
        Permission::firstOrCreate(['name' => 'users-create']);
        Permission::firstOrCreate(['name' => 'users-update']);
        Permission::firstOrCreate(['name' => 'users-delete']);

        // roles permissions
        Permission::firstOrCreate(['name' => 'roles-access']);
        Permission::firstOrCreate(['name' => 'roles-create']);
        Permission::firstOrCreate(['name' => 'roles-update']);
        Permission::firstOrCreate(['name' => 'roles-delete']);

        // permissions permissions
        Permission::firstOrCreate(['name' => 'permissions-access']);
        Permission::firstOrCreate(['name' => 'permissions-create']);
        Permission::firstOrCreate(['name' => 'permissions-update']);
        Permission::firstOrCreate(['name' => 'permissions-delete']);

        //permission categories
        Permission::firstOrCreate(['name' => 'categories-access']);
        Permission::firstOrCreate(['name' => 'categories-create']);
        Permission::firstOrCreate(['name' => 'categories-edit']);
        Permission::firstOrCreate(['name' => 'categories-delete']);

        //permission products
        Permission::firstOrCreate(['name' => 'products-access']);
        Permission::firstOrCreate(['name' => 'products-create']);
        Permission::firstOrCreate(['name' => 'products-edit']);
        Permission::firstOrCreate(['name' => 'products-delete']);

        //permission customers
        Permission::firstOrCreate(['name' => 'customers-access']);
        Permission::firstOrCreate(['name' => 'customers-create']);
        Permission::firstOrCreate(['name' => 'customers-edit']);
        Permission::firstOrCreate(['name' => 'customers-delete']);

        //permission transactions
        Permission::firstOrCreate(['name' => 'transactions-access']);
        Permission::firstOrCreate(['name' => 'transactions-delete']);
        Permission::firstOrCreate(['name' => 'transactions-export']);

        // permission reports
        Permission::firstOrCreate(['name' => 'reports-access']);
        Permission::firstOrCreate(['name' => 'profits-access']);

        // payment settings
        Permission::firstOrCreate(['name' => 'payment-settings-access']);

        Permission::firstOrCreate(['name' => 'receipt-access']);
        Permission::firstOrCreate(['name' => 'receipt-update']);
    }
}
