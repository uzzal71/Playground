'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logoutUser } from '@/store/authSlice';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/auth/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl
                    bg-white/80 border-b border-gray-200
                    dark:bg-neutral-900/80 dark:border-white/10
                    transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600
                            flex items-center justify-center shadow-lg shadow-brand-500/25
                            group-hover:shadow-brand-500/40 transition-shadow">
              <span className="text-white font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
              {t('common.appName')}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                             text-gray-600 dark:text-gray-300
                             hover:text-gray-900 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">{t('common.dashboard')}</span>
                </Link>
                <Link
                  href="/loans/apply"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                             text-gray-600 dark:text-gray-300
                             hover:text-gray-900 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <PlusCircle size={16} />
                  <span className="hidden sm:inline">{t('loan.applyNew')}</span>
                </Link>
              </>
            )}

            <ThemeToggle />
            <LanguageSwitcher />

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                           text-red-600 dark:text-red-400
                           hover:text-red-700 dark:hover:text-red-300
                           hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
