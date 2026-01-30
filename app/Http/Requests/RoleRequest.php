<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // authorization sudah di-handle middleware permission
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('roles', 'name')->ignore($this->route('role')),
            ],

            'selectedPermission' => [
                'required',
                'array',
                'min:1',
            ],

            'selectedPermission.*' => [
                'integer',
                'exists:permissions,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama group wajib diisi',
            'name.unique' => 'Nama group sudah digunakan',
            'selectedPermission.required' => 'Minimal pilih 1 hak akses',
            'selectedPermission.array' => 'Format hak akses tidak valid',
            'selectedPermission.*.exists' => 'Hak akses tidak ditemukan',
        ];
    }
}
