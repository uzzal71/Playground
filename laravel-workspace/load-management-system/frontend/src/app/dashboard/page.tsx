'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchLoans } from '@/store/loanSlice';
import Navbar from '@/components/layout/Navbar';
import { Wallet, TrendingUp, CreditCard, FileText, PlusCircle, Eye, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAppSelector((state) => state.auth);
  const { loans, loading } = useAppSelector((state) => state.loans);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchLoans());
  }, [isAuthenticated, dispatch]);

  const fontClass = locale === 'bn' ? 'font-bangla' : '';
  const totalLoans = loans.length;
  const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.loan_amount), 0);
  const totalPayable = loans.reduce((sum, l) => sum + Number(l.total_payable), 0);
  const activeLoans = loans.filter((l) => l.status === 'APPROVED').length;

  const stats = [
    { label: t('dashboard.totalLoans'), value: totalLoans.toString(), icon: FileText, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { label: t('dashboard.totalBorrowed'), value: `৳${totalBorrowed.toLocaleString()}`, icon: Wallet, color: 'from-brand-500 to-brand-600', shadow: 'shadow-brand-500/20' },
    { label: t('dashboard.totalPayable'), value: `৳${totalPayable.toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
    { label: t('dashboard.activeLoans'), value: activeLoans.toString(), icon: CreditCard, color: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/20' },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen ${fontClass}`}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">
            {t('common.welcome')}, {user?.full_name} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`glass-card p-5 animate-slide-up stagger-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}>
                  <stat.icon size={18} className="text-white" />
                </div>
                <ArrowUpRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions + Loans Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 animate-slide-up stagger-5">
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.quickActions')}
            </h2>
            <Link href="/loans/apply"
              className="flex items-center gap-3 p-3 rounded-xl
                         bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20
                         hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center
                              group-hover:bg-brand-200 dark:group-hover:bg-brand-500/30 transition-colors">
                <PlusCircle size={18} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('loan.applyNew')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('loan.applySubtitle')}</p>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-2 glass-card p-6 animate-slide-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                {t('dashboard.recentLoans')}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-400 dark:text-gray-500">{t('loan.noLoans')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('loan.loanAmount')}</th>
                      <th>{t('loan.loanTerm')}</th>
                      <th>{t('loan.purpose')}</th>
                      <th>{t('loan.status')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.slice(0, 5).map((loan) => (
                      <tr key={loan.id}>
                        <td className="font-medium text-gray-900 dark:text-white">
                          ৳{Number(loan.loan_amount).toLocaleString()}
                        </td>
                        <td>{loan.loan_term_months} {locale === 'bn' ? 'মাস' : 'months'}</td>
                        <td>{loan.purpose}</td>
                        <td>
                          <span className={loan.status === 'APPROVED' ? 'badge-approved' : loan.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}>
                            {t(`loan.${loan.status.toLowerCase()}`)}
                          </span>
                        </td>
                        <td>
                          <Link href={`/loans/${loan.id}`}
                            className="flex items-center gap-1 text-brand-600 dark:text-brand-400
                                       hover:text-brand-700 dark:hover:text-brand-300 text-sm transition-colors">
                            <Eye size={14} />{t('loan.viewSchedule')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
