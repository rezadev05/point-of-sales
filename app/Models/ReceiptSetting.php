<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiptSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_name',
        'logo',
        'header_text',
        'footer_text',
    ];

    // Helper method untuk get setting
    public static function getSettings()
    {
        return self::first() ?? new self();
    }
}
