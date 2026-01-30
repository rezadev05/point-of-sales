import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { QRCodeCanvas } from "qrcode.react";

import {
    IconArrowLeft,
    IconPrinter,
    IconExternalLink,
    IconReceipt,
    IconFileInvoice,
} from "@tabler/icons-react";
import ThermalReceipt, {
    ThermalReceipt58mm,
} from "@/Components/Receipt/ThermalReceipt";

export default function Print({ transaction, receiptSettings }) {
    const [printMode, setPrintMode] = useState("invoice"); // 'invoice' | 'thermal80' | 'thermal58'

    const [showQrisModal, setShowQrisModal] = useState(false);

    const formatPrice = (price = 0) =>
        Number(price || 0).toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

    const formatDateTime = (value) =>
        new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const formatDiscountLabel = () => {
        if (!transaction.discount || transaction.discount <= 0) return null;

        if (transaction.discount_type === "percent") {
            return `${transaction.discount_value}%`;
        }

        return `- ${formatPrice(transaction.discount)}`;
    };

    const formatTaxLabel = () => {
        if (!transaction.tax || transaction.tax <= 0) return null;

        if (transaction.tax_type === "percent") {
            return `${transaction.tax_value}%`;
        }

        return `+ ${formatPrice(transaction.tax)}`;
    };

    const items = transaction?.details ?? [];

    const paymentLabels = {
        cash: "Tunai",
        qris: "QRIS",
        midtrans: "Midtrans",
        xendit: "Xendit",
    };
    const paymentMethodKey = (
        transaction?.payment_method || "cash"
    ).toLowerCase();
    const paymentMethodLabel = paymentLabels[paymentMethodKey] ?? "Tunai";

    const paymentStatuses = {
        paid: "Lunas",
        pending: "Menunggu",
        failed: "Gagal",
        expired: "Kedaluwarsa",
    };
    const paymentStatusKey = (transaction?.payment_status || "").toLowerCase();
    const paymentStatusLabel =
        paymentStatuses[paymentStatusKey] ??
        (paymentMethodKey === "cash" ? "Lunas" : "Menunggu");

    const statusColors = {
        paid: "bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400",
        pending:
            "bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400",
        failed: "bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-400",
        expired:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    };
    const paymentStatusColor =
        statusColors[paymentStatusKey] ?? statusColors.paid;

    const isNonCash = paymentMethodKey !== "cash";
    const showPaymentLink = isNonCash && transaction.payment_url;

    const handlePrint = () => {
        window.print();
    };

    const isQrisPayment = paymentMethodKey === "qris";

    const subtotal =
        transaction.grand_total +
        (transaction.discount || 0) -
        (transaction.tax || 0);

    return (
        <>
            <Head title="Invoice Penjualan" />

            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:bg-white print:p-0">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                        <Link
                            href={route("transactions.index")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <IconArrowLeft size={18} />
                            Kembali ke kasir
                        </Link>

                        <div className="flex items-center gap-2">
                            {/* Print Mode Selector */}
                            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
                                <button
                                    onClick={() => setPrintMode("invoice")}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                        printMode === "invoice"
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                    }`}
                                >
                                    <IconFileInvoice
                                        size={16}
                                        className="inline mr-1"
                                    />
                                    Invoice
                                </button>
                                <button
                                    onClick={() => setPrintMode("thermal80")}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                        printMode === "thermal80"
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                    }`}
                                >
                                    <IconReceipt
                                        size={16}
                                        className="inline mr-1"
                                    />
                                    Struk 80mm
                                </button>
                                <button
                                    onClick={() => setPrintMode("thermal58")}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                        printMode === "thermal58"
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                    }`}
                                >
                                    <IconReceipt
                                        size={16}
                                        className="inline mr-1"
                                    />
                                    Struk 58mm
                                </button>
                            </div>

                            {showPaymentLink && !isQrisPayment && (
                                <a
                                    href={transaction.payment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800 text-sm font-semibold text-primary-600 dark:text-primary-400"
                                >
                                    <IconExternalLink size={18} />
                                    Pembayaran
                                </a>
                            )}

                            {isQrisPayment && (
                                <button
                                    onClick={() => setShowQrisModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800
                   text-sm font-semibold text-emerald-600 dark:text-emerald-400
                   hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                                >
                                    <IconExternalLink size={18} />
                                    Tampilkan QRIS
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-colors"
                            >
                                <IconPrinter size={18} />
                                Cetak
                            </button>
                        </div>
                        {showQrisModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
                                    <button
                                        onClick={() => setShowQrisModal(false)}
                                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>

                                    <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                                        Scan QRIS
                                    </h3>

                                    <p className="text-sm text-center text-slate-500 mb-4">
                                        Total Pembayaran
                                    </p>

                                    <p className="text-xl font-bold text-center text-emerald-600 mb-4">
                                        {formatPrice(transaction.grand_total)}
                                    </p>

                                    <div className="flex justify-center mb-4">
                                        <QRCodeCanvas
                                            value={transaction.payment_url}
                                            size={220}
                                            level="H"
                                            includeMargin
                                        />
                                    </div>

                                    <p className="text-xs text-center text-slate-500">
                                        Scan QRIS menggunakan aplikasi pembayan.
                                    </p>

                                    <div className="mt-4 text-center">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                                 bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400"
                                        >
                                            {paymentStatusLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thermal Receipt Preview */}
                    {(printMode === "thermal80" ||
                        printMode === "thermal58") && (
                        <div className="flex justify-center print:block">
                            <div className="bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 print:shadow-none print:border-0 print:p-0 print:rounded-none">
                                {printMode === "thermal80" ? (
                                    <ThermalReceipt
                                        transaction={transaction}
                                        receiptSettings={receiptSettings}
                                    />
                                ) : (
                                    <ThermalReceipt58mm
                                        transaction={transaction}
                                        receiptSettings={receiptSettings}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Invoice View */}
                    {printMode === "invoice" && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl print:shadow-none print:border-slate-300">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-6 text-white print:bg-slate-100 print:text-slate-900">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconReceipt size={24} />
                                            <span className="text-sm font-medium opacity-90 print:opacity-100">
                                                INVOICE
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold">
                                            {transaction.invoice}
                                        </p>
                                        <p className="text-sm opacity-80 print:opacity-100 mt-1">
                                            {formatDateTime(
                                                transaction.created_at,
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span
                                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusColor}`}
                                        >
                                            {paymentStatusLabel}
                                        </span>
                                        <p className="text-sm opacity-80 print:opacity-100 mt-2">
                                            {paymentMethodLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid md:grid-cols-2 gap-6 px-6 py-6 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                        Pelanggan
                                    </p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        {transaction.customer?.name ?? "Umum"}
                                    </p>
                                    {transaction.customer?.address && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {transaction.customer.address}
                                        </p>
                                    )}
                                    {transaction.customer?.phone && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {transaction.customer.phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                        Kasir
                                    </p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        {transaction.cashier?.name ?? "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="px-6 py-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Produk
                                            </th>
                                            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Harga
                                            </th>
                                            <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Qty
                                            </th>
                                            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map((item, index) => {
                                            const quantity =
                                                Number(item.qty) || 1;
                                            const subtotal =
                                                Number(item.price) || 0;
                                            const unitPrice =
                                                subtotal / quantity;

                                            return (
                                                <tr key={item.id ?? index}>
                                                    <td className="py-3">
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {
                                                                item.product
                                                                    ?.title
                                                            }
                                                        </p>
                                                        {item.product
                                                            ?.barcode && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {
                                                                    item.product
                                                                        .barcode
                                                                }
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                                                        {formatPrice(unitPrice)}
                                                    </td>
                                                    <td className="py-3 text-center text-slate-600 dark:text-slate-400">
                                                        {quantity}
                                                    </td>
                                                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                                                        {formatPrice(subtotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-6">
                                <div className="max-w-xs ml-auto space-y-2 text-sm">
                                    {/* Subtotal */}
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {/* Diskon */}
                                    {transaction.discount > 0 && (
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>
                                                Diskon{" "}
                                                {transaction.discount_type ===
                                                    "percent" &&
                                                    `(${transaction.discount_value}%)`}
                                            </span>
                                            <span className="text-danger-600">
                                                -{" "}
                                                {formatPrice(
                                                    transaction.discount,
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* Pajak */}
                                    {transaction.tax > 0 && (
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>
                                                Pajak{" "}
                                                {transaction.tax_type ===
                                                    "percent" &&
                                                    `(${transaction.tax_value}%)`}
                                            </span>
                                            <span className="text-success-600">
                                                + {formatPrice(transaction.tax)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span>Total</span>
                                        <span>
                                            {formatPrice(
                                                transaction.grand_total,
                                            )}
                                        </span>
                                    </div>

                                    {/* Cash */}
                                    {paymentMethodKey === "cash" && (
                                        <>
                                            <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-2">
                                                <span>Tunai</span>
                                                <span>
                                                    {formatPrice(
                                                        transaction.cash,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-success-600 dark:text-success-400 font-medium">
                                                <span>Kembali</span>
                                                <span>
                                                    {formatPrice(
                                                        transaction.change,
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 text-center border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    “Terima kasih sudah menikmati DCC kami.
                                    Sampai jumpa lagi!”
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
