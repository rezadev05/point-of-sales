import React from "react";
import {
    IconShoppingBag,
    IconPhoto,
    IconMinus,
    IconPlus,
    IconAlertTriangle,
    IconShoppingCart,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";

const formatPrice = (value = 0) =>
    value.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

// Single Product Card
function ProductCard({ product, onAddToCart, isAdding, qtyInCart = 0 }) {
    const hasStock = product.stock > 0;
    const lowStock = product.stock > 0 && product.stock <= 5;
    const veryLowStock = product.stock > 0 && product.stock <= 3;

    // ✅ Cek apakah stok habis atau tidak mencukupi untuk tambah lagi
    const canAdd = hasStock && product.stock > qtyInCart;

    // ✅ Calculate remaining stock after cart
    const remainingStock = product.stock - qtyInCart;

    return (
        <button
            onClick={() => canAdd && onAddToCart(product)}
            disabled={!canAdd || isAdding}
            className={`
                group relative flex flex-col bg-white dark:bg-slate-900
                rounded-2xl border border-slate-200 dark:border-slate-800
                overflow-hidden transition-all duration-200
                ${
                    canAdd && !isAdding
                        ? "hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                        : "opacity-60 cursor-not-allowed"
                }
            `}
        >
            {/* Product Image */}
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {product.image ? (
                    <img
                        src={getProductImageUrl(product.image)}
                        alt={product.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                            canAdd && !isAdding ? "group-hover:scale-105" : ""
                        }`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <IconPhoto
                            size={32}
                            className="text-slate-300 dark:text-slate-600"
                        />
                    </div>
                )}

                {/* ✅ Stock Badge - Top Right */}
                {hasStock && lowStock && !qtyInCart && (
                    <span
                        className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium ${
                            veryLowStock
                                ? "bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-400 rounded-full"
                                : "bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400 rounded-full"
                        }`}
                    >
                        {/* {veryLowStock && (
                            <IconAlertTriangle size={12} strokeWidth={2.5} />
                        )} */}
                        Sisa {product.stock}
                    </span>
                )}

                {/* ✅ In Cart Badge - Top Left */}
                {/* ✅ In Cart Badge - Top Left dengan icon */}
                {qtyInCart > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold bg-primary-500 text-white rounded-full shadow-lg flex items-center gap-1">
                        <IconShoppingCart size={12} strokeWidth={2.5} />
                        {qtyInCart}
                    </span>
                )}

                {/* ✅ Out of Stock Overlay */}
                {!hasStock && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <IconAlertTriangle
                            size={32}
                            className="text-red-400"
                            strokeWidth={2}
                        />
                        <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                            Stok Habis
                        </span>
                    </div>
                )}

                {/* ✅ Max Stock Reached Overlay */}
                {hasStock && !canAdd && qtyInCart > 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <IconAlertTriangle
                            size={28}
                            className="text-orange-400"
                            strokeWidth={2}
                        />
                        <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-lg">
                            Stok Maksimal
                        </span>
                    </div>
                )}

                {/* ✅ Loading Overlay */}
                {isAdding && (
                    <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 p-3 flex flex-col gap-2 min-h-[80px] items-start text-left">
                {/* Title */}
                <h3 className="w-full text-left text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
                    {product.title}
                </h3>

                {/* Price & Stock */}
                <div className="w-full flex items-center justify-between gap-2">
                    {/* Harga kiri */}
                    <p className="text-base font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(product.sell_price)}
                    </p>

                    {/* ✅ Stock indicator - kanan */}
                    <div className="flex flex-col items-end gap-0.5">
                        <span
                            className={`
                                text-xs font-semibold px-2 py-0.5 rounded-full
                                ${
                                    !hasStock
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                        : remainingStock <= 3
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                          : remainingStock <= 5
                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                }
                            `}
                        >
                            {!hasStock ? "Habis" : `${product.stock}`}
                        </span>

                        {/* ✅ Show remaining after cart */}
                        {/* {qtyInCart > 0 && hasStock && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {remainingStock}
                            </span>
                        )} */}
                    </div>
                </div>
            </div>

            {/* ✅ Hover Add Indicator - only if can add */}
            {/* {canAdd && !isAdding && (
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-all pointer-events-none flex items-center justify-center">
                    <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                        + Tambahkan
                    </div>
                </div>
            )} */}
        </button>
    );
}

// Category Tab Button
function CategoryTab({ category, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 min-h-touch
                ${
                    isActive
                        ? "bg-primary-500 text-white shadow-md shadow-primary-500/30"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                }
            `}
        >
            {category.name}
        </button>
    );
}

// Search Input
function SearchInput({
    value,
    onChange,
    onSearch,
    isSearching,
    placeholder,
    inputRef,
}) {
    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                placeholder={
                    placeholder ||
                    "Cari produk atau scan barcode... (/ untuk fokus)"
                }
                className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500
                    transition-all text-base"
                disabled={isSearching}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <IconShoppingBag size={20} className="text-slate-400" />
                )}
            </div>
        </div>
    );
}

// Main ProductGrid Component
export default function ProductGrid({
    products = [],
    categories = [],
    selectedCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    onSearch,
    isSearching,
    onAddToCart,
    addingProductId,
    searchInputRef,
    carts = [], // ✅ Tambahkan carts prop untuk tracking qty
}) {
    // Filter products by category and search
    const filteredProducts = products.filter((product) => {
        const matchesCategory =
            !selectedCategory || product.category_id === selectedCategory;
        const matchesSearch =
            !searchQuery ||
            product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // ✅ Helper function to get qty in cart for a product
    const getQtyInCart = (productId) => {
        const cartItem = carts.find((cart) => cart.product_id === productId);
        return cartItem ? cartItem.qty : 0;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <SearchInput
                    value={searchQuery}
                    onChange={onSearchChange}
                    onSearch={onSearch}
                    isSearching={isSearching}
                    placeholder="Cari produk atau scan barcode... (tekan / untuk fokus)"
                    inputRef={searchInputRef}
                />
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                    <CategoryTab
                        category={{ id: null, name: "Semua" }}
                        isActive={!selectedCategory}
                        onClick={() => onCategoryChange(null)}
                    />
                    {categories.map((category) => (
                        <CategoryTab
                            key={category.id}
                            category={category}
                            isActive={selectedCategory === category.id}
                            onClick={() => onCategoryChange(category.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={onAddToCart}
                                isAdding={addingProductId === product.id}
                                qtyInCart={getQtyInCart(product.id)} // ✅ Pass qty in cart
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <IconShoppingBag
                            size={48}
                            strokeWidth={1.5}
                            className="mb-3"
                        />
                        <p className="text-sm">
                            {searchQuery
                                ? "Produk tidak ditemukan"
                                : "Tidak ada produk"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export sub-components
ProductGrid.Card = ProductCard;
ProductGrid.CategoryTab = CategoryTab;
ProductGrid.SearchInput = SearchInput;
