<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'discount_type')) {
                $table->enum('discount_type', ['nominal', 'percent'])
                    ->default('nominal')
                    ->after('grand_total');
            }

            if (!Schema::hasColumn('transactions', 'discount_value')) {
                $table->integer('discount_value')
                    ->default(0)
                    ->after('discount_type');
            }

            if (!Schema::hasColumn('transactions', 'tax_type')) {
                $table->enum('tax_type', ['nominal', 'percent'])
                    ->default('percent')
                    ->after('discount');
            }

            if (!Schema::hasColumn('transactions', 'tax_value')) {
                $table->integer('tax_value')
                    ->default(0)
                    ->after('tax_type');
            }

            if (!Schema::hasColumn('transactions', 'tax')) {
                $table->integer('tax')
                    ->default(0)
                    ->after('tax_value');
            }
        });
    }


    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'discount',
                'tax_type',
                'tax_value',
                'tax',
            ]);
        });
    }
};
