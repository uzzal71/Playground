'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { applyForLoan, clearLoanError } from '@/store/loanSlice';
import Navbar from '@/components/layout/Navbar';
import FieldError from '@/components/ui/FieldError';
import { Send, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoanApplyPage() {
  const { t, locale } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const { applyLoading, error, fieldErrors } = useAppSelector((state) => state.loans);

  const [form, setForm] = useState({
    loan_amount: '', loan_term_months: '', purpose: '', monthly_income: '',
    requested_date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error || Object.keys(fieldErrors).length > 0) dispatch(clearLoanError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      loan_amount: Number(form.loan_amount), loan_term_months: Number(form.loan_term_months),
      purpose: form.purpose, monthly_income: Number(form.monthly_income), requested_date: form.requested_date,
    };
    const result = await dispatch(applyForLoan(payload));
    if (applyForLoan.fulfilled.match(result)) {
      toast.success(t('loan.applySuccess'));
      router.push(`/loans/${result.payload.id}`);
    } else if (result.payload) {
      const firstKey = Object.keys(result.payload.fieldErrors)[0];
      toast.error(firstKey ? result.payload.fieldErrors[firstKey][0] : result.payload.message);
    }
  };

  const fontClass = locale === 'bn' ? 'font-bangla' : '';
  const inputClass = (field: string) =>
    `input-field ${fieldErrors[field]?.length ? '!border-red-500/50 !bg-red-500/5' : ''}`;

  const loanAmount = Number(form.loan_amount) || 0;
  const termMonths = Number(form.loan_term_months) || 0;
  const totalInterest = loanAmount * 0.1;
  const totalPayable = loanAmount + totalInterest;
  const monthlyInstallment = termMonths > 0 ? totalPayable / termMonths : 0;

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen ${fontClass}`}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{t('loan.applyTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('loan.applySubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('loan.loanAmount')} (৳)</label>
                  <input type="number" name="loan_amount" value={form.loan_amount} onChange={handleChange}
                    placeholder={t('loan.amountPlaceholder')} className={inputClass('loan_amount')} required min="1000" />
                  <FieldError errors={fieldErrors.loan_amount} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('loan.loanTerm')}</label>
                  <input type="number" name="loan_term_months" value={form.loan_term_months} onChange={handleChange}
                    placeholder={t('loan.termPlaceholder')} className={inputClass('loan_term_months')} required min="1" max="60" />
                  <FieldError errors={fieldErrors.loan_term_months} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('loan.purpose')}</label>
                <input type="text" name="purpose" value={form.purpose} onChange={handleChange}
                  placeholder={t('loan.purposePlaceholder')} className={inputClass('purpose')} required />
                <FieldError errors={fieldErrors.purpose} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('loan.monthlyIncome')} (৳)</label>
                  <input type="number" name="monthly_income" value={form.monthly_income} onChange={handleChange}
                    placeholder={t('loan.incomePlaceholder')} className={inputClass('monthly_income')} required min="0" />
                  <FieldError errors={fieldErrors.monthly_income} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('loan.requestedDate')}</label>
                  <input type="date" name="requested_date" value={form.requested_date} onChange={handleChange}
                    className={inputClass('requested_date')} required />
                  <FieldError errors={fieldErrors.requested_date} />
                </div>
              </div>

              <button type="submit" disabled={applyLoading} className="btn-primary w-full">
                {applyLoading ? <div className="spinner" /> : <><Send size={18} />{t('loan.applyBtn')}</>}
              </button>
            </form>
          </div>

          {/* Calculator */}
          <div className="glass-card p-6 h-fit animate-slide-up stagger-2">
            <div className="flex items-center gap-2 mb-5">
              <Calculator size={20} className="text-brand-600 dark:text-brand-400" />
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">{t('repayment.summary')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('loan.loanAmount')}</span>
                <span className="font-medium text-gray-900 dark:text-white">৳{loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('loan.totalInterest')}</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">৳{totalInterest.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-white/10" />
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('loan.totalPayable')}</span>
                <span className="font-display font-bold text-lg text-gray-900 dark:text-white">৳{totalPayable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('repayment.monthlyPayment')}</span>
                <span className="font-display font-bold text-brand-600 dark:text-brand-400">
                  ৳{monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
