import { api } from "../../api";
import type {
  Product,
  OrderItem,
  CreateProductRequest,
  UpdateStockRequest,
  CheckoutRequest,
  RateProductRequest,
} from "../../../types/product.types";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPublicProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),

    getAdminProducts: builder.query<Product[], void>({
      query: () => "/products/admin/all",
      providesTags: ["AdminProducts"],
    }),

    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Products", id }],
    }),

    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminProducts", "Products"],
    }),

    updateApprovalStatus: builder.mutation<
      Product,
      { id: string; status: "APPROVED" | "REJECTED" }
    >({
      query: ({ id, status }) => ({
        url: `/products/${id}/approval`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Products", "AdminProducts"],
    }),

    deleteProduct: builder.mutation<{ message: string; id: string }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "AdminProducts"],
    }),

    updateStock: builder.mutation<
      Product,
      { id: string; body: UpdateStockRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}/stock`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Products", "AdminProducts"],
    }),

    checkout: builder.mutation<
      { message: string; grandTotal: number; orders: OrderItem[] },
      CheckoutRequest
    >({
      query: (body) => ({
        url: "/products/checkout",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "AdminProducts", "Orders"],
    }),

    rateProduct: builder.mutation<
      { message: string; product: { id: string; rating: number; ratingCount: number } },
      { id: string; body: RateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}/rate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "AdminProducts"],
    }),

    getUserOrders: builder.query<OrderItem[], void>({
      query: () => "/products/user/orders",
      providesTags: ["Orders"],
    }),

    getAllOrders: builder.query<Product[], void>({
      query: () => "/products/all-orders",
      providesTags: ["Orders"],
    }),
  }),
});

export const {
  useGetPublicProductsQuery,
  useGetAdminProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateApprovalStatusMutation,
  useDeleteProductMutation,
  useUpdateStockMutation,
  useCheckoutMutation,
  useRateProductMutation,
  useGetUserOrdersQuery,
  useGetAllOrdersQuery
} = productApi;
