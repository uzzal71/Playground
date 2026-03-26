'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { registerUser, clearError } from '@/store/authSlice';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import FieldError from '@/components/ui/FieldError';
import { UserPlus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { t, locale } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);
  useGuestGuard();

  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '', address: '', password: '', password_confirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error || Object.keys(fieldErrors).length > 0) dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) {
      toast.success(t('auth.registerSuccess'));
      router.push('/dashboard');
    } else if (result.payload) {
      const firstKey = Object.keys(result.payload.fieldErrors)[0];
      if (firstKey && result.payload.fieldErrors[firstKey]?.[0]) {
        toast.error(result.payload.fieldErrors[firstKey][0]);
      } else {
        toast.error(result.payload.message);
      }
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
                {t('auth.registerTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('auth.registerSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="animate-slide-up stagger-1">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.fullName')}</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder={t('auth.fullNamePlaceholder')} className={inputClass('full_name')} required />
                <FieldError errors={fieldErrors.full_name} />
              </div>

              <div className="animate-slide-up stagger-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.email')}</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder')} className={inputClass('email')} required />
                <FieldError errors={fieldErrors.email} />
              </div>

              <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.mobile')}</label>
                  <input type="text" name="mobile" value={form.mobile} onChange={handleChange}
                    placeholder={t('auth.mobilePlaceholder')} className={inputClass('mobile')} required />
                  <FieldError errors={fieldErrors.mobile} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.address')}</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder={t('auth.addressPlaceholder')} className={inputClass('address')} required />
                  <FieldError errors={fieldErrors.address} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.password')}</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange}
                    placeholder={t('auth.passwordPlaceholder')} className={inputClass('password')} required minLength={8} />
                  <FieldError errors={fieldErrors.password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('auth.confirmPassword')}</label>
                  <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange}
                    placeholder={t('auth.confirmPasswordPlaceholder')} className={inputClass('password_confirmation')} required minLength={8} />
                  <FieldError errors={fieldErrors.password_confirmation} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full animate-slide-up stagger-5">
                {loading ? <div className="spinner" /> : <><UserPlus size={18} />{t('auth.registerBtn')}</>}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-400 dark:text-gray-500 text-sm animate-slide-up stagger-6">
              {t('auth.hasAccount')}{' '}
              <Link href="/auth/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">
                {t('auth.login')} <ArrowRight size={14} className="inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
