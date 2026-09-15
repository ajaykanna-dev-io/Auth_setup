import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartTotalPrice,
  updateQuantity,
} from "../redux/slices/cart/cartSlice";
import { useCheckoutMutation } from "../redux/slices/product/productApi";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [shippingAddress, setShippingAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    message: string;
    grandTotal: number;
    orders: any[];
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [checkoutMutation, { isLoading: isSubmitting }] = useCheckoutMutation();

  const handleQuantityChange = (productId: string, newQty: number, maxStock: number) => {
    if (newQty < 1) {
      dispatch(removeFromCart(productId));
      return;
    }
    if (newQty > maxStock) return;
    dispatch(updateQuantity({ productId, quantity: newQty }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!shippingAddress.trim()) {
      setCheckoutError("Please enter your complete shipping delivery address.");
      return;
    }

    if (cartItems.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: shippingAddress.trim(),
      };

      const result = await checkoutMutation(payload).unwrap();
      setOrderSuccess(result);
      dispatch(clearCart());
    } catch (err: any) {
      setCheckoutError(
        err?.data?.message || "Failed to complete checkout. Please check stock availability."
      );
    }
  };

  const isPrivileged = user?.role === "ADMIN" || user?.role === "MANAGER";

  if (isPrivileged) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Cart & Checkout are for Customer Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The shopping cart is available for regular customer users only. Administrators and Managers can view products and manage inventory from the dashboard.
          </p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb / Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Store
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Product Checkout
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Review your cart items, select quantities based on stock, and finalize your order.
          </p>
        </div>

        {/* Success Screen */}
        {orderSuccess ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-8 text-center shadow-xl shadow-emerald-500/5">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              Thank you for your purchase. Your order has been registered and inventory stocks have been updated.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left mb-6 border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500 dark:text-slate-400">Total Items:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {orderSuccess.orders.length}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Grand Total:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ${orderSuccess.grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Shipped to: <span className="font-medium text-slate-700 dark:text-slate-300">{shippingAddress}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all"
              >
                Continue Shopping
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart View */
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Your cart is empty
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Checkout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Order Items ({cartItems.length})
                </h2>
                <button
                  type="button"
                  onClick={() => dispatch(clearCart())}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="pt-4 first:pt-0 flex gap-4 items-center">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                            {product.category || "General"}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {product.title}
                          </h3>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Stock limit badge */}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Stock available:{" "}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {product.stock}
                          </span>
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, quantity - 1, product.stock)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-semibold text-slate-900 dark:text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= product.stock}
                              onClick={() => handleQuantityChange(product.id, quantity + 1, product.stock)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(product.id))}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Remove from cart"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Checkout & Address Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Order Summary & Delivery
              </h2>

              {!isAuthenticated && (
                <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <span>You must be signed in to purchase products. </span>
                    <Link to="/login" className="font-bold underline hover:text-amber-950">
                      Sign in here
                    </Link>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {checkoutError}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Shipping Delivery Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter complete street address, city, state, zip code..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Shipping</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free Express</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Order…
                    </>
                  ) : !isAuthenticated ? (
                    "Sign in to Checkout"
                  ) : (
                    `Complete Order • $${totalPrice.toFixed(2)}`
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-4">
                <span>🔒 Secure checkout</span>
                <span>📦 Real-time stock reservation</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
