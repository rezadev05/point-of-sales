<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Profit;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
        ];

        $totalCategories   = Category::count();
        $totalProducts     = Product::count();
        $totalUsers        = User::count();
        $todayTransactions = Transaction::whereDate('created_at', Carbon::today())->count();

        $transactionQuery = $this->applyFilters(Transaction::query(), $filters);
        $profitQuery = $this->applyFilters(Profit::query(), $filters);

        $totalTransactions = (clone $transactionQuery)->count();
        $totalRevenue = (clone $transactionQuery)->sum('grand_total');
        $totalProfit = (clone $profitQuery)->sum('total');
        $averageOrder = (clone $transactionQuery)->avg('grand_total') ?? 0;

        $revenueTrend = (clone $transactionQuery)
            ->selectRaw('DATE(created_at) as date, SUM(grand_total) as total')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->take(12)
            ->get()
            ->map(function ($row) {
                return [
                    'date' => $row->date,
                    'label' => Carbon::parse($row->date)->format('d M'),
                    'total' => (int) $row->total,
                ];
            })
            ->reverse()
            ->values();

        $transactionIds = (clone $transactionQuery)->pluck('id');

        $topProducts = $transactionIds->isNotEmpty()
            ? TransactionDetail::select('product_id', DB::raw('SUM(qty) as qty'), DB::raw('SUM(price) as total'))
            ->with('product:id,title')
            ->whereIn('transaction_id', $transactionIds)
            ->groupBy('product_id')
            ->orderByDesc('qty')
            ->take(5)
            ->get()
            ->map(function ($detail) {
                return [
                    'name' => $detail->product?->title ?? 'Produk terhapus',
                    'qty' => (int) $detail->qty,
                    'total' => (int) $detail->total,
                ];
            })
            : collect();

        $recentTransactions = (clone $transactionQuery)
            ->with('cashier:id,name', 'customer:id,name')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($transaction) {
                return [
                    'invoice' => $transaction->invoice,
                    'date' => Carbon::parse($transaction->created_at)->format('d M Y'),
                    'customer' => $transaction->customer?->name ?? '-',
                    'cashier' => $transaction->cashier?->name ?? '-',
                    'total' => (int) $transaction->grand_total,
                ];
            });

        $topCustomers = (clone $transactionQuery)
            ->select('customer_id', DB::raw('COUNT(*) as orders'), DB::raw('SUM(grand_total) as total'))
            ->with('customer:id,name')
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->orderByDesc('total')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'name' => $row->customer?->name ?? 'Pelanggan',
                    'orders' => (int) $row->orders,
                    'total' => (int) $row->total,
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'totalCategories' => $totalCategories,
            'totalProducts' => $totalProducts,
            'totalTransactions' => $totalTransactions,
            'totalUsers' => $totalUsers,
            'revenueTrend' => $revenueTrend,
            'totalRevenue' => (int) $totalRevenue,
            'totalProfit' => (int) $totalProfit,
            'averageOrder' => (int) round($averageOrder),
            'todayTransactions' => (int) $todayTransactions,
            'topProducts' => $topProducts,
            'recentTransactions' => $recentTransactions,
            'topCustomers' => $topCustomers,
            'filters' => $filters,
        ]);
    }

    /**
     * Apply date filters to query.
     */
    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when(
                $filters['start_date'] ?? null,
                fn($q, $start) =>
                $q->whereDate('created_at', '>=', $start)
            )
            ->when(
                $filters['end_date'] ?? null,
                fn($q, $end) =>
                $q->whereDate('created_at', '<=', $end)
            );
    }
}
