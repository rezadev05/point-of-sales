import React from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * ThermalReceipt - Receipt template optimized for thermal printers (58mm/80mm)
 */
export default function ThermalReceipt({
    transaction,
    receiptSettings = null,
}) {
    const isQrisPayment = transaction?.payment_method?.toLowerCase() === "qris";

    const qrisValue =
        transaction?.payment_url ||
        transaction?.payment_reference ||
        transaction?.invoice;

    const formatPrice = (price = 0) => {
        return "Rp " + Number(price || 0).toLocaleString("id-ID");
    };

    const formatDate = (value) => {
        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const items = transaction?.details ?? [];

    // Calculate totals
    const cash = transaction?.cash || 0;
    const change = transaction?.change || 0;

    const paymentLabels = {
        qris: "QRIS",
        cash: "TUNAI",
        midtrans: "MIDTRANS",
        xendit: "XENDIT",
    };

    const paymentMethod =
        paymentLabels[transaction?.payment_method?.toLowerCase()] || "TUNAI";

    // Line separator
    const line = "=".repeat(32);
    const dashLine = "-".repeat(32);

    const discount = transaction?.discount || 0;
    const tax = transaction?.tax || 0;

    const subtotal = transaction?.grand_total + discount - tax;

    const discountLabel =
        transaction?.discount_type === "percent"
            ? `(${transaction?.discount_value}%)`
            : "";

    const taxLabel =
        transaction?.tax_type === "percent"
            ? `(${transaction?.tax_value}%)`
            : "";

    return (
        <div
            className="thermal-receipt font-mono text-xs leading-tight text-black bg-white"
            style={{ width: "80mm", padding: "4mm" }}
        >
            {/* Logo dari Settings */}
            {receiptSettings?.logo && (
                <div className="text-center mb-2">
                    <img
                        src={`/storage/${receiptSettings.logo}`}
                        alt="Logo"
                        className="mx-auto"
                        style={{
                            maxHeight: "40mm",
                            maxWidth: "60mm",
                            objectFit: "contain",
                        }}
                    />
                </div>
            )}

            {/* Nama Toko dari Settings */}
            {receiptSettings?.store_name && (
                <div className="text-center mb-2">
                    <p className="text-sm font-bold">
                        {receiptSettings.store_name}
                    </p>
                </div>
            )}

            {/* Header dari Settings */}
            {receiptSettings?.header_text && (
                <div className="text-center mb-2">
                    <div className="text-xs whitespace-pre-line">
                        {receiptSettings.header_text}
                    </div>
                </div>
            )}

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Invoice Info */}
            <div className="my-1">
                <div className="flex justify-between">
                    <span>No:</span>
                    <span>{transaction?.invoice}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tgl:</span>
                    <span>{formatDate(transaction?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{transaction?.cashier?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{transaction?.customer?.name || "Umum"}</span>
                </div>
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Items */}
            <div className="my-1">
                {items.map((item, index) => {
                    const qty = Number(item.qty) || 1;
                    const itemTotal = Number(item.price) || 0;
                    const unitPrice = itemTotal / qty;

                    return (
                        <div key={item.id || index} className="mb-1">
                            <p className="font-medium truncate">
                                {item.product?.title}
                            </p>
                            <div className="flex justify-between">
                                <span>
                                    {qty}x @ {formatPrice(unitPrice)}
                                </span>
                                <span>{formatPrice(itemTotal)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">
                    {dashLine}
                </pre>
            </div>

            {/* Totals */}
            <div className="my-1">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon {discountLabel}</span>
                        <span>-{formatPrice(discount)}</span>
                    </div>
                )}

                {tax > 0 && (
                    <div className="flex justify-between">
                        <span>Pajak {taxLabel}</span>
                        <span>+{formatPrice(tax)}</span>
                    </div>
                )}

                <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL</span>
                    <span>{formatPrice(transaction?.grand_total)}</span>
                </div>
            </div>

            {/* Payment Info */}
            <div className="my-1">
                <div className="flex justify-between">
                    <span>Bayar ({paymentMethod})</span>
                    <span>
                        {paymentMethod === "QRIS"
                            ? formatPrice(transaction?.grand_total)
                            : formatPrice(cash)}
                    </span>
                </div>

                {change > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Kembali</span>
                        <span>{formatPrice(change)}</span>
                    </div>
                )}
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Footer dari Settings */}
            {receiptSettings?.footer_text && (
                <div className="text-center mt-2">
                    <div className="text-xs whitespace-pre-line">
                        {receiptSettings.footer_text}
                    </div>
                </div>
            )}

            {/* QRIS - Bottom */}
            {isQrisPayment && qrisValue && (
                <div className="text-center mt-3">
                    <p className="text-xs font-bold mb-1">Scan QRIS !</p>

                    <div className="flex justify-center">
                        <QRCodeCanvas
                            value={qrisValue}
                            size={140}
                            level="M"
                            includeMargin={false}
                        />
                    </div>

                    <p className="text-[10px] mt-1">Pembayaran Non Tunai</p>
                </div>
            )}

            {/* Print-specific styles */}
            <style>{`
                @media print {
                    .thermal-receipt {
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 2mm !important;
                        font-size: 10pt !important;
                    }
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
}

/**
 * Compact Receipt for 58mm printers
 */
export function ThermalReceipt58mm({ transaction, receiptSettings = null }) {
    const isQrisPayment = transaction?.payment_method?.toLowerCase() === "qris";

    const qrisValue =
        transaction?.payment_url ||
        transaction?.payment_reference ||
        transaction?.invoice;

    const formatPrice = (price = 0) => {
        return "Rp" + Number(price || 0).toLocaleString("id-ID");
    };

    const formatDate = (value) => {
        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const items = transaction?.details ?? [];
    const line = "-".repeat(24);

    const discount = transaction?.discount || 0;
    const tax = transaction?.tax || 0;

    const subtotal = transaction?.grand_total + discount - tax;

    const discountLabel =
        transaction?.discount_type === "percent"
            ? `(${transaction?.discount_value}%)`
            : "";

    const taxLabel =
        transaction?.tax_type === "percent"
            ? `(${transaction?.tax_value}%)`
            : "";

    const cash = transaction?.cash || 0;
    const change = transaction?.change || 0;

    const paymentLabels = {
        qris: "QRIS",
        cash: "TUNAI",
        midtrans: "MIDTRANS",
        xendit: "XENDIT",
    };

    const paymentMethod =
        paymentLabels[transaction?.payment_method?.toLowerCase()] || "TUNAI";

    return (
        <div
            className="thermal-receipt-58 font-mono text-xs text-black bg-white"
            style={{ width: "58mm", padding: "2mm" }}
        >
            {/* Logo dari Settings */}
            {receiptSettings?.logo && (
                <div className="text-center mb-2">
                    <img
                        src={`/storage/${receiptSettings.logo}`}
                        alt="Logo"
                        className="mx-auto"
                        style={{
                            maxHeight: "30mm",
                            maxWidth: "50mm",
                            objectFit: "contain",
                        }}
                    />
                </div>
            )}

            {/* Nama Toko dari Settings */}
            {receiptSettings?.store_name && (
                <div className="text-center mb-2">
                    <p className="text-sm font-bold">
                        {receiptSettings.store_name}
                    </p>
                </div>
            )}

            {/* Header dari Settings */}
            {receiptSettings?.header_text && (
                <div className="text-center mb-2">
                    <div className="text-xs whitespace-pre-line">
                        {receiptSettings.header_text}
                    </div>
                </div>
            )}

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            <div className="my-1">
                <div className="flex justify-between">
                    <span>No:</span>
                    <span>{transaction?.invoice}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tgl:</span>
                    <span>{formatDate(transaction?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{transaction?.cashier?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{transaction?.customer?.name || "Umum"}</span>
                </div>
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Items */}
            <div className="my-1">
                {items.map((item, index) => {
                    const qty = Number(item.qty) || 1;
                    const itemTotal = Number(item.price) || 0;
                    const unitPrice = itemTotal / qty;

                    return (
                        <div key={item.id || index} className="mb-1">
                            <p className="font-medium truncate">
                                {item.product?.title}
                            </p>
                            <div className="flex justify-between">
                                <span>
                                    {qty}x @ {formatPrice(unitPrice)}
                                </span>
                                <span>{formatPrice(itemTotal)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Totals */}
            <div className="my-1">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon {discountLabel}</span>
                        <span>-{formatPrice(discount)}</span>
                    </div>
                )}

                {tax > 0 && (
                    <div className="flex justify-between">
                        <span>Pajak {taxLabel}</span>
                        <span>+{formatPrice(tax)}</span>
                    </div>
                )}

                <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL</span>
                    <span>{formatPrice(transaction?.grand_total)}</span>
                </div>
            </div>

            {/* Payment Info */}
            <div className="my-1">
                <div className="flex justify-between">
                    <span>Bayar ({paymentMethod})</span>
                    <span>
                        {paymentMethod === "QRIS"
                            ? formatPrice(transaction?.grand_total)
                            : formatPrice(cash)}
                    </span>
                </div>

                {change > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Kembali</span>
                        <span>{formatPrice(change)}</span>
                    </div>
                )}
            </div>

            <div className="text-center">
                <pre className="whitespace-pre-wrap inline-block">{line}</pre>
            </div>

            {/* Footer dari Settings */}
            {receiptSettings?.footer_text && (
                <div className="text-center mt-2">
                    <div className="text-xs whitespace-pre-line">
                        {receiptSettings.footer_text}
                    </div>
                </div>
            )}

            {/* QRIS - Bottom */}
            {isQrisPayment && qrisValue && (
                <div className="text-center mt-3">
                    <p className="text-xs font-bold mb-1">Scan QRIS !</p>

                    <div className="flex justify-center">
                        <QRCodeCanvas
                            value={qrisValue}
                            size={140}
                            level="M"
                            includeMargin={false}
                        />
                    </div>

                    <p className="text-[10px] mt-1">Pembayaran Non Tunai</p>
                </div>
            )}

            <style>{`
                @media print {
                    .thermal-receipt-58 {
                        width: 58mm !important;
                        font-size: 9pt !important;
                    }
                    @page { size: 58mm auto; margin: 0; }
                }
            `}</style>
        </div>
    );
}
