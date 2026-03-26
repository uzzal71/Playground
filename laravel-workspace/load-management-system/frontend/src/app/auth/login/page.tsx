'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { loginUser, clearError } from '@/store/authSlice';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import FieldError from '@/components/ui/FieldError';
import { LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t, locale } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);
  useGuestGuard();

  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error || Object.keys(fieldErrors).length > 0) dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success(t('auth.loginSuccess'));
      router.push('/dashboard');
    } else if (result.payload) {
      toast.error(result.payload.message);
    }
  };

  const fontClass = locale === 'bn' ? 'font-bangla' : '';
  const inputClass = (field: string) =>
    `input-field ${fieldErrors[field]?.length ? '!border-red-500/50 !bg-red-500/5' : ''}`;

  return (
    <div className={`min-h-screen flex ${fontClass}`}>
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900
                      dark:from-brand-800 dark:via-brand-900 dark:to-neutral-900
                      items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-400 blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-brand-300 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <span className="text-3xl font-display font-bold text-white">M</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">{t('common.appName')}</h1>
          <p className="text-xl text-brand-100/80 leading-relaxed">{t('common.tagline')}</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-neutral-900 transition-colors">
        <div className="flex justify-end gap-2 p-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.loginTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('auth.loginSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-slide-up stagger-1">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder')} className={inputClass('email')} required />
                <FieldError errors={fieldErrors.email} />
              </div>

              <div className="animate-slide-up stagger-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('auth.password')}
                </label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder={t('auth.passwordPlaceholder')} className={inputClass('password')} required />
                <FieldError errors={fieldErrors.password} />
              </div>

              {error && Object.keys(fieldErrors).length === 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                                text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full animate-slide-up stagger-3">
                {loading ? <div className="spinner" /> : <><LogIn size={18} />{t('auth.loginBtn')}</>}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-400 dark:text-gray-500 text-sm animate-slide-up stagger-4">
              {t('auth.noAccount')}{' '}
              <Link href="/auth/register" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">
                {t('auth.register')} <ArrowRight size={14} className="inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
