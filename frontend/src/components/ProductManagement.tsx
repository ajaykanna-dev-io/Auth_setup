import { useState, useEffect } from "react";
import type { UserRole } from "../types/auth.types";
import type { Product } from "../types/product.types";
import {
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateApprovalStatusMutation,
  useDeleteProductMutation,
  useUpdateStockMutation,
  useGetUserOrdersQuery,
  useGetAllOrdersQuery
} from "../redux/slices/product/productApi";

interface ProductManagementProps {
  currentRole: UserRole;
  initialOpenAddModal?: boolean;
}

export default function ProductManagement({
  currentRole,
  initialOpenAddModal = false,
}: ProductManagementProps) {
  const isPrivileged = currentRole === "ADMIN" || currentRole === "MANAGER";

  // Active tab: 'catalog' | 'pending' | 'my-orders'
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "pending" | "orders">(
    isPrivileged ? "catalog" : "orders"
  );

  // Queries
  const {
    data: adminProducts = [],
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useGetAdminProductsQuery(undefined, {
    skip: !isPrivileged,
  });

  const { data: userOrders = [], isLoading: isOrdersLoading } = useGetUserOrdersQuery();
  const { data: allOrders = [], isLoading: isAllOrdersLoading } = useGetAllOrdersQuery(undefined, {
    skip: !isPrivileged,
  });

  // All Orders search & sort state (Admin/Manager)
  const [allOrdersSearch, setAllOrdersSearch] = useState("");
  const [allOrdersSort, setAllOrdersSort] = useState<"date_desc" | "date_asc" | "price_desc" | "price_asc" | "stock_desc" | "shipped_desc" | "rating_desc">("date_desc");

  const filteredAllOrders = allOrders
    .filter((p) => {
      const q = allOrdersSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.creatorEmail ?? "").toLowerCase().includes(q) ||
        (p.creatorName ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (allOrdersSort) {
        case "date_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date_asc":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price_desc": return b.price - a.price;
        case "price_asc":  return a.price - b.price;
        case "stock_desc": return b.stock - a.stock;
        case "shipped_desc": return b.shippedCount - a.shippedCount;
        case "rating_desc": return b.rating - a.rating;
        default: return 0;
      }
    });

  // Mutations
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateApproval, { isLoading: isApproving }] = useUpdateApprovalStatusMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateStock, { isLoading: isUpdatingStock }] = useUpdateStockMutation();

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(initialOpenAddModal);

  useEffect(() => {
    if (initialOpenAddModal) {
      setShowAddModal(true);
    }
  }, [initialOpenAddModal]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Stock State
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [shippedValue, setShippedValue] = useState<number>(0);

  // Filter pending products
  const pendingProducts = adminProducts.filter((p) => p.status === "PENDING_APPROVAL");

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const price = parseFloat(newPrice);
    const stock = parseInt(newStock, 10);

    if (isNaN(price) || price <= 0) {
      setCreateError("Please enter a valid price greater than $0.");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setCreateError("Please enter a valid non-negative stock quantity.");
      return;
    }

    try {
      await createProduct({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        price,
        stock,
        category: newCategory.trim() || "General",
        imageUrl: newImageUrl.trim() || undefined,
      }).unwrap();

      setShowAddModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      setNewStock("");
      setNewImageUrl("");
      refetchProducts();
    } catch (err: any) {
      setCreateError(err?.data?.message || "Failed to create product.");
    }
  };

  const handleApprovalChange = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateApproval({ id, status }).unwrap();
      refetchProducts();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update approval status.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        await deleteProduct(id).unwrap();
        refetchProducts();
      } catch (err: any) {
        alert(err?.data?.message || "Failed to delete product.");
      }
    }
  };

  const handleSaveStock = async () => {
    if (!editingStockProduct) return;
    try {
      await updateStock({
        id: editingStockProduct.id,
        body: { stock: stockValue, shippedCount: shippedValue },
      }).unwrap();
      setEditingStockProduct(null);
      refetchProducts();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update stock.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 m-4 shadow-sm">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            E-Commerce Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage inventory, approvals, order tracking, and stock flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Product button for Admin */}
          {currentRole === "ADMIN" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Add Product
            </button>
          )}

          {/* Sub Navigation */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {isPrivileged && (
              <>
                <button
                  onClick={() => setActiveSubTab("catalog")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSubTab === "catalog"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                    }`}
                >
                  All Products ({adminProducts.length})
                </button>
                <button
                  onClick={() => setActiveSubTab("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${activeSubTab === "pending"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                    }`}
                >
                  Pending Approvals
                  {pendingProducts.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-bold">
                      {pendingProducts.length}
                    </span>
                  )}
                </button>
              </>
            )}
            {(currentRole === "ADMIN" || currentRole === "MANAGER") && (
              <button
                onClick={() => setActiveSubTab("orders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSubTab === "orders"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                All Orders ({allOrders.length})
              </button>
            )}
            {currentRole === "USER" && (<button
              onClick={() => setActiveSubTab("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSubTab === "orders"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
                }`}
            >
              My Orders ({userOrders.length})
            </button>)}
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT WRAPPER ─── */}
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl">

        {/* ─── TAB 1: ALL PRODUCTS (Admin & Manager) ─── */}
      {
        activeSubTab === "catalog" && isPrivileged && (
          <div className="mt-6">
            {isProductsLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading inventory catalog…
              </div>
            ) : adminProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No products found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Stock / Shipped</th>
                      <th className="py-3 px-3">Rating</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adminProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-400">Box</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                {p.title}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                UUID: {p.id.slice(0, 8)}…
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {p.category}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {p.stock} in stock
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {p.shippedCount} shipped
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-amber-500">★ {p.rating.toFixed(1)}</span>
                          <span className="text-slate-400 text-[11px] ml-1">({p.ratingCount})</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                              : p.status === "PENDING_APPROVAL"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                              }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Admin: Manage Stock */}
                            {currentRole === "ADMIN" && (
                              <button
                                onClick={() => {
                                  setEditingStockProduct(p);
                                  setStockValue(p.stock);
                                  setShippedValue(p.shippedCount);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                Stock
                              </button>
                            )}

                            {/* Admin & Manager: Delete Product */}
                            {isPrivileged && (
                              <button
                                onClick={() => handleDelete(p.id, p.title)}
                                disabled={isDeleting}
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      }

      {/* ─── TAB 2: PENDING APPROVALS (Manager & Admin View) ─── */}
      {
        activeSubTab === "pending" && isPrivileged && (
          <div className="mt-6">
            {pendingProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                ✨ All products have been reviewed! No items pending manager approval.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">Image</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Price: <strong>${p.price.toFixed(2)}</strong></span>
                          <span>Stock: <strong>{p.stock}</strong></span>
                          <span>Category: <strong>{p.category}</strong></span>
                        </div>
                        {p.creatorEmail && (
                          <span className="text-[10px] text-slate-400">
                            Submitted by admin: {p.creatorEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Manager Approval Controls (Only Manager can approve or reject) */}
                    {currentRole === "MANAGER" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprovalChange(p.id, "APPROVED")}
                          disabled={isApproving}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApprovalChange(p.id, "REJECTED")}
                          disabled={isApproving}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium italic">
                          ⏳ Awaiting Manager Approval
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      {/* ─── TAB 3: ORDERS ─── */}
      {
        activeSubTab === "orders" && (
          <div className="mt-6">
            {/* ── ADMIN / MANAGER: full product catalog view with search + sort ── */}
            {isPrivileged ? (
              <>
                {/* Search + Sort toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by title, category, or creator…"
                      value={allOrdersSearch}
                      onChange={(e) => setAllOrdersSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={allOrdersSort}
                    onChange={(e) => setAllOrdersSort(e.target.value as typeof allOrdersSort)}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="stock_desc">Most Stock</option>
                    <option value="shipped_desc">Most Shipped</option>
                    <option value="rating_desc">Highest Rated</option>
                  </select>
                </div>

                {/* Results count */}
                {allOrdersSearch && (
                  <p className="text-[11px] text-slate-400 mb-3">
                    {filteredAllOrders.length} result{filteredAllOrders.length !== 1 ? "s" : ""} for <span className="font-semibold text-slate-600 dark:text-slate-300">"{allOrdersSearch}"</span>
                  </p>
                )}

                {isAllOrdersLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading all orders…</div>
                ) : filteredAllOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    {allOrdersSearch ? "No products match your search." : "No products found."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                          <th className="py-3 px-3">Product</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Price</th>
                          <th className="py-3 px-3">Stock / Shipped</th>
                          <th className="py-3 px-3">Rating</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Created By</th>
                          <th className="py-3 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredAllOrders.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Product */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-slate-400">📦</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white line-clamp-1 max-w-[160px]">{p.title}</div>
                                  {p.description && (
                                    <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[160px]">{p.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Category */}
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                {p.category}
                              </span>
                            </td>
                            {/* Price */}
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              ${p.price.toFixed(2)}
                            </td>
                            {/* Stock / Shipped */}
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{p.stock} in stock</span>
                                <span className="text-slate-400 text-[10px]">{p.shippedCount} shipped</span>
                              </div>
                            </td>
                            {/* Rating */}
                            <td className="py-3 px-3">
                              <span className="font-semibold text-amber-500">★ {p.rating.toFixed(1)}</span>
                              <span className="text-slate-400 text-[10px] ml-1">({p.ratingCount})</span>
                            </td>
                            {/* Status */}
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                p.status === "APPROVED"
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                  : p.status === "PENDING_APPROVAL"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            {/* Creator */}
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">{p.creatorName ?? "—"}</div>
                              <div className="text-[10px] text-slate-400">{p.creatorEmail ?? ""}</div>
                            </td>
                            {/* Date */}
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* ── USER: their own order history ── */
              <>
                {isOrdersLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading order history…</div>
                ) : userOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    No orders placed yet. Browse the catalog to purchase products!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {order.productImage ? (
                              <img src={order.productImage} alt={order.productTitle} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{order.productTitle}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Qty: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.quantity}</span>
                              {" • "}Unit: ${Number(order.unitPrice ?? 0).toFixed(2)}
                              {" • "}Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">${Number(order.totalAmount ?? 0).toFixed(2)}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Shipping: {order.shippingAddress}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            {order.status}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      }

      </div> {/* end TAB CONTENT WRAPPER */}

      {/* ─── ADD PRODUCT MODAL (Admin) ─── */}
      {
        showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Add New Product
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 font-medium">
                ℹ Note: Product will be created with status "PENDING_APPROVAL" and requires Manager approval before appearing on the root storefront.
              </p>

              {createError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ergonomic Office Chair"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Price ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="99.99"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="20"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Electronics, Apparel, Lifestyle..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key features, specifications, warranty..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
                  >
                    {isCreating ? "Submitting…" : "Submit for Approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ─── EDIT STOCK MODAL (Admin) ─── */}
      {
        editingStockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Manage Stock & Shipped
              </h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                {editingStockProduct.title}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stock Available
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStockValue((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={stockValue}
                      onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 px-3 py-1.5 text-center text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setStockValue((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Shipped Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippedValue}
                    onChange={(e) => setShippedValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-1.5 text-center text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStockProduct(null)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStock}
                    onClick={handleSaveStock}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    {isUpdatingStock ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
