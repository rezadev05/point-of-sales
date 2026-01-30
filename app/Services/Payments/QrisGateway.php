<?php

namespace App\Services\Payments;

use App\Models\PaymentSetting;
use App\Models\Transaction;
use App\Exceptions\QrisException;

class QrisGateway
{
    public function createPayment(Transaction $transaction, PaymentSetting $setting): array
    {
        if (empty($setting->qris_string)) {
            throw new QrisException('QRIS statis belum dikonfigurasi');
        }

        if ($transaction->grand_total <= 0) {
            throw new QrisException('Nominal QRIS tidak valid');
        }

        $staticQris = $setting->qris_string;
        $amount     = (string) intval($transaction->grand_total);

        $dynamicQris = $this->makeDynamicQris($staticQris, $amount);

        return [
            'reference'   => $transaction->invoice,
            'payment_url' => $dynamicQris, // STRING QRIS DINAMIS
        ];
    }

    protected function makeDynamicQris(string $qris, string $amount): string
    {
        if (strlen($qris) < 20) {
            throw new QrisException('Format QRIS statis tidak valid');
        }

        if (! str_contains($qris, '010211')) {
            throw new QrisException('QRIS bukan QRIS statis (010211 tidak ditemukan)');
        }

        if (! str_contains($qris, '5802ID')) {
            throw new QrisException('QRIS tidak mengandung country code 5802ID');
        }

        // buang CRC lama
        $qris = substr($qris, 0, -4);

        // ubah static -> dynamic
        $qris = str_replace("010211", "010212", $qris);

        // split sebelum country code
        $parts = explode("5802ID", $qris);

        $nominal = "54"
            . sprintf("%02d", strlen($amount))
            . $amount;

        $payload = trim($parts[0])
            . $nominal
            . "5802ID"
            . trim($parts[1]);

        return $payload . $this->crc16($payload);
    }

    protected function crc16(string $str): string
    {
        $crc = 0xFFFF;

        for ($c = 0; $c < strlen($str); $c++) {
            $crc ^= ord($str[$c]) << 8;
            for ($i = 0; $i < 8; $i++) {
                $crc = ($crc & 0x8000)
                    ? ($crc << 1) ^ 0x1021
                    : $crc << 1;
            }
        }

        return strtoupper(str_pad(dechex($crc & 0xFFFF), 4, '0', STR_PAD_LEFT));
    }
}
