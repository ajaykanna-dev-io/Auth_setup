import { useState } from "react";
import type { Product } from "../types/product.types";
import { useRateProductMutation } from "../redux/slices/product/productApi";
import { useAppSelector } from "../redux/hooks";
import { Link } from "react-router";

interface RateProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function RateProductModal({ product, onClose }: RateProductModalProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [rateProduct, { isLoading }] = useRateProductMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await rateProduct({
        id: product.id,
        body: { rating, comment: comment.trim() || undefined },
      }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || "Failed to submit rating.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          Rate this Product
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
          {product.title}
        </p>

        {!isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Please sign in to rate and review this product.
            </p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Sign In Now
            </Link>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Thank you for rating!
            </h4>
            <p className="text-xs text-slate-500 mt-1">Your rating has been saved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            {/* Stars Picker */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <span className={active ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}>
                        ★
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {hoverRating ?? rating} out of 5 stars
              </span>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Review (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Share your thoughts on the quality, shipping, or performance..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading ? "Submitting…" : "Submit Rating"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
