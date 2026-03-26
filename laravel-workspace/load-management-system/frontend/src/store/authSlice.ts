import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '@/lib/api';
import {
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ApiResponse,
  ApiErrorPayload,
  ValidationErrors,
} from '@/lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  fieldErrors: ValidationErrors;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  fieldErrors: {},
};

// ─── Helper: extract error details from API response ─────
function extractApiError(error: unknown, fallback: string): ApiErrorPayload {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return {
      message: data?.message || fallback,
      fieldErrors: data?.errors || {},
    };
  }
  return { message: fallback, fieldErrors: {} };
}

// ─── Async Thunks ────────────────────────────────────────

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterPayload,
  { rejectValue: ApiErrorPayload }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/register', payload);
    const data = response.data.data;

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Registration failed'));
  }
});

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginPayload,
  { rejectValue: ApiErrorPayload }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/login', payload);
    const data = response.data.data;

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Login failed'));
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async () => {
    try {
      await api.post('/logout');
    } catch (_error: unknown) {
      // Logout even if API call fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: ApiErrorPayload }
>('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<User>>('/me');
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Failed to fetch user'));
  }
});

// ─── Slice ───────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(state) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          state.accessToken = token;
          state.refreshToken = refresh;
          state.user = JSON.parse(userStr);
          state.isAuthenticated = true;
        }
      }
    },
    clearError(state) {
      state.error = null;
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.fieldErrors = {};
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        state.fieldErrors = action.payload?.fieldErrors || {};
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.fieldErrors = {};
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        state.fieldErrors = action.payload?.fieldErrors || {};
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.fieldErrors = {};
    });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { hydrateAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
