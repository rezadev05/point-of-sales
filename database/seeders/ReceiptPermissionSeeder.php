<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ReceiptPermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat permission dengan nama baru
        Permission::firstOrCreate(['name' => 'receipt-access']);
        Permission::firstOrCreate(['name' => 'receipt-update']);

        // Optional: Hapus permission lama jika ada
        Permission::where('name', 'receipt-access')->delete();
        Permission::where('name', 'receipt-update')->delete();

        // Berikan ke role admin
        $adminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $adminRole->givePermissionTo([
            'receipt-access',
            'receipt-update',
        ]);

        // Role owner juga bisa akses
        $ownerRole = Role::firstOrCreate(['name' => 'owner']);
        $ownerRole->givePermissionTo([
            'receipt-access',
            'receipt-update',
        ]);

        // Role kasir hanya bisa akses
        $cashierRole = Role::firstOrCreate(['name' => 'cashier']);
        $cashierRole->givePermissionTo('receipt-access');
    }
}
