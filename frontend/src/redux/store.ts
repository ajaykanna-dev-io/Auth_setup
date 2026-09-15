import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import authReducer from "./slices/auth/authSlice";
import cartReducer from "./slices/cart/cartSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;