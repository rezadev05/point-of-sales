<?php

namespace App\Exports;

use App\Models\Transaction;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TransactionSummarySheet implements FromCollection, WithHeadings
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection(): Collection
    {
        $query = Transaction::query()->with(['details.product']);

        // 🔎 Filter invoice
        if (!empty($this->filters['invoice'])) {
            $query->where('invoice', 'like', '%' . $this->filters['invoice'] . '%');
        }

        // 📅 Filter tanggal (range)
        if (!empty($this->filters['start_date']) || !empty($this->filters['end_date'])) {
            $query->whereBetween('created_at', [
                ($this->filters['start_date'] ?? now()->toDateString()) . ' 00:00:00',
                ($this->filters['end_date'] ?? now()->toDateString()) . ' 23:59:59',
            ]);
        }

        // 🔥 Default: hari ini jika tidak ada filter
        if (
            empty($this->filters['invoice']) &&
            empty($this->filters['start_date']) &&
            empty($this->filters['end_date'])
        ) {
            $query->whereDate('created_at', now());
        }

        $summary = [];

        $query->get()->each(function ($transaction) use (&$summary) {

            $details = $transaction->details;

            $sub_total = $details->sum(function ($d) {
                $price = (float) $d->price;
                return $price;
            });

            // ✅ FIX: AMBIL NOMINAL DARI FIELD 'discount' (selalu ada)
            $discount_total = (float) ($transaction->discount ?: 0);

            $discount_percent = ($transaction->discount_type === 'percent')
                ? (float) ($transaction->discount_value ?: 0)
                : 0;


            $tax_total = (float) ($transaction->tax ?: 0);

            $tax_percent = ($transaction->tax_type === 'percent')
                ? (float) ($transaction->tax_value ?: 0)
                : 0; // ✅ Kosongkan jika tipe nominal

            foreach ($details as $detail) {

                $product = $detail->product;

                if (!$product) {
                    continue;
                }

                $barcode = $product->barcode ?? $product->id;

                if (!isset($summary[$barcode])) {
                    $summary[$barcode] = [
                        'product'          => $product->title,
                        'qty'              => 0,
                        'buy'              => 0,
                        'sell_net'         => 0,
                        'profit'           => 0,
                        'discount_amount'  => 0,
                        'tax_amount'       => 0,
                        'discount_percent_sum' => 0,
                        'tax_percent_sum'      => 0,
                        'discount_count'   => 0,
                        'tax_count'        => 0,
                    ];
                }

                $qty      = max((int) $detail->qty, 1);
                $buy_unit  = (float) ($product->buy_price ?? 0);
                $sell_unit = (float) $detail->price / $qty;

                $sell_gross = $sell_unit * $qty;

                // Proporsi item terhadap transaksi
                $ratio = $sub_total > 0 ? ($sell_gross / $sub_total) : 0;

                // Alokasi diskon & pajak nominal ke item
                $item_discount = $discount_total * $ratio;
                $item_tax      = $tax_total * $ratio;

                // Hitung nilai setelah diskon
                $sell_net_total = $sell_gross - $item_discount;
                $buy_total     = $buy_unit * $qty;
                $profit_total  = $sell_net_total - $buy_total;

                // Akumulasi per produk
                $summary[$barcode]['qty']              += $qty;
                $summary[$barcode]['buy']              += $buy_total;
                $summary[$barcode]['sell_net']         += $sell_net_total;
                $summary[$barcode]['profit']           += $profit_total;
                $summary[$barcode]['discount_amount']  += $item_discount;
                $summary[$barcode]['tax_amount']       += $item_tax;

                // Akumulasi persentase untuk weighted average
                if ($item_discount > 0) {
                    $summary[$barcode]['discount_percent_sum'] += $discount_percent;
                    $summary[$barcode]['discount_count']++;
                }

                if ($item_tax > 0) {
                    $summary[$barcode]['tax_percent_sum'] += $tax_percent;
                    $summary[$barcode]['tax_count']++;
                }
            }
        });

        return collect(array_values($summary))->map(function ($row) {

            // Rata-rata Diskon %
            $discount_percent = 0;
            if ($row['discount_count'] > 0) {
                $discount_percent = $row['discount_percent_sum'] / $row['discount_count'];
            }

            // Rata-rata Pajak %
            $tax_percent = 0;
            if ($row['tax_count'] > 0) {
                $tax_percent = $row['tax_percent_sum'] / $row['tax_count'];
            }

            return [
                'product'          => $row['product'],
                'qty'              => $row['qty'],
                'buy'              => $row['buy'],
                'sell'             => $row['sell_net'],
                'profit'           => $row['profit'],
                'discount_percent' => $discount_percent,
                'discount_amount'  => $row['discount_amount'],
                'tax_percent'      => $tax_percent,
                'tax_amount'       => $row['tax_amount'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Nama Produk',
            'Total Qty',
            'Total Harga Beli',
            'Total Harga Jual',
            'Total Profit',
            'Diskon %',
            'Diskon Rp',
            'Pajak %',
            'Pajak Rp',
        ];
    }
}
