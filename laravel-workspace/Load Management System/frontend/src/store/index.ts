import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import loanReducer from './loanSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loans: loanReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
