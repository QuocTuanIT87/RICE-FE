import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import systemReducer from "./systemSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
