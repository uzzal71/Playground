import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '@/lib/api';
import {
  Loan,
  LoanApplyPayload,
  RepaymentSchedule,
  ApiResponse,
  ApiErrorPayload,
  ValidationErrors,
} from '@/lib/types';

interface LoanState {
  loans: Loan[];
  currentLoan: Loan | null;
  repayments: RepaymentSchedule[];
  loading: boolean;
  applyLoading: boolean;
  repaymentsLoading: boolean;
  error: string | null;
  fieldErrors: ValidationErrors;
}

const initialState: LoanState = {
  loans: [],
  currentLoan: null,
  repayments: [],
  loading: false,
  applyLoading: false,
  repaymentsLoading: false,
  error: null,
  fieldErrors: {},
};

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

export const fetchLoans = createAsyncThunk<
  Loan[],
  void,
  { rejectValue: ApiErrorPayload }
>('loans/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<Loan[]>>('/loans');
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Failed to fetch loans'));
  }
});

export const applyForLoan = createAsyncThunk<
  Loan,
  LoanApplyPayload,
  { rejectValue: ApiErrorPayload }
>('loans/apply', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<Loan>>('/loans/apply', payload);
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Loan application failed'));
  }
});

export const fetchRepayments = createAsyncThunk<
  { loanId: number; repayments: RepaymentSchedule[] },
  number,
  { rejectValue: ApiErrorPayload }
>('loans/fetchRepayments', async (loanId, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<RepaymentSchedule[]>>(
      `/loans/${loanId}/repayments`
    );
    return { loanId, repayments: response.data.data };
  } catch (error: unknown) {
    return rejectWithValue(extractApiError(error, 'Failed to fetch repayments'));
  }
});

// ─── Slice ───────────────────────────────────────────────

const loanSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    clearLoanError(state) {
      state.error = null;
      state.fieldErrors = {};
    },
    setCurrentLoan(state, action: PayloadAction<Loan | null>) {
      state.currentLoan = action.payload;
    },
    clearRepayments(state) {
      state.repayments = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch loans
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action: PayloadAction<Loan[]>) => {
        state.loading = false;
        state.loans = action.payload;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch loans';
      });

    // Apply for loan
    builder
      .addCase(applyForLoan.pending, (state) => {
        state.applyLoading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(applyForLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.applyLoading = false;
        state.loans.unshift(action.payload);
        state.currentLoan = action.payload;
        state.fieldErrors = {};
      })
      .addCase(applyForLoan.rejected, (state, action) => {
        state.applyLoading = false;
        state.error = action.payload?.message || 'Loan application failed';
        state.fieldErrors = action.payload?.fieldErrors || {};
      });

    // Fetch repayments
    builder
      .addCase(fetchRepayments.pending, (state) => {
        state.repaymentsLoading = true;
        state.error = null;
      })
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.repaymentsLoading = false;
        state.repayments = action.payload.repayments;
        const loan = state.loans.find((l) => l.id === action.payload.loanId);
        if (loan) {
          state.currentLoan = loan;
        }
      })
      .addCase(fetchRepayments.rejected, (state, action) => {
        state.repaymentsLoading = false;
        state.error = action.payload?.message || 'Failed to fetch repayments';
      });
  },
});

export const { clearLoanError, setCurrentLoan, clearRepayments } = loanSlice.actions;
export default loanSlice.reducer;
