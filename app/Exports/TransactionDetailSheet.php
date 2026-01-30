<?php

namespace App\Exports;

use App\Models\Transaction;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionDetailSheet implements FromCollection, WithHeadings, WithMapping
{
    protected array $filters;
    protected float $total_buy = 0;
    protected float $total_sell = 0;
    protected float $total_profit = 0;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection(): Collection
    {
        $query = Transaction::query()
            ->with(['details.product'])
            ->orderBy('created_at');

        // 🔎 Filter invoice
        if (!empty($this->filters['invoice'])) {
            $query->where('invoice', 'like', '%' . $this->filters['invoice'] . '%');
        }

        // 📅 Filter tanggal
        if (!empty($this->filters['start_date']) || !empty($this->filters['end_date'])) {
            if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
                $query->whereBetween('created_at', [
                    $this->filters['start_date'] . ' 00:00:00',
                    $this->filters['end_date'] . ' 23:59:59',
                ]);
            } elseif (!empty($this->filters['start_date'])) {
                $query->whereDate('created_at', '>=', $this->filters['start_date']);
            } elseif (!empty($this->filters['end_date'])) {
                $query->whereDate('created_at', '<=', $this->filters['end_date']);
            }
        }

        // 🔥 Default: hari ini jika tidak ada filter
        if (
            empty($this->filters['invoice']) &&
            empty($this->filters['start_date']) &&
            empty($this->filters['end_date'])
        ) {
            $query->whereDate('created_at', now()->toDateString());
        }

        $rows = $query->get()->flatMap(function ($transaction) {
            $details = $transaction->details;

            $sub_total = $details->sum(function ($d) {
                $price = (float) $d->price;
                return $price;
            });

            $discount_total = (float) ($transaction->discount ?: 0);

            $discount_percent = ($transaction->discount_type === 'percent')
                ? (float) ($transaction->discount_value ?: 0)
                : 0;

            $tax_total = (float) ($transaction->tax ?: 0);

            $tax_percent = ($transaction->tax_type === 'percent')
                ? (float) ($transaction->tax_value ?: 0)
                : 0;


            // PROYEKSI KE MASING-MASING ITEM
            return $details->map(function ($detail) use ($transaction, $sub_total, $discount_total, $tax_total, $discount_percent, $tax_percent) {

                $qty      = max((int) $detail->qty, 1);
                $sell_unit = (float) $detail->price / $qty;
                $buy_unit  = (float) ($detail->product->buy_price ?? 0);

                $sell_gross = $sell_unit * $qty;

                $ratio = $sub_total > 0 ? ($sell_gross / $sub_total) : 0;

                // Alokasi diskon & pajak ke item ini
                $item_discount = $discount_total * $ratio;
                $item_tax      = $tax_total * $ratio;

                // Harga jual satuan SETELAH diskon
                $sell_net_total = $sell_gross - $item_discount;
                $sell_net_unit  = $sell_net_total / $qty;

                $buy_total    = $buy_unit * $qty;
                $profit_total = $sell_net_total - $buy_total;
                $profit_unit  = $profit_total / $qty;

                // Akumulasi total global
                $this->total_buy    += $buy_total;
                $this->total_sell   += $sell_net_total;
                $this->total_profit += $profit_total;

                return [
                    'invoice'       => $transaction->invoice,
                    'date'          => $transaction->created_at,
                    'product'       => $detail->product->title ?? '-',
                    'qty'           => $qty,

                    'buy_unit'      => $buy_unit,
                    'sell_unit'     => $sell_net_unit,
                    'profit_unit'   => $profit_unit,

                    'buy_total'     => $buy_total,
                    'sell_total'    => $sell_net_total,
                    'profit_total'  => $profit_total,

                    'discount_percent' => $discount_percent,
                    'discount'         => $item_discount,

                    'tax_percent'   => $tax_percent,
                    'tax'           => $item_tax,
                ];
            });
        });


        $rows->push([
            'invoice'       => 'TOTAL',
            'date'          => null,
            'product'       => '',
            'qty'           => '',
            'buy_unit'      => '',
            'sell_unit'     => '',
            'profit_unit'   => '',
            'buy_total'     => $this->total_buy,
            'sell_total'    => $this->total_sell,
            'profit_total'  => $this->total_profit,
            'discount_percent' => '',
            'discount'      => '',
            'tax_percent'   => '',
            'tax'           => '',
        ]);

        return $rows;
    }

    public function headings(): array
    {
        return [
            'No Invoice',
            'Tanggal',
            'Nama Produk',
            'Qty',
            'Harga Beli Satuan',
            'Harga Jual Satuan',
            'Profit Satuan',
            'Harga Beli',
            'Harga Jual',
            'Profit',
            'Diskon (%)',
            'Diskon (Rp)',
            'Pajak (%)',
            'Pajak (Rp)',
        ];
    }

    public function map($row): array
    {
        return [
            $row['invoice'],
            $row['date'] ? $row['date']->format('d-m-Y H:i:s') : '',
            $row['product'],
            $row['qty'],
            $row['buy_unit'],
            $row['sell_unit'],
            $row['profit_unit'],
            $row['buy_total'],
            $row['sell_total'],
            $row['profit_total'],
            $row['discount_percent'] ?? 0,
            $row['discount'] ?? 0,
            $row['tax_percent'] ?? 0,
            $row['tax'] ?? 0,
        ];
    }
}
