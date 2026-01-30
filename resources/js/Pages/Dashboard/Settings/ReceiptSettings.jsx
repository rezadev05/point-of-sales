import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
    IconReceipt,
    IconDeviceFloppy,
    IconPhoto,
    IconSettings,
    IconFileText,
    IconTrash,
} from "@tabler/icons-react";

export default function ReceiptSettings({ settings, can }) {
    const { errors } = usePage().props;
    const canUpdate = can?.update ?? true;

    const { data, setData, post, processing } = useForm({
        store_name: settings?.store_name || "",
        logo: "",
        header_text: settings?.header_text || "",
        footer_text: settings?.footer_text || "",
    });

    const [logoPreview, setLogoPreview] = useState(
        settings?.logo ? `/storage/${settings.logo}` : null,
    );

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi ukuran
            if (file.size > 2048 * 1024) {
                toast.error("Ukuran file maksimal 2MB");
                return;
            }
            setData("logo", file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const deleteLogo = () => {
        Swal.fire({
            title: "Hapus Logo?",
            text: "Logo yang dihapus tidak dapat dikembalikan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#6366f1",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("settings.receipt.deleteLogo"), {
                    onSuccess: () => {
                        setLogoPreview(null);
                        setData("logo", "");

                        Swal.fire({
                            title: "Berhasil!",
                            text: "Logo berhasil dihapus!",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: "Gagal!",
                            text: "Gagal menghapus logo!",
                            icon: "error",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                    },
                });
            }
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("settings.receipt.update"), {
            onSuccess: () =>
                toast.success("Pengaturan struk berhasil disimpan"),
            onError: () => toast.error("Gagal menyimpan pengaturan"),
        });
    };

    return (
        <>
            <Head title="Pengaturan Struk" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconReceipt size={28} className="text-primary-500" />
                    Pengaturan Struk Pembayaran
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Atur tampilan struk pembayaran toko Anda
                </p>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Logo Preview */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sticky top-6">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconPhoto size={18} />
                                Logo Toko
                            </h3>

                            {/* Preview Logo dengan Button Hapus */}
                            <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-4 relative">
                                {logoPreview ? (
                                    <>
                                        <img
                                            src={logoPreview}
                                            alt="Logo Preview"
                                            className="w-full h-full object-contain p-4"
                                        />
                                        {/* Button Hapus - Pojok kanan atas */}
                                        {canUpdate && (
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    type="button"
                                                    onClick={deleteLogo}
                                                    className="p-2.5 rounded-xl bg-white text-danger-600 hover:bg-danger-50 shadow-lg inline-flex items-center justify-center transition-colors"
                                                >
                                                    <IconTrash size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-6">
                                        <IconPhoto
                                            size={48}
                                            className="mx-auto text-slate-400 mb-2"
                                        />
                                        <p className="text-sm text-slate-500">
                                            Belum ada logo
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Input
                                type="file"
                                label="Upload Logo"
                                onChange={handleLogoChange}
                                errors={errors.logo}
                                accept="image/*"
                                disabled={!canUpdate}
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Format: JPG, PNG. Maks: 2MB
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Store Info */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconSettings size={18} />
                                Informasi Toko
                            </h3>
                            <Input
                                type="text"
                                label="Nama Toko"
                                value={data.store_name}
                                onChange={(e) =>
                                    setData("store_name", e.target.value)
                                }
                                errors={errors.store_name}
                                placeholder=""
                                disabled={!canUpdate}
                            />
                        </div>

                        {/* Header & Footer */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconFileText size={18} />
                                Header & Footer Struk
                            </h3>
                            <div className="space-y-4">
                                <Textarea
                                    label="Header (Bagian Atas)"
                                    placeholder=""
                                    errors={errors.header_text}
                                    onChange={(e) =>
                                        setData("header_text", e.target.value)
                                    }
                                    value={data.header_text}
                                    rows={4}
                                    disabled={!canUpdate}
                                />
                                <p className="text-xs text-slate-500 -mt-2">
                                    Teks yang ditampilkan di bagian atas struk
                                    (alamat, telepon, dll)
                                </p>

                                <Textarea
                                    label="Footer (Bagian Bawah)"
                                    placeholder=""
                                    errors={errors.footer_text}
                                    onChange={(e) =>
                                        setData("footer_text", e.target.value)
                                    }
                                    value={data.footer_text}
                                    rows={4}
                                    disabled={!canUpdate}
                                />
                                <p className="text-xs text-slate-500 -mt-2">
                                    Teks yang ditampilkan di bagian bawah struk
                                    (ucapan, syarat & ketentuan)
                                </p>
                            </div>
                        </div>

                        {/* Preview Struk */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                                Preview Struk
                            </h3>

                            <div className="max-w-sm mx-auto bg-white rounded-lg p-6 shadow-lg">
                                <div className="font-mono text-xs text-black">
                                    {/* Logo */}
                                    {logoPreview && (
                                        <div className="text-center mb-3">
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                className="h-16 mx-auto object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* Store Name */}
                                    <div className="text-center font-bold text-sm mb-2 uppercase">
                                        {data.store_name}
                                    </div>

                                    {/* Header Text */}
                                    <div className="text-center text-[10px] leading-tight mb-3 whitespace-pre-line">
                                        {data.header_text}
                                    </div>

                                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                                    {/* Transaction Info */}
                                    <div className="space-y-0.5 text-[10px] mb-2">
                                        <div className="flex justify-between">
                                            <span>No:</span>
                                            <span>TRX-064Z42BG6M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tgl:</span>
                                            <span>27/01/2026, 13.30</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Kasir:</span>
                                            <span>John Doe</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pelanggan:</span>
                                            <span>Jane Doe</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                                    {/* Items */}
                                    <div className="mb-2">
                                        <div className="text-[10px] mb-1">
                                            <div className="font-medium">
                                                Produk Sample
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1x @ Rp12.000</span>
                                                <span>Rp12.000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                                    {/* Totals */}
                                    <div className="space-y-0.5 text-[10px] mb-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>Rp12.000</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-xs">
                                            <span>TOTAL</span>
                                            <span>Rp12.000</span>
                                        </div>
                                    </div>

                                    {/* Payment */}
                                    <div className="space-y-0.5 text-[10px] mb-2">
                                        <div className="flex justify-between">
                                            <span>Bayar (TUNAI)</span>
                                            <span>Rp12.000</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                                    {/* Footer Text */}
                                    <div className="text-center text-[10px] leading-tight whitespace-pre-line">
                                        {data.footer_text}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        {canUpdate && (
                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    <IconDeviceFloppy size={18} />
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan Pengaturan"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </>
    );
}

ReceiptSettings.layout = (page) => <DashboardLayout children={page} />;
