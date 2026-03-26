'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchRepayments, fetchLoans } from '@/store/loanSlice';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeft, Calendar, Wallet, TrendingUp } from 'lucide-react';

export default function LoanDetailPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuthGuard();
  const { currentLoan, repayments, repaymentsLoading, loans } = useAppSelector((state) => state.loans);
  const loanId = Number(params.id);

  useEffect(() => {
    if (isAuthenticated && loanId) {
      if (loans.length === 0) dispatch(fetchLoans());
      dispatch(fetchRepayments(loanId));
    }
  }, [isAuthenticated, loanId, dispatch, loans.length]);

  const fontClass = locale === 'bn' ? 'font-bangla' : '';
  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen ${fontClass}`}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500
                     hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft size={16} />{t('repayment.backToLoans')}
        </Link>

        {currentLoan && (
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{t('loan.loanDetails')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{currentLoan.purpose}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-brand-600 dark:text-brand-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('loan.loanAmount')}</span>
                </div>
                <p className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  ৳{Number(currentLoan.loan_amount).toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('loan.loanTerm')}</span>
                </div>
                <p className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  {currentLoan.loan_term_months} {locale === 'bn' ? 'মাস' : 'months'}
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('loan.totalInterest')}</span>
                </div>
                <p className="text-xl font-display font-bold text-amber-600 dark:text-amber-400">
                  ৳{Number(currentLoan.total_interest).toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('loan.totalPayable')}</span>
                </div>
                <p className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  ৳{Number(currentLoan.total_payable).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Repayment Table */}
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-1">{t('repayment.title')}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{t('repayment.subtitle')}</p>

          {repaymentsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner" /></div>
          ) : repayments.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('common.noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('repayment.installmentNo')}</th>
                    <th>{t('repayment.dueDate')}</th>
                    <th>{t('repayment.principal')}</th>
                    <th>{t('repayment.interest')}</th>
                    <th>{t('repayment.installment')}</th>
                    <th>{t('repayment.remainingBalance')}</th>
                    <th>{t('repayment.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {repayments.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                                         bg-gray-100 dark:bg-white/5 text-sm font-medium
                                         text-gray-900 dark:text-white">
                          {row.installment_number}
                        </span>
                      </td>
                      <td>{new Date(row.due_date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>৳{Number(row.principal_amount).toLocaleString()}</td>
                      <td className="text-amber-600 dark:text-amber-400">৳{Number(row.interest_amount).toLocaleString()}</td>
                      <td className="font-medium text-gray-900 dark:text-white">৳{Number(row.installment_amount).toLocaleString()}</td>
                      <td>৳{Number(row.remaining_balance).toLocaleString()}</td>
                      <td><span className={row.status === 'PAID' ? 'badge-approved' : 'badge-pending'}>{t(`repayment.${row.status.toLowerCase()}`)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
