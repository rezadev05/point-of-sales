<?php

namespace App\Http\Controllers;

use App\Models\ReceiptSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ReceiptSettingController extends Controller
{
    public function index()
    {
        // Check permission
        if (!auth()->user()->can('receipt-access')) {
            abort(403, 'Anda tidak memiliki akses untuk melihat halaman ini.');
        }

        $settings = ReceiptSetting::first();

        if (!$settings) {
            $settings = (object)[
                'id' => null,
                'store_name' => '',
                'logo' => null,
                'header_text' => '',
                'footer_text' => '',
            ];
        }

        return Inertia::render('Dashboard/Settings/ReceiptSettings', [
            'settings' => $settings,
            'can' => [
                'update' => auth()->user()->can('receipt-update'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('receipt-update')) {
            abort(403, 'Anda tidak memiliki akses untuk mengubah pengaturan ini.');
        }

        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'header_text' => 'nullable|string|max:1000',
            'footer_text' => 'nullable|string|max:1000',
        ]);

        $settings = ReceiptSetting::first();

        if (!$settings) {
            $settings = new ReceiptSetting();
        }

        // Handle logo upload - HANYA jika ada file baru
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($settings->logo && Storage::disk('public')->exists($settings->logo)) {
                Storage::disk('public')->delete($settings->logo);
            }

            // Store new logo
            $logo_path = $request->file('logo')->store('receipt-logos', 'public');
            $validated['logo'] = $logo_path;
        } else {
            // PENTING: Hapus 'logo' dari validated agar tidak mengupdate dengan null
            unset($validated['logo']);
        }

        $settings->fill($validated);
        $settings->save();

        return redirect()->back()->with('success', 'Pengaturan struk berhasil disimpan');
    }

    public function deleteLogo()
    {
        // Check permission
        if (!auth()->user()->can('receipt-update')) {
            abort(403, 'Anda tidak memiliki akses untuk mengubah pengaturan ini.');
        }

        $settings = ReceiptSetting::first();

        if ($settings && $settings->logo) {
            // Delete file from storage
            if (Storage::disk('public')->exists($settings->logo)) {
                Storage::disk('public')->delete($settings->logo);
            }

            // Update database
            $settings->logo = null;
            $settings->save();

            return redirect()->back()->with('success', 'Logo berhasil dihapus');
        }

        return redirect()->back()->with('error', 'Tidak ada logo untuk dihapus');
    }
}
