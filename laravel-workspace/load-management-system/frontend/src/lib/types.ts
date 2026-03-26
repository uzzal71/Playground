// ─── User ────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────
export interface RegisterPayload {
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ─── Loan ────────────────────────────────────────────────
export interface Loan {
  id: number;
  user_id: number;
  loan_amount: number;
  loan_term_months: number;
  purpose: string;
  monthly_income: number;
  requested_date: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  total_interest: number;
  total_payable: number;
  repayment_schedules?: RepaymentSchedule[];
  created_at: string;
}

export interface LoanApplyPayload {
  loan_amount: number;
  loan_term_months: number;
  purpose: string;
  monthly_income: number;
  requested_date: string;
}

// ─── Repayment ───────────────────────────────────────────
export interface RepaymentSchedule {
  id: number;
  loan_id: number;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  installment_amount: number;
  remaining_balance: number;
  status: 'PENDING' | 'PAID';
}

// ─── API Response ────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Validation / Error ──────────────────────────────────
export interface ValidationErrors {
  [field: string]: string[];
}

export interface ApiErrorPayload {
  message: string;
  fieldErrors: ValidationErrors;
}
