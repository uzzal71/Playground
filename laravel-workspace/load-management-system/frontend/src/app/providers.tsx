'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/hooks/useTheme';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              className: '!bg-white !text-gray-900 !border !border-gray-200 dark:!bg-neutral-800 dark:!text-white dark:!border-white/10',
              style: {
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </I18nProvider>
    </Provider>
  );
}
