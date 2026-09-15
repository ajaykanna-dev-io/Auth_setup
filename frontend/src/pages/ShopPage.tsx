import { useState, useMemo } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import RateProductModal from "../components/RateProductModal";
import { useGetPublicProductsQuery } from "../redux/slices/product/productApi";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addToCart } from "../redux/slices/cart/cartSlice";
import type { Product } from "../types/product.types";

export default function ShopPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { data: products = [], isLoading, isError, refetch } = useGetPublicProductsQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [ratingProduct, setRatingProduct] = useState<Product | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);



  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const isPrivileged = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canAddToCart = !isPrivileged;
  const canRateProduct = user?.role === "USER";

  const handleAddToCart = (product: Product) => {
    if (!canAddToCart) return;
    dispatch(addToCart({ product, quantity: 1 }));
    setAddedNotice(product.title);
    setTimeout(() => {
      setAddedNotice((prev) => (prev === product.title ? null : prev));
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar with Cart Symbol */}
      <Navbar />

      {/* Floating Added-to-Cart Toast */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 text-emerald-400 dark:text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-xs font-semibold">
            "{addedNotice}" added to your cart!
          </span>
          <Link
            to="/checkout"
            className="text-xs font-bold text-indigo-400 dark:text-indigo-600 underline ml-2"
          >
            Checkout
          </Link>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent border-b border-slate-200/60 dark:border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-3">
              <span>✦ Modern E-Commerce Platform</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Curated Products for Every Lifestyle.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore manager-approved collections with live stock counts, transparent customer ratings, and instant checkout.
            </p>
          </div>

          {/* Quick role shortcuts */}
          {user && (
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xs text-left">
                <p className="text-slate-400">Signed in as</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {user.role} Privilege
                </span>
              </div>
              <Link
                to="/dashboard?tab=products"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors text-center"
              >
                Manage Store
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse"
              >
                <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-rose-600 dark:text-rose-400 text-sm font-semibold mb-2">
              Unable to load product catalog
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Please ensure the backend server is running.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State: if no product available means, then display a simple message */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="max-w-md mx-auto py-20 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No products available
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              There are currently no products in the catalog. Check back soon once administrators add new items and managers approve them.
            </p>

            {user?.role === "ADMIN" && (
              <Link
                to="/dashboard?tab=products&action=add"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>+</span> Add First Product
              </Link>
            )}

            {user?.role === "MANAGER" && (
              <Link
                to="/dashboard?tab=products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all"
              >
                Review Approval Queue
              </Link>
            )}
          </div>
        )}

        {/* Filter Empty State (Products exist in store, but search/filter matched nothing) */}
        {!isLoading && !isError && products.length > 0 && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No products match "{searchQuery}"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or selecting a different category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !isError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const inStock = product.stock > 0;
              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200"
                >
                  {/* Product Image Container */}
                  <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <span className="text-[10px] mt-1">ShopCraft Item</span>
                      </div>
                    )}

                    {/* Category Pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow-sm">
                      {product.category || "General"}
                    </span>

                    {/* Stock Status Badge */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm backdrop-blur-sm flex items-center gap-1.5 ${inStock
                          ? "bg-emerald-500/90 text-white"
                          : "bg-rose-500/90 text-white"
                        }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Rating & Shipped row */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        <button
                          type="button"
                          onClick={() => setRatingProduct(product)}
                          className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                          title="Click to rate this product"
                        >
                          <span className="text-amber-400 font-bold">★</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                          </span>
                          <span>({product.ratingCount})</span>
                        </button>

                        <span className="text-[11px] text-slate-400">
                          🚚 {product.shippedCount} shipped
                        </span>
                      </div>

                      {/* Product Title */}
                      <h3
                        className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 mb-1 text-left"
                        title={product.title}
                      >
                        {product.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 text-left">
                        {product.description || "Premium quality product curated for you."}
                      </p>
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block leading-none">Price</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {canRateProduct ? (
                          <button
                            type="button"
                            onClick={() => setRatingProduct(product)}
                            className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                            title="Click to rate this product"
                          >
                            <span className="text-amber-400 font-bold">★</span>

                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                            </span>

                            <span>({product.ratingCount})</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 font-bold">★</span>

                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                            </span>

                            <span>({product.ratingCount})</span>
                          </div>
                        )}

                        {canAddToCart && (
                          <button
                            type="button"
                            disabled={!inStock}
                            onClick={() => handleAddToCart(product)}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {ratingProduct && (
        <RateProductModal
          product={ratingProduct}
          onClose={() => setRatingProduct(null)}
        />
      )}
    </div>
  );
}
