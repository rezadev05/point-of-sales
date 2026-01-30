<?php

namespace App\Http\Controllers\Apps;

use App\Exceptions\PaymentGatewayException;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\ReceiptSetting;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Exports\TransactionReportExport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * index
     *
     * @return void
     */
    public function index()
    {
        $userId = auth()->user()->id;

        // Get active cart items (not held)
        $carts = Cart::with('product')
            ->where('cashier_id', $userId)
            ->active()
            ->latest()
            ->get();

        // Get held carts grouped by hold_id
        $heldCarts = Cart::with('product:id,title,sell_price,image')
            ->where('cashier_id', $userId)
            ->held()
            ->get()
            ->groupBy('hold_id')
            ->map(function ($items, $holdId) {
                $first = $items->first();
                return [
                    'hold_id'     => $holdId,
                    'label'       => $first->hold_label,
                    'held_at'     => $first->held_at?->toISOString(),
                    'items_count' => $items->sum('qty'),
                    'total'       => $items->sum('price'),
                ];
            })
            ->values();

        //get all customers
        $customers = Customer::latest()->get();

        // get all products with categories for product grid
        $products = Product::with('category:id,name')
            ->select('id', 'barcode', 'title', 'description', 'image', 'buy_price', 'sell_price', 'stock', 'category_id')
            ->where('stock', '>', 0)
            ->orderBy('title')
            ->get();

        // get all categories
        $categories = \App\Models\Category::select('id', 'name', 'image')
            ->orderBy('name')
            ->get();

        $paymentSetting = PaymentSetting::first();

        $carts_total = 0;
        foreach ($carts as $cart) {
            $carts_total += $cart->price;
        }

        $defaultGateway = $paymentSetting?->default_gateway ?? 'cash';
        if (
            $defaultGateway !== 'cash'
            && (! $paymentSetting || ! $paymentSetting->isGatewayReady($defaultGateway))
        ) {
            $defaultGateway = 'cash';
        }

        return Inertia::render('Dashboard/Transactions/Index', [
            'carts'                 => $carts,
            'carts_total'           => $carts_total,
            'heldCarts'             => $heldCarts,
            'customers'             => $customers,
            'products'              => $products,
            'categories'            => $categories,
            'paymentGateways'       => $paymentSetting?->enabledGateways() ?? [],
            'defaultPaymentGateway' => $defaultGateway,
        ]);
    }

    /**
     * searchProduct
     *
     * @param  mixed $request
     * @return void
     */
    public function searchProduct(Request $request)
    {
        //find product by barcode
        $product = Product::where('barcode', $request->barcode)->first();

        if ($product) {
            return response()->json([
                'success' => true,
                'data'    => $product,
            ]);
        }

        return response()->json([
            'success' => false,
            'data'    => null,
        ]);
    }

    /**
     * addToCart
     *
     * @param  mixed $request
     * @return void
     */
    public function addToCart(Request $request)
    {
        // Cari produk berdasarkan ID yang diberikan
        $product = Product::whereId($request->product_id)->first();

        // Jika produk tidak ditemukan, redirect dengan pesan error
        if (! $product) {
            return redirect()->back()->with('error', 'Produk tidak ditemukan.');
        }

        // Cek keranjang yang sudah ada
        $cart = Cart::with('product')
            ->where('product_id', $request->product_id)
            ->where('cashier_id', auth()->user()->id)
            ->whereNull('hold_id')
            ->first();

        // Hitung total qty yang akan ada di cart
        $currentQty = $cart ? $cart->qty : 0;
        $totalQty = $currentQty + $request->qty;

        // Validasi stok produk (cek stok kosong atau tidak mencukupi)
        if ($product->stock <= 0) {
            return redirect()->back()->with('error', "Stok {$product->title} habis!");
        }

        if ($product->stock < $totalQty) {
            return redirect()->back()->with('error', "Stok {$product->title} tidak mencukupi! Tersedia: {$product->stock}, di cart: {$currentQty}");
        }

        if ($cart) {
            // Tingkatkan qty
            $cart->increment('qty', $request->qty);

            // Jumlahkan harga * kuantitas
            $cart->price = $cart->product->sell_price * $cart->qty;

            $cart->save();
        } else {
            // Insert ke keranjang
            Cart::create([
                'cashier_id' => auth()->user()->id,
                'product_id' => $request->product_id,
                'qty'        => $request->qty,
                'price'      => $request->sell_price * $request->qty,
            ]);
        }

        return redirect()->route('transactions.index')->with('success', 'Produk berhasil ditambahkan!');
    }


    /**
     * destroyCart
     *
     * @param  mixed $request
     * @return void
     */
    public function destroyCart($cart_id)
    {
        $cart = Cart::with('product')->whereId($cart_id)->first();

        if ($cart) {
            $cart->delete();
            return back();
        } else {
            // Handle case where no cart is found (e.g., redirect with error message)
            return back()->withErrors(['message' => 'Cart not found']);
        }
    }

    /**
     * updateCart - Update cart item quantity
     *
     * @param  mixed $request
     * @param  int $cart_id
     * @return void
     */
    public function updateCart(Request $request, $cart_id)
    {
        $request->validate([
            'qty' => 'required|integer|min:1',
        ]);

        $cart = Cart::with('product')->whereId($cart_id)
            ->where('cashier_id', auth()->user()->id)
            ->whereNull('hold_id')
            ->first();

        if (! $cart) {
            return back()->with('error', 'Item keranjang tidak ditemukan');
        }

        // Validasi stok kosong
        if ($cart->product->stock <= 0) {
            return back()->with('error', "Stok {$cart->product->title} habis!");
        }

        // Validasi stok tidak mencukupi
        if ($cart->product->stock < $request->qty) {
            return back()->with('error', "Stok {$cart->product->title} tidak mencukupi! Tersedia: {$cart->product->stock}");
        }

        // Update quantity dan price
        $cart->qty   = $request->qty;
        $cart->price = $cart->product->sell_price * $request->qty;
        $cart->save();

        return back()->with('success', 'Quantity berhasil diperbarui');
    }

    /**
     * holdCart - Hold current cart items for later
     *
     * @param  Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function holdCart(Request $request)
    {
        $request->validate([
            'label' => 'nullable|string|max:50',
        ]);

        $userId = auth()->user()->id;

        // Get active cart items
        $activeCarts = Cart::where('cashier_id', $userId)
            ->active()
            ->get();

        if ($activeCarts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang kosong, tidak ada yang bisa ditahan',
            ], 422);
        }

        // Generate unique hold ID
        $holdId = 'HOLD-' . strtoupper(uniqid());
        $label  = $request->label ?: 'Transaksi ' . now()->format('H:i');

        // Mark all active cart items as held
        Cart::where('cashier_id', $userId)
            ->active()
            ->update([
                'hold_id'    => $holdId,
                'hold_label' => $label,
                'held_at'    => now(),
            ]);

        return back()->with('success', 'Transaksi ditahan: ' . $label);
    }

    /**
     * resumeCart - Resume a held cart
     *
     * @param  string $holdId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resumeCart($holdId)
    {
        $userId = auth()->user()->id;

        // Check if there are any active carts (not held)
        $activeCarts = Cart::where('cashier_id', $userId)
            ->active()
            ->count();

        if ($activeCarts > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Selesaikan atau tahan transaksi aktif terlebih dahulu',
            ], 422);
        }

        // Get held carts
        $heldCarts = Cart::where('cashier_id', $userId)
            ->forHold($holdId)
            ->get();

        if ($heldCarts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ditahan tidak ditemukan',
            ], 404);
        }

        // Resume by clearing hold info
        Cart::where('cashier_id', $userId)
            ->forHold($holdId)
            ->update([
                'hold_id'    => null,
                'hold_label' => null,
                'held_at'    => null,
            ]);

        return back()->with('success', 'Transaksi dilanjutkan');
    }

    /**
     * clearHold - Delete a held cart
     *
     * @param  string $holdId
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearHold($holdId)
    {
        $userId = auth()->user()->id;

        $deleted = Cart::where('cashier_id', $userId)
            ->forHold($holdId)
            ->delete();

        if ($deleted === 0) {
            return redirect()->back()->with('error', 'Transaksi ditahan tidak ditemukan');
        }

        // return response()->json([
        //     'success' => true,
        //     'message' => 'Transaksi ditahan berhasil dihapus',
        // ]);

        return redirect()->back()->with('success', 'Transaksi ditahan berhasil dihapus');
    }

    /**
     * getHeldCarts - Get all held carts for current user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHeldCarts()
    {
        $userId = auth()->user()->id;

        $heldCarts = Cart::with('product:id,title,sell_price,image')
            ->where('cashier_id', $userId)
            ->held()
            ->get()
            ->groupBy('hold_id')
            ->map(function ($items, $holdId) {
                $first = $items->first();
                return [
                    'hold_id'     => $holdId,
                    'label'       => $first->hold_label,
                    'held_at'     => $first->held_at,
                    'items_count' => $items->sum('qty'),
                    'total'       => $items->sum('price'),
                    'items'       => $items->map(fn($item) => [
                        'id'      => $item->id,
                        'product' => $item->product,
                        'qty'     => $item->qty,
                        'price'   => $item->price,
                    ]),
                ];
            })
            ->values();

        return response()->json([
            'success'    => true,
            'held_carts' => $heldCarts,
        ]);
    }

    /**
     * store
     *
     * @param  mixed $request
     * @return void
     */
    public function store(Request $request, PaymentGatewayManager $paymentGatewayManager)
    {
        // Validasi stok produk SEBELUM memproses transaksi
        $carts = Cart::with('product')
            ->where('cashier_id', auth()->user()->id)
            ->whereNull('hold_id')
            ->get();

        // Cek apakah cart kosong
        if ($carts->isEmpty()) {
            return redirect()
                ->route('transactions.index')
                ->with('error', 'Keranjang masih kosong.');
        }

        // Validasi stok setiap produk
        $outOfStock = [];
        $insufficientStock = [];

        foreach ($carts as $cart) {
            $product = $cart->product;

            if (!$product) {
                return redirect()
                    ->route('transactions.index')
                    ->with('error', 'Produk tidak ditemukan.');
            }

            // Cek stok kosong (0)
            if ($product->stock <= 0) {
                $outOfStock[] = $product->title;
            }
            // Cek stok tidak mencukupi qty di cart
            elseif ($product->stock < $cart->qty) {
                $insufficientStock[] = "{$product->title} (stok tersedia: {$product->stock}, diminta: {$cart->qty})";
            }
        }

        // Jika ada produk yang stoknya kosong
        if (!empty($outOfStock)) {
            return redirect()
                ->route('transactions.index')
                ->with('error', 'Produk berikut stoknya habis: ' . implode(', ', $outOfStock));
        }

        // Jika ada produk yang stoknya tidak mencukupi
        if (!empty($insufficientStock)) {
            return redirect()
                ->route('transactions.index')
                ->with('error', 'Stok tidak mencukupi untuk: ' . implode(', ', $insufficientStock));
        }

        // Lanjutkan proses pembayaran gateway
        $paymentGateway = $request->input('payment_gateway');
        $isQrisPayment = $paymentGateway === 'qris';
        if ($paymentGateway) {
            $paymentGateway = strtolower($paymentGateway);
        }
        $paymentSetting = null;

        if ($paymentGateway) {
            $paymentSetting = PaymentSetting::first();

            if (! $paymentSetting || ! $paymentSetting->isGatewayReady($paymentGateway)) {
                return redirect()
                    ->route('transactions.index')
                    ->with('error', 'Gateway pembayaran belum dikonfigurasi.');
            }
        }

        // Generate invoice
        $length = 10;
        $random = '';
        for ($i = 0; $i < $length; $i++) {
            $random .= rand(0, 1) ? rand(0, 9) : chr(rand(ord('a'), ord('z')));
        }

        $invoice       = 'TRX-' . Str::upper($random);
        $isCashPayment = empty($paymentGateway);
        $cashAmount    = $isCashPayment ? $request->cash : $request->grand_total;
        $changeAmount  = $isCashPayment ? $request->change : 0;

        $transaction = DB::transaction(function () use (
            $isQrisPayment,
            $request,
            $invoice,
            $cashAmount,
            $changeAmount,
            $paymentGateway,
            $isCashPayment,
            $carts
        ) {
            $transaction = Transaction::create([
                'cashier_id'     => auth()->user()->id,
                'customer_id'    => $request->customer_id,
                'invoice'        => $invoice,
                'cash'           => $cashAmount,
                'change'         => $changeAmount,
                'discount_type'  => $request->discount_type,
                'discount_value' => $request->discount_value,
                'discount'       => $request->discount,
                'tax_type'       => $request->tax_type,
                'tax_value'      => $request->tax_value,
                'tax'            => $request->tax,
                'grand_total'    => $request->grand_total,
                'payment_method' => $paymentGateway ?: 'cash',
                'payment_status' => ($isCashPayment || $isQrisPayment) ? 'paid' : 'pending',
            ]);

            // Hitung subtotal
            $subtotal = 0;
            foreach ($carts as $cart) {
                $subtotal += $cart->price;
            }

            $total_discount = (float) $request->discount;
            $total_tax      = (float) $request->tax;

            foreach ($carts as $cart) {
                $product_sell = $cart->product->sell_price;
                $product_buy  = $cart->product->buy_price;

                $line_sell = $product_sell * $cart->qty;
                $line_buy  = $product_buy * $cart->qty;

                $line_discount = 0;
                if ($subtotal > 0 && $total_discount > 0) {
                    $line_discount = $total_discount * ($line_sell / $subtotal);
                }

                $line_tax = 0;
                if ($subtotal > 0 && $total_tax > 0) {
                    $line_tax = $total_tax * ($line_sell / $subtotal);
                }

                $line_net_sell = $line_sell - $line_discount;

                $line_profit = $line_net_sell - $line_buy;

                $transaction->details()->create([
                    'transaction_id' => $transaction->id,
                    'product_id'     => $cart->product_id,
                    'qty'            => $cart->qty,
                    'price'          => $cart->price,
                ]);

                $transaction->profits()->create([
                    'transaction_id' => $transaction->id,
                    'total'          => $line_profit,
                ]);

                $product = Product::lockForUpdate()->find($cart->product_id);

                if ($product->stock < $cart->qty) {
                    throw new \Exception("Stok {$product->title} tidak mencukupi saat checkout.");
                }

                $product->stock = $product->stock - $cart->qty;
                $product->save();
            }

            Cart::where('cashier_id', auth()->user()->id)
                ->whereNull('hold_id')
                ->delete();

            return $transaction->fresh(['customer']);
        });

        if ($paymentGateway) {
            try {
                $paymentResponse = $paymentGatewayManager->createPayment($transaction, $paymentGateway, $paymentSetting);

                $transaction->update([
                    'payment_reference' => $paymentResponse['reference'] ?? null,
                    'payment_url'       => $paymentResponse['payment_url'] ?? null,
                ]);
            } catch (PaymentGatewayException $exception) {
                return redirect()
                    ->route('transactions.print', $transaction->invoice)
                    ->with('error', $exception->getMessage());
            }
        }

        return to_route('transactions.print', $transaction->invoice);
    }


    public function print($invoice)
    {
        // Get transaction
        $transaction = Transaction::with('details.product', 'cashier', 'customer')
            ->where('invoice', $invoice)
            ->firstOrFail();

        // Get receipt settings
        $receiptSettings = ReceiptSetting::first();

        return Inertia::render('Dashboard/Transactions/Print', [
            'transaction' => $transaction,
            'receiptSettings' => $receiptSettings,
        ]);
    }


    /**
     * Display transaction history.
     */

    public function history(Request $request)
    {
        $filters = [
            'invoice'    => $request->input('invoice'),
            'start_date' => $request->input('start_date'),
            'end_date'   => $request->input('end_date'),
        ];

        $query = Transaction::query()
            ->with(['cashier:id,name', 'customer:id,name'])
            ->withSum('details as total_items', 'qty')
            ->withSum('profits as total_profit', 'total')
            ->orderByDesc('created_at');

        if (! $request->user()->isSuperAdmin()) {
            $query->where('cashier_id', $request->user()->id);
        }

        // 🔎 Filter invoice
        $query->when($filters['invoice'], function (Builder $builder, $invoice) {
            $builder->where('invoice', 'like', '%' . $invoice . '%');
        });

        // 📅 Filter tanggal
        $query->when(
            $filters['start_date'] || $filters['end_date'],
            function (Builder $builder) use ($filters) {
                if ($filters['start_date'] && $filters['end_date']) {
                    $builder->whereBetween('created_at', [
                        $filters['start_date'] . ' 00:00:00',
                        $filters['end_date'] . ' 23:59:59',
                    ]);
                } elseif ($filters['start_date']) {
                    $builder->whereDate('created_at', '>=', $filters['start_date']);
                } elseif ($filters['end_date']) {
                    $builder->whereDate('created_at', '<=', $filters['end_date']);
                }
            }
        );

        // 🔥 Default: hari ini
        if (
            ! $filters['invoice'] &&
            ! $filters['start_date'] &&
            ! $filters['end_date']
        ) {
            $query->whereDate('created_at', now()->toDateString());
        }

        $transactions = $query
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Transactions/History', [
            'transactions' => $transactions,
            'filters'      => $filters,
            'canDelete'    => $request->user()
                ? $request->user()->can('transactions-access')
                : false,
        ]);
    }




    public function export(Request $request)
    {
        $filters = $request->only(['invoice', 'start_date', 'end_date']);

        // default: hari ini
        $fileName = 'laporan-transaksi-' . now()->format('d-m-Y') . '.xlsx';

        // jika ada filter tanggal
        if ($request->start_date && $request->end_date) {
            $start = Carbon::parse($request->start_date)->format('d-m-Y');
            $end   = Carbon::parse($request->end_date)->format('d-m-Y');

            $fileName = "laporan-transaksi-{$start} {$end}.xlsx";
        }

        return Excel::download(
            new TransactionReportExport($filters),
            $fileName
        );
    }

    /**
     * destroyCart
     *
     * @param  mixed $request
     * @return void
     */
    public function destroy(Transaction $transaction)
    {
        DB::transaction(function () use ($transaction) {

            // 1. Hapus detail transaksi
            $transaction->details()->delete();

            // 2. Hapus profit
            $transaction->profits()->delete();

            // 3. Hapus transaksi
            $transaction->delete();
        });

        return back()->with('success', 'Transaksi berhasil dihapus');
    }
}
