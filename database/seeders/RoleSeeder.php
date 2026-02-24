<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    // Refactor the RoleSeeder to improve readability and avoid repetitive code
    public function run(): void
    {
        $this->createRoleWithPermissions('users-access', '%users%');
        $this->createRoleWithPermissions('roles-access', '%roles%');
        $this->createRoleWithPermissions('permission-access', '%permissions%');
        $this->createRoleWithPermissions('categories-access', '%categories%');
        $this->createRoleWithPermissions('products-access', '%products%');
        $this->createRoleWithPermissions('customers-access', '%customers%');
        $this->createRoleWithPermissions('transactions-access', '%transactions%');
        $this->createRoleWithPermissions('reports-access', '%reports%');
        $this->createRoleWithPermissions('profits-access', '%profits%');
        $this->createRoleWithPermissions('payment-settings-access', '%payment%');
        $this->createRoleWithPermissions('receipt-access', '%receipt%');

        Role::firstOrCreate(['name' => 'super-admin']);

        $cashierRole        = Role::firstOrCreate(['name' => 'cashier']);

        $cashierPermissions = Permission::whereIn('name', [
            'dashboard-access',
            'transactions-access',
            'customers-access',
            'customers-create',
        ])->get();

        $cashierRole->givePermissionTo($cashierPermissions);
    }

    private function createRoleWithPermissions($roleName, $permissionNamePattern)
    {
        $permissions = Permission::where('name', 'like', $permissionNamePattern)->get();
        $role        = Role::firstOrCreate(['name' => $roleName]);
        $role->givePermissionTo($permissions);
    }
}
